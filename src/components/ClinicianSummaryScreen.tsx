import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import { readClinicianSummaryData, ClinicianSummaryData } from '../services/clinicianSummaryStorage';

const PINK = '#E8558D';
const DEEP_PINK = '#B23A63';
const TEXT = '#512D3D';
const MUTED = '#9A7585';

type RouteParams = {
  name?: string | string[];
  lmp?: string | string[];
  edd?: string | string[];
  dueDate?: string | string[];
  doctorConfirmedEdd?: string | string[];
  pregnancyAnswers?: string | string[];
  gestationalAge?: string | string[];
  trimester?: string | string[];
  formattedEdd?: string | string[];
};

type FollowUpResponses = {
  newSymptoms: string;
  symptomProgress: string;
  medicinesTaken: string;
  medicineSideEffects: string;
  newMedicines: string;
  bloodUrineTests: string;
  ultrasoundScans: string;
  doctorDiscussion: string;
};

const QUESTIONS: { id: keyof FollowUpResponses; question: string; placeholder: string }[] = [
  { id: 'newSymptoms', question: 'Since your last visit, have you experienced any new symptoms?', placeholder: 'Describe any new symptoms...' },
  { id: 'symptomProgress', question: 'Are your symptoms getting better, staying the same, or getting worse?', placeholder: 'Enter your response...' },
  { id: 'medicinesTaken', question: 'Have you taken your prescribed medicines regularly?', placeholder: 'Yes / No. Please provide details...' },
  { id: 'medicineSideEffects', question: 'Have you experienced any side effects or difficulty taking your medicines?', placeholder: 'Describe any side effects or difficulties...' },
  { id: 'newMedicines', question: 'Have you started any new medicines, vitamins, supplements, or home remedies?', placeholder: 'Mention medicines, vitamins or supplements...' },
  { id: 'bloodUrineTests', question: 'Have you completed all the blood and urine tests requested at your last visit?', placeholder: 'Yes / No. Mention pending tests...' },
  { id: 'ultrasoundScans', question: 'Have you completed your ultrasound scans and received the reports?', placeholder: 'Yes / No. Mention scan or report status...' },
  { id: 'doctorDiscussion', question: 'Is there anything new you would like the doctor to know or discuss?', placeholder: 'Enter any concerns or questions...' },
];

const emptyResponses: FollowUpResponses = {
  newSymptoms: '', symptomProgress: '', medicinesTaken: '', medicineSideEffects: '',
  newMedicines: '', bloodUrineTests: '', ultrasoundScans: '', doctorDiscussion: '',
};

function getParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function safeJson(value: string): Record<string, any> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function displayValue(value: any, fallback = 'Unavailable'): string {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeHtml(value: any): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char] as string));
}

function compactText(value: any, fallback = 'Unavailable'): string {
  const text = displayValue(value, fallback).replace(/\s+/g, ' ').trim();
  return text.length > 230 ? `${text.slice(0, 227)}…` : text;
}

function getMealSummary(nutrition: ClinicianSummaryData['nutrition']): string {
  const entries = nutrition?.entries;
  if (!entries) return 'Unavailable';
  const labels = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];
  const parts = labels.map(label => {
    const items = (entries as any)[label] as any[] | undefined;
    if (!items?.length) return '';
    const foods = items.map(item => `${item.food?.name ?? 'Food'} (${item.grams ?? '?'} g)`);
    return `${label}: ${foods.join(', ')}`;
  }).filter(Boolean);
  return parts.length ? parts.join('; ') : 'No meals logged';
}

function getAverageCalories(
  nutrition: ClinicianSummaryData['nutrition']
): string {
  const calories = nutrition?.totalCalories;

  return typeof calories === 'number' && calories > 0
    ? `${Math.round(calories)} kcal/day`
    : 'Unavailable';
}

function getHealthSummary(data: ClinicianSummaryData, symptoms = ''): [string, string][] {
  const readings = data.health?.readings;
  const hasPatientReadings = data.health?.readingSource === 'Manual';
  const fmt = (key: string, unit: string) => hasPatientReadings && readings && readings[key] !== undefined
    ? `${readings[key]} ${unit}` : 'Unavailable';
  const sleep = hasPatientReadings && readings?.sleep_hours !== undefined
    ? `${readings.sleep_hours} hours` : 'Unavailable';
  return [
    ['Symptoms since last visit', symptoms.trim() ? compactText(symptoms) : 'Unavailable'],
    ['Average Heart rate', fmt('heart_rate', 'bpm')],
    ['Average SpO₂', fmt('spo2', '%')],
    ['Blood pressure', 'Unavailable'],
    ['Average Sleep', sleep],
    ['Average Daily steps', fmt('steps', 'steps')],
    ['ECG / PPG', 'Unavailable'],
    ['Reading source / sync', hasPatientReadings ? (data.health?.lastSynced || 'Manual entry') : 'No patient reading saved; demo values excluded'],
  ];
}

function buildClinicianPdf(args: {
  name: string;
  pregnancyRows: [string, string][];
  healthRows: [string, string][];
  nutritionSummary: string;
  hydration: string;
  exercise: string;
  followUpSummary: string;
  patientQuestions: string;
}) {
  const rows = (items: [string, string][]) => items.map(([label, value]) =>
    `<div class="kv"><span class="k">${escapeHtml(label)}</span><span class="v">${escapeHtml(value)}</span></div>`
  ).join('');

  const section = (number: number, title: string, content: string) =>
    `<section class="panel"><h2><b>${number}</b>${escapeHtml(title)}</h2>${content}</section>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    @page { size: A4 portrait; margin: 7mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #352536; font-size: 7.4px; line-height: 1.25; }
    .top { display: flex; align-items: center; justify-content: space-between; background: #173B63; color: #fff; padding: 9px 12px; border-radius: 7px; margin-bottom: 6px; }
    h1 { margin: 0; font-size: 17px; letter-spacing: .1px; }
    .sub { margin-top: 3px; font-size: 8px; color: #FBEAF1; }
    .meta { text-align: right; font-size: 7px; line-height: 1.5; }
    .notice { background: #FCEAF1; border-left: 3px solid #B23A63; padding: 5px 7px; margin-bottom: 6px; font-size: 7px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; align-items: start; }
    .panel { border: 1px solid #DCE5ED; border-radius: 6px; overflow: hidden; break-inside: avoid; }
    h2 { margin: 0; padding: 5px 6px; color: #fff; background: #173B63; font-size: 8.3px; line-height: 1.2; }
    h2 b { display: inline-block; background: #E8558D; color: #fff; border-radius: 50%; width: 13px; height: 13px; line-height: 13px; text-align: center; margin-right: 5px; font-size: 7px; }
    .panel-body { padding: 5px 6px; }
    .kv { display: flex; gap: 6px; padding: 2px 0; border-bottom: 1px solid #EEF1F4; min-height: 13px; }
    .kv:last-child { border-bottom: 0; }
    .k { flex: 0 0 42%; color: #73596A; font-weight: bold; }
    .v { flex: 1; color: #352536; overflow-wrap: anywhere; }
    .text { padding: 5px 6px; overflow-wrap: anywhere; font-size: 6.5px; line-height: 1.2; }
    .text p { margin: 0 0 3px; }
    .muted { color: #856D7B; }
    .pillrow { display: flex; gap: 4px; flex-wrap: wrap; padding: 5px 6px; }
    .pill { background: #FCEAF1; color: #7D3454; border-radius: 4px; padding: 4px 5px; }
    .footer { margin-top: 6px; padding: 5px 7px; background: #FCEAF1; color: #795466; border-radius: 5px; font-size: 6.6px; line-height: 1.3; }
    .generated { float: right; color: #8B7180; }
  </style></head><body>
    <header class="top"><div><h1>MumWise</h1><div class="sub">Maternal Health Visit Brief · Clinician Review</div></div><div class="meta"><b>${escapeHtml(args.name)}</b><br/>Generated ${escapeHtml(new Date().toLocaleString())}<br/>Patient-reported information</div></header>
    <div class="grid">
      ${section(1, 'Patient & Pregnancy Profile', `<div class="panel-body">${rows(args.pregnancyRows)}</div>`)}
      ${section(2, 'Health & Symptoms', `<div class="panel-body">${rows(args.healthRows.filter(([label]) => ['Symptoms since last visit','Blood pressure','ECG / PPG'].includes(label)))}</div>`)}
      ${section(3, 'Wearable Measurements', `<div class="panel-body">${rows(args.healthRows.filter(([label]) => ['Average Heart rate','Average SpO₂','Average Sleep','Average Daily steps'].includes(label)))}</div>`)}
      ${section(4, 'Nutrition & Hydration', `<div class="text"><p><b>Average calories per day:</b> ${escapeHtml(args.nutritionSummary)}</p><p><b>Average water intake:</b> ${escapeHtml(args.hydration)}</p></div>`)}
      ${section(5, 'Exercise & Yoga', `<div class="text"><p><b>Average activity duration:</b> ${escapeHtml(args.exercise)}</p></div>`)}
      ${section(6, 'Uploaded Reports & Laboratory Results', `<div class="text"><p><b>Original uploaded documents:</b> Unavailable</p><p><b>Extracted laboratory results:</b> Unavailable</p></div>`)}
      ${section(7, 'Patient Follow-up Summary', `<div class="text">${args.followUpSummary}</div>`)}
      ${section(8, 'Patient Questions for the Doctor', `<div class="text">${escapeHtml(args.patientQuestions)}</div>`)}
    </div>
  </body></html>`;
}

export default function ClinicianSummaryScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const [responses, setResponses] = useState<FollowUpResponses>(emptyResponses);
  const [summaryData, setSummaryData] = useState<ClinicianSummaryData>({});
  const [loadingData, setLoadingData] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const name = getParam(params.name).trim() || 'Mother';
  const answers = useMemo(() => safeJson(getParam(params.pregnancyAnswers)), [params.pregnancyAnswers]);
  const lmp = getParam(params.lmp);
  const doctorEdd = getParam(params.doctorConfirmedEdd);
  const dueDate = getParam(params.dueDate);
  const edd = getParam(params.formattedEdd) || getParam(params.edd);
  const gestationalAge = getParam(params.gestationalAge);
  const trimester = getParam(params.trimester);

  useEffect(() => {
    let active = true;
    readClinicianSummaryData().then(data => {
      if (active) setSummaryData(data);
    }).catch(error => console.warn('Clinician summary load failed:', error))
      .finally(() => { if (active) setLoadingData(false); });
    return () => { active = false; };
  }, []);

  const pregnancyRows = useMemo((): [string, string][] => [
    ['Patient name', name],
    ['LMP', displayValue(answers.lmp ?? lmp)],
    ['Pregnancy confirmation', displayValue(answers.pregnancyConfirmedDate)],
    ['Clinician visit', displayValue(answers.clinicianVisit)],
    ['Dating ultrasound', displayValue(answers.ultrasound)],
    ['Doctor-confirmed EDD', displayValue(answers.doctorEdd ?? doctorEdd)],
    ['App due date', displayValue(dueDate || edd)],
    ['Gestational age / trimester', [gestationalAge, trimester].filter(Boolean).join(' · ') || 'Unavailable'],
    ['First pregnancy', displayValue(answers.firstPregnancy)],
    ['Previous complications', compactText(answers.previousComplications)],
    ['Medical conditions', compactText(answers.medicalConditions)],
    ['Allergies', compactText(answers.allergies)],
    ['Medicines / supplements', compactText(answers.medicines)],
    ['Patient-noted report details', compactText(answers.reports)],
  ], [name, answers, lmp, doctorEdd, dueDate, edd, gestationalAge, trimester]);

  const healthRows = useMemo(() => getHealthSummary(summaryData, responses.newSymptoms), [summaryData, responses.newSymptoms]);
  const nutritionSummary = useMemo(() => getMealSummary(summaryData.nutrition), [summaryData.nutrition]);
  const hydration = summaryData.nutrition?.waterMl && summaryData.nutrition.waterMl > 0
    ? `${summaryData.nutrition.waterMl.toLocaleString()} ml logged` : 'Unavailable';
  const exercise = summaryData.exercise?.saved && summaryData.exercise.durationMinutes !== undefined
    ? `${summaryData.exercise.durationMinutes} minutes` : 'Unavailable';

  const updateResponse = (id: keyof FollowUpResponses, value: string) => {
    setResponses(previous => ({ ...previous, [id]: value }));
  };

  const followUpSummary = useMemo(() => {
    const labels: [keyof FollowUpResponses, string][] = [
      ['newSymptoms', 'New symptoms'], ['symptomProgress', 'Symptom trend'],
      ['medicinesTaken', 'Medication adherence'], ['medicineSideEffects', 'Side effects / difficulties'],
      ['newMedicines', 'New medicines / supplements'], ['bloodUrineTests', 'Blood / urine tests'],
      ['ultrasoundScans', 'Ultrasound / scan status'],
    ];
    const items = labels.filter(([key]) => responses[key].trim()).map(([key, label]) =>
      `<p><b>${escapeHtml(label)}:</b> ${escapeHtml(compactText(responses[key]))}</p>`
    );
    return items.length ? items.join('') : '<span class="muted">No follow-up updates entered.</span>';
  }, [responses]);

  const answeredCount = QUESTIONS.filter(item => responses[item.id].trim()).length;

  const handleGeneratePdf = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      // Refresh once more at generation time so the PDF uses the latest saved edits.
      const latest = await readClinicianSummaryData();
      setSummaryData(latest);
      const healthRowsAtGeneration = getHealthSummary(latest, responses.newSymptoms);
      const html = buildClinicianPdf({
        name,
        pregnancyRows,
        healthRows: healthRowsAtGeneration,
        nutritionSummary: getAverageCalories(latest.nutrition),
        hydration: latest.nutrition?.waterMl && latest.nutrition.waterMl > 0 ? `${latest.nutrition.waterMl.toLocaleString()} ml logged` : 'Unavailable',
        exercise: latest.exercise?.saved && latest.exercise.durationMinutes !== undefined ? `${latest.exercise.durationMinutes} minutes` : 'Unavailable',
        followUpSummary,
        patientQuestions: compactText(responses.doctorDiscussion),
      });
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Clinician summary PDF error:', error);
      Alert.alert('PDF Generation Failed', 'Unable to generate the clinician summary. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <LinearGradient colors={['#FDEDF3', '#FBE0E9', '#FFF8FB']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={DEEP_PINK} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Clinician Summary</Text>
            <Text style={styles.headerSubtitle}>Your next antenatal visit</Text>
          </View>
          <Ionicons name="document-text-outline" size={26} color={DEEP_PINK} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <LinearGradient colors={['#E8558D', '#B23A63']} style={styles.welcomeCard}>
            <Ionicons name="medical-outline" size={32} color="#FFFFFF" />
            <Text style={styles.welcomeTitle}>Prepare for your next doctor visit</Text>
            <Text style={styles.welcomeDescription}>Your latest saved tracking values and pregnancy details will be summarised in a one-page clinician brief.</Text>
          </LinearGradient>
          <View style={styles.patientCard}>
            <View style={styles.patientIcon}><Ionicons name="person-outline" size={24} color={DEEP_PINK} /></View>
            <View style={{ flex: 1 }}><Text style={styles.patientLabel}>PATIENT NAME</Text><Text style={styles.patientName}>{name}</Text></View>
            <Ionicons name="checkmark-circle" size={23} color="#45B96B" />
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visit updates</Text>
            <Text style={styles.progressText}>{answeredCount}/8 entered</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(answeredCount / 8) * 100}%` }]} /></View>
          {QUESTIONS.map((item, index) => (
            <View key={item.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.numberBadge}><Text style={styles.numberText}>{index + 1}</Text></View>
                <Text style={styles.questionText}>{item.question}</Text>
              </View>
              <TextInput
                style={styles.answerInput}
                placeholder={item.placeholder}
                placeholderTextColor="#B69AA6"
                value={responses[item.id]}
                onChangeText={value => updateResponse(item.id, value)}
                multiline
                textAlignVertical="top"
              />
            </View>
          ))}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={22} color="#478FC7" />
            <Text style={styles.infoText}>{loadingData ? 'Loading saved tracking values…' : 'The PDF uses the latest saved values. Information not collected by the current app is marked Unavailable.'}</Text>
          </View>
          <TouchableOpacity style={[styles.generateButton, generatingPdf && { opacity: 0.7 }]} onPress={handleGeneratePdf} disabled={generatingPdf || loadingData} activeOpacity={0.85}>
            {generatingPdf || loadingData ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="download-outline" size={22} color="#FFFFFF" />}
            <Text style={styles.generateButtonText}>{generatingPdf ? 'Generating Summary…' : loadingData ? 'Loading saved data…' : 'Generate Clinician Summary PDF'}</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>Made with love by MumWise 💗</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#FFFFFFCC' },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FCE3ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: DEEP_PINK }, headerSubtitle: { fontSize: 11, color: MUTED, marginTop: 3 },
  scrollContent: { padding: 18, paddingBottom: 35 },
  welcomeCard: { borderRadius: 21, padding: 19, marginBottom: 17 },
  welcomeTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 12 },
  welcomeDescription: { color: '#FFEAF1', fontSize: 12, lineHeight: 19, marginTop: 7 },
  patientCard: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 23, borderWidth: 1, borderColor: '#F3D4E0' },
  patientIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#FCE3ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  patientLabel: { fontSize: 9, color: MUTED, fontWeight: '800', letterSpacing: 0.8 }, patientName: { fontSize: 15, color: TEXT, fontWeight: '800', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  sectionTitle: { fontSize: 17, color: TEXT, fontWeight: '800' }, progressText: { fontSize: 11, color: DEEP_PINK, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#F1D7E1', borderRadius: 5, marginBottom: 17, overflow: 'hidden' }, progressFill: { height: 6, backgroundColor: PINK, borderRadius: 5 },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F3DCE5' },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 }, numberBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#FCE3ED', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  numberText: { fontSize: 13, fontWeight: '800', color: DEEP_PINK }, questionText: { flex: 1, color: TEXT, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  answerInput: { minHeight: 75, backgroundColor: '#FFF6F9', borderWidth: 1, borderColor: '#F1D6E1', borderRadius: 11, padding: 12, fontSize: 12, color: TEXT, lineHeight: 18 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF4FC', borderRadius: 14, padding: 13, marginTop: 5, marginBottom: 19 },
  infoText: { flex: 1, fontSize: 11, color: '#52718A', lineHeight: 17, marginLeft: 9 },
  generateButton: { backgroundColor: DEEP_PINK, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  generateButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, footer: { textAlign: 'center', color: MUTED, fontSize: 11, marginTop: 22 },
});
