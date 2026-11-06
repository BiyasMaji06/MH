import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';

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
};

const QUESTIONS = [
  {
    id: 'newSymptoms',
    question:
      'Since your last visit, have you experienced any new symptoms?',
    placeholder: 'Describe any new symptoms...',
  },
  {
    id: 'symptomProgress',
    question:
      'Are your symptoms getting better, staying the same, or getting worse?',
    placeholder: 'Enter your response...',
  },
  {
    id: 'medicinesTaken',
    question:
      'Have you taken your prescribed medicines regularly?',
    placeholder: 'Yes / No. Please provide details...',
  },
  {
    id: 'medicineSideEffects',
    question:
      'Have you experienced any side effects or difficulty taking your medicines?',
    placeholder: 'Describe any side effects or difficulties...',
  },
  {
    id: 'newMedicines',
    question:
      'Have you started any new medicines, vitamins, supplements, or home remedies?',
    placeholder: 'Mention medicines, vitamins or supplements...',
  },
  {
    id: 'bloodUrineTests',
    question:
      'Have you completed all the blood and urine tests requested at your last visit?',
    placeholder: 'Yes / No. Mention pending tests...',
  },
  {
    id: 'ultrasoundScans',
    question:
      'Have you completed your ultrasound scans and received the reports?',
    placeholder: 'Yes / No. Mention scan or report status...',
  },
  {
    id: 'doctorDiscussion',
    question:
      'Is there anything new you would like the doctor to know or discuss?',
    placeholder: 'Enter any concerns or questions...',
  },
];

function getParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function safeJson(value: string): Record<string, any> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function displayValue(value: any): string {
  if (value === undefined || value === null || value === '') {
    return 'Not provided';
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'Not provided';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function escapeHtml(value: any): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] as string));
}

const APP_FIELDS: [string, string][] = [
  ['Last menstrual period (LMP)', 'lmp'],
  ['Pregnancy confirmed date', 'pregnancyConfirmedDate'],
  ['Clinician visit', 'clinicianVisit'],
  ['Dating ultrasound', 'ultrasound'],
  ['Doctor-confirmed EDD', 'doctorEdd'],
  ['First pregnancy', 'firstPregnancy'],
  ['Previous pregnancy complications', 'previousComplications'],
  ['Medical conditions', 'medicalConditions'],
  ['Drug allergies', 'allergies'],
  ['Current medicines / supplements', 'medicines'],
  ['Diagnostic reports', 'reports'],
];

function buildClinicianPdf(
  name: string,
  patientRows: [string, string][],
  responses: Record<string, string>,
) {
  const patientHtml = patientRows.map(([label, value]) => `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join('');

  const questionHtml = QUESTIONS.map((item, index) => `
    <div class="question">
      <div class="question-title">
        ${index + 1}. ${escapeHtml(item.question)}
      </div>
      <div class="answer">
        <strong>Patient response:</strong><br/>
        ${escapeHtml(responses[item.id]?.trim() || 'Not answered')}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<style>
  @page {
    size: A4;
    margin: 15mm 13mm;
  }

  body {
    font-family: Arial, sans-serif;
    color: #512D3D;
    font-size: 11px;
    line-height: 1.5;
  }

  .header {
    background: #B23A63;
    color: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 17px;
  }

  h1 {
    font-size: 21px;
    margin: 0 0 6px;
  }

  .subtitle {
    font-size: 11px;
    opacity: 0.95;
  }

  .visit {
    background: #FCEAF1;
    color: #B23A63;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
    font-weight: bold;
    margin-bottom: 17px;
  }

  h2 {
    font-size: 14px;
    color: #B23A63;
    border-bottom: 1px solid #F1C9D8;
    padding-bottom: 6px;
    margin-top: 21px;
    margin-bottom: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid #F2E1E8;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    width: 43%;
    color: #795466;
    font-weight: 600;
  }

  td {
    color: #512D3D;
  }

  .question {
    border: 1px solid #F1D6E1;
    border-radius: 9px;
    padding: 11px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }

  .question-title {
    font-weight: bold;
    color: #512D3D;
    margin-bottom: 8px;
  }

  .answer {
    background: #FFF3F7;
    padding: 9px;
    border-radius: 6px;
    min-height: 22px;
    overflow-wrap: anywhere;
  }

  .note {
    background: #FFF3F7;
    padding: 11px;
    border-radius: 8px;
    margin-top: 18px;
    font-size: 10px;
  }

  .footer {
    text-align: center;
    color: #9A7585;
    font-size: 9px;
    margin-top: 22px;
  }
</style>
</head>

<body>

  <div class="header">
    <h1>MumWise Clinician Summary</h1>
    <div class="subtitle">
      Consolidated Antenatal Summary
    </div>
    <div class="subtitle">
      Patient: ${escapeHtml(name)}
    </div>
  </div>

  <div class="visit">
    Patient Follow-up & Clinical Information
  </div>

  <h2>1. Patient & Pregnancy Details</h2>

  <table>
    ${patientHtml}
  </table>

  <h2>2. Patient-Reported Symptoms & Follow-up</h2>

  ${questionHtml}

  <div class="note">
    <strong>Important clinical note:</strong>
    This document contains information provided by the patient
    and information available in the application. It is intended
    to support clinician review and is not a substitute for
    clinical assessment or verification of medical records.
  </div>

  <div class="footer">
    Generated using MumWise Pregnancy Companion
  </div>

</body>
</html>`;
}

export default function ClinicianSummaryScreen() {
  const params = useLocalSearchParams<RouteParams>();

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const name = getParam(params.name).trim() || 'Mother';
  const lmp = getParam(params.lmp);
  const edd = getParam(params.edd);
  const dueDate = getParam(params.dueDate);
  const doctorEdd = getParam(params.doctorConfirmedEdd);

  const answers = useMemo(
    () => safeJson(getParam(params.pregnancyAnswers)),
    [params.pregnancyAnswers]
  );

  const patientRows = useMemo((): [string, string][] => {
    const rows: [string, string][] = [
      ['Patient name', name],
      ['Last menstrual period (LMP)', displayValue(answers.lmp ?? lmp)],
      ['Pregnancy confirmed date', displayValue(answers.pregnancyConfirmedDate)],
      ['Clinician visit', displayValue(answers.clinicianVisit)],
      ['Dating ultrasound', displayValue(answers.ultrasound)],
      [
        'Doctor-confirmed EDD',
        displayValue(answers.doctorEdd ?? doctorEdd),
      ],
      ['Registration due date', displayValue(dueDate)],
      ['Alternative EDD', displayValue(edd)],
    ];

    APP_FIELDS.slice(5).forEach(([label, key]) => {
      rows.push([label, displayValue(answers[key])]);
    });

    return rows;
  }, [name, answers, lmp, doctorEdd, dueDate, edd]);

  const updateResponse = (id: string, value: string) => {
    setResponses((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  const handleGeneratePdf = async () => {
    if (generatingPdf) return;

    setGeneratingPdf(true);

    try {
      const html = buildClinicianPdf(
        name,
        patientRows,
        responses
      );

      await Print.printAsync({ html });
    } catch (error) {
      console.error('Clinician summary PDF error:', error);

      Alert.alert(
        'PDF Generation Failed',
        'Unable to generate the clinician summary. Please try again.'
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const answeredCount = QUESTIONS.filter(
    (item) => responses[item.id]?.trim()
  ).length;

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#FFF8FB']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={DEEP_PINK}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Clinician Summary
            </Text>
            <Text style={styles.headerSubtitle}>
              Your next antenatal visit
            </Text>
          </View>

          <Ionicons
            name="document-text-outline"
            size={26}
            color={DEEP_PINK}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          <LinearGradient
            colors={['#E8558D', '#B23A63']}
            style={styles.welcomeCard}
          >
            <Ionicons
              name="medical-outline"
              size={32}
              color="#FFFFFF"
            />

            <Text style={styles.welcomeTitle}>
              Prepare for your next doctor visit
            </Text>

            <Text style={styles.welcomeDescription}>
              Answer these questions about your health since
              your last visit. Your responses will be included
              in your clinician summary.
            </Text>
          </LinearGradient>

          <View style={styles.patientCard}>
            <View style={styles.patientIcon}>
              <Ionicons
                name="person-outline"
                size={24}
                color={DEEP_PINK}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.patientLabel}>
                PATIENT NAME
              </Text>
              <Text style={styles.patientName}>
                {name}
              </Text>
            </View>

            <Ionicons
              name="checkmark-circle"
              size={23}
              color="#45B96B"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Follow-up Questions
            </Text>

            <Text style={styles.progressText}>
              {answeredCount}/8 answered
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(answeredCount / 8) * 100}%` },
              ]}
            />
          </View>

          {QUESTIONS.map((item, index) => (
            <View key={item.id} style={styles.questionCard}>

              <View style={styles.questionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.questionText}>
                  {item.question}
                </Text>
              </View>

              <TextInput
                style={styles.answerInput}
                placeholder={item.placeholder}
                placeholderTextColor="#B69AA6"
                value={responses[item.id] ?? ''}
                onChangeText={(value) =>
                  updateResponse(item.id, value)
                }
                multiline
                textAlignVertical="top"
              />

            </View>
          ))}

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#478FC7"
            />

            <Text style={styles.infoText}>
              Your existing pregnancy details are automatically
              included. You only need to answer the follow-up
              questions above.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              generatingPdf && { opacity: 0.7 },
            ]}
            onPress={handleGeneratePdf}
            disabled={generatingPdf}
            activeOpacity={0.85}
          >
            {generatingPdf ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons
                name="download-outline"
                size={22}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.generateButtonText}>
              {generatingPdf
                ? 'Generating Summary...'
                : 'Generate Clinician Summary PDF'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Made with love by MumWise 💗
          </Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: '#FFFFFFCC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FCE3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DEEP_PINK,
  },
  headerSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 3,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 35,
  },
  welcomeCard: {
    borderRadius: 21,
    padding: 19,
    marginBottom: 17,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 12,
  },
  welcomeDescription: {
    color: '#FFEAF1',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
    borderWidth: 1,
    borderColor: '#F3D4E0',
  },
  patientIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FCE3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  patientName: {
    fontSize: 15,
    color: TEXT,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 17,
    color: TEXT,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 11,
    color: DEEP_PINK,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1D7E1',
    borderRadius: 5,
    marginBottom: 17,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: PINK,
    borderRadius: 5,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3DCE5',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 13,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FCE3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '800',
    color: DEEP_PINK,
  },
  questionText: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  answerInput: {
    minHeight: 75,
    backgroundColor: '#FFF6F9',
    borderWidth: 1,
    borderColor: '#F1D6E1',
    borderRadius: 11,
    padding: 12,
    fontSize: 12,
    color: TEXT,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FC',
    borderRadius: 14,
    padding: 13,
    marginTop: 5,
    marginBottom: 19,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#52718A',
    lineHeight: 17,
    marginLeft: 9,
  },
  generateButton: {
    backgroundColor: DEEP_PINK,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 11,
    marginTop: 22,
  },
});
