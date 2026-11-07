import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { readClinicianSummaryData, updateClinicianSummaryData } from '../services/clinicianSummaryStorage';

type MetricKey = 'steps' | 'heart_rate' | 'spo2' | 'sleep_hours';
type Readings = Record<MetricKey, number>;
type Entry = { id: string; date: string; values: Readings; source: 'Demo' | 'Manual' };

const DEMO_READINGS: Readings = {
  steps: 6482,
  heart_rate: 72,
  spo2: 98,
  sleep_hours: 7.25,
};

const METRICS: { key: MetricKey; label: string; unit: string; icon: keyof typeof Ionicons.glyphMap; color: string; placeholder: string }[] = [
  { key: 'steps', label: 'Steps', unit: 'steps', icon: 'footsteps', color: '#24B86A', placeholder: 'e.g. 6482' },
  { key: 'heart_rate', label: 'Heart Rate (Resting)', unit: 'bpm', icon: 'heart', color: '#EA557E', placeholder: 'e.g. 72' },
  { key: 'spo2', label: 'SpO₂', unit: '%', icon: 'water', color: '#5479EF', placeholder: 'e.g. 98' },
  { key: 'sleep_hours', label: 'Sleep', unit: 'hours', icon: 'moon', color: '#8A6BE8', placeholder: 'e.g. 7.25' },
];

const formatValue = (key: MetricKey, value: number) => {
  if (key === 'sleep_hours') {
    const totalMinutes = Math.round(value * 60);
    return `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} m`;
  }
  return Math.round(value).toLocaleString();
};

export default function HealthTrackingScreen() {
  const [activeTab, setActiveTab] = useState<'wearable' | 'manual'>('wearable');
  const [readings, setReadings] = useState<Readings>(DEMO_READINGS);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lastSynced, setLastSynced] = useState('02 Dec 2026, 8:30 AM');
  const [readingSource, setReadingSource] = useState<'Demo' | 'Manual'>('Demo');
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState<Record<MetricKey, string>>({
    steps: String(DEMO_READINGS.steps),
    heart_rate: String(DEMO_READINGS.heart_rate),
    spo2: String(DEMO_READINGS.spo2),
    sleep_hours: String(DEMO_READINGS.sleep_hours),
  });
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const [summaryStorageReady, setSummaryStorageReady] = useState(false);

  useEffect(() => {
    let active = true;
    readClinicianSummaryData().then(data => {
      if (!active) return;
      if (data.health?.readings) {
        setReadings(data.health.readings as Readings);
        setForm({
          steps: String(data.health.readings.steps ?? DEMO_READINGS.steps),
          heart_rate: String(data.health.readings.heart_rate ?? DEMO_READINGS.heart_rate),
          spo2: String(data.health.readings.spo2 ?? DEMO_READINGS.spo2),
          sleep_hours: String(data.health.readings.sleep_hours ?? DEMO_READINGS.sleep_hours),
        });
      }
      if (data.health?.entries) setEntries(data.health.entries as Entry[]);
      if (data.health?.lastSynced) setLastSynced(data.health.lastSynced);
      if (data.health?.readingSource) setReadingSource(data.health.readingSource as 'Demo' | 'Manual');
      setSummaryStorageReady(true);
    }).catch(() => { if (active) setSummaryStorageReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!summaryStorageReady) return;
    updateClinicianSummaryData('health', { readings, entries, lastSynced, readingSource });
  }, [readings, entries, lastSynced, readingSource, summaryStorageReady]);

  const averageLabel = useMemo(() => entries.length ? 'This Week (Avg/Day)' : 'This Week (Avg/Day)', [entries.length]);

  const simulateSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setReadings(DEMO_READINGS);
      setReadingSource('Demo');
      setLastSynced(new Date().toLocaleString([], {
        day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
      }));
      setSyncing(false);
      Alert.alert('Demo sync complete', 'Your readings have been loaded.');
    }, 650);
  };

  const saveManualEntry = () => {
    const parsed = {} as Readings;
    for (const metric of METRICS) {
      const raw = form[metric.key].trim();
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || value < 0) {
        Alert.alert('Check your entries', `Enter a valid non-negative value for ${metric.label.toLowerCase()}.`);
        return;
      }
      if (metric.key === 'spo2' && (value > 100 || value < 50)) {
        Alert.alert('Check SpO₂', 'Enter an SpO₂ percentage between 50 and 100.');
        return;
      }
      if (metric.key === 'heart_rate' && (value < 20 || value > 250)) {
        Alert.alert('Check heart rate', 'Enter a heart rate between 20 and 250 bpm.');
        return;
      }
      if (metric.key === 'sleep_hours' && value > 24) {
        Alert.alert('Check sleep duration', 'Sleep duration cannot exceed 24 hours.');
        return;
      }
      parsed[metric.key] = value;
    }
    setReadings(parsed);
    setReadingSource('Manual');
    setEntries(previous => [{ id: `${Date.now()}`, date: new Date().toLocaleString(), values: parsed, source: 'Manual' }, ...previous]);
    Alert.alert('Entry saved', 'Your manual health readings have been updated on this screen.');
    setActiveTab('wearable');
  };

  return (
    <LinearGradient colors={['#FDEDF3', '#FBE5ED', '#FFF8FB']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={25} color="#252A59" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Health Tracking</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === 'wearable' && styles.activeTab]} onPress={() => setActiveTab('wearable')}>
            <Text style={[styles.tabText, activeTab === 'wearable' && styles.activeTabText]}>Wearable Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'manual' && styles.activeTab]} onPress={() => setActiveTab('manual')}>
            <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual Entry</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {activeTab === 'wearable' ? (
            <>
              <View style={styles.syncCard}>
                <View style={styles.watchIconWrap}>
                  <Ionicons name="watch-outline" size={42} color="#4237A8" />
                </View>
                <View style={styles.syncCopy}>
                  <Text style={styles.syncTitle}>Sync Your Wearable</Text>
                  <Text style={styles.syncDescription}>Load activity, sleep, heart rate and SpO₂ readings.</Text>
                  <TouchableOpacity style={styles.syncButton} onPress={simulateSync} disabled={syncing}>
                    <Ionicons name="sync-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.syncButtonText}>{syncing ? 'Syncing…' : 'Sync Device'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.syncStatus}>
                <Ionicons name="checkmark-circle" size={17} color="#28B84A" />
                <Text style={styles.syncStatusText}>Last synced: {lastSynced}</Text>
              </View>
              <Text style={styles.sectionHeading}>{averageLabel}</Text>
              <View style={styles.metricsCard}>
                {METRICS.map((metric, index) => (
                  <TouchableOpacity key={metric.key} style={[styles.metricRow, index === METRICS.length - 1 && styles.lastMetricRow]} onPress={() => setSelectedMetric(metric.key)}>
                    <View style={[styles.metricIcon, { backgroundColor: `${metric.color}18` }]}>
                      <Ionicons name={metric.icon} size={19} color={metric.color} />
                    </View>
                    <Text style={styles.metricName}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{formatValue(metric.key, readings[metric.key])} {metric.unit === 'hours' ? '' : metric.unit}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#77758C" />
                  </TouchableOpacity>
                ))}
              </View>
              {entries.length > 0 && (
                <View style={styles.historyCard}>
                  <Text style={styles.historyTitle}>Recent Manual Entries</Text>
                  {entries.slice(0, 5).map(entry => (
                    <View key={entry.id} style={styles.historyRow}>
                      <Text style={styles.historyDate}>{entry.date}</Text>
                      <Text style={styles.historySource}>{entry.source}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.manualCard}>
                <Text style={styles.manualTitle}>Enter your health readings</Text>
                <Text style={styles.manualSubtitle}>Add values from your own device or records.</Text>
                {METRICS.map(metric => (
                  <View key={metric.key} style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{metric.label} ({metric.unit})</Text>
                    <TextInput
                      style={styles.manualInput}
                      value={form[metric.key]}
                      onChangeText={value => setForm(previous => ({ ...previous, [metric.key]: value }))}
                      placeholder={metric.placeholder}
                      placeholderTextColor="#A99BAF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.saveButton} onPress={saveManualEntry}>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save readings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveTab('wearable')}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/home')}>
            <Ionicons name="home-outline" size={21} color="#77758C" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('wearable')}>
            <Ionicons name="fitness" size={21} color="#4237A8" />
            <Text style={styles.navLabelActive}>Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Learn', 'The Learn section is coming soon.')}>
            <Ionicons name="book-outline" size={21} color="#77758C" />
            <Text style={styles.navLabel}>Learn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Chat', 'SIA chat is coming soon.')}>
            <Ionicons name="chatbubble-ellipses-outline" size={21} color="#77758C" />
            <Text style={styles.navLabel}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('More', 'More features are coming soon.')}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#77758C" />
            <Text style={styles.navLabel}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={selectedMetric !== null} transparent animationType="fade" onRequestClose={() => setSelectedMetric(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedMetric && (
              <>
                <Text style={styles.modalTitle}>{METRICS.find(item => item.key === selectedMetric)?.label}</Text>
                <Text style={styles.modalValue}>{formatValue(selectedMetric, readings[selectedMetric])} {METRICS.find(item => item.key === selectedMetric)?.unit}</Text>
                <Text style={styles.modalHint}>Use Manual Entry to replace it with your own reading.</Text>
              </>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={() => setSelectedMetric(null)}><Text style={styles.modalButtonText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backButton: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { color: '#202653', fontSize: 18, fontWeight: '800' },
  topSpacer: { width: 38 },
  tabBar: { marginHorizontal: 14, marginTop: 7, marginBottom: 15, padding: 4, borderRadius: 14, backgroundColor: '#EFEDF9', flexDirection: 'row' },
  tab: { flex: 1, minHeight: 41, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  activeTab: { backgroundColor: '#DCD8FF', borderWidth: 1, borderColor: '#C6BFFF' },
  tabText: { color: '#37375D', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#29256F', fontWeight: '800' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 22 },
  syncCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5F4', shadowColor: '#5D4B78', shadowOpacity: 0.07, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  watchIconWrap: { width: 68, height: 76, borderRadius: 17, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  syncCopy: { flex: 1 },
  syncTitle: { color: '#252653', fontSize: 14, fontWeight: '800' },
  syncDescription: { color: '#77758C', fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: 9 },
  syncButton: { backgroundColor: '#5D43C4', borderRadius: 18, paddingHorizontal: 17, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7 },
  syncButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  syncStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE7F4', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  syncStatusText: { color: '#383653', fontSize: 11, fontWeight: '600' },
  sectionHeading: { color: '#252653', fontSize: 15, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  metricsCard: { backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#EAE5F4', paddingHorizontal: 12, shadowColor: '#5D4B78', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  metricRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0EDF4', gap: 9 },
  lastMetricRow: { borderBottomWidth: 0 },
  metricIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricName: { flex: 1, color: '#29294E', fontSize: 12, fontWeight: '700' },
  metricValue: { color: '#30304F', fontSize: 12, fontWeight: '800' },
  disclaimerCard: { marginTop: 13, flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FFFFFFB8', padding: 11, borderRadius: 12 },
  disclaimer: { flex: 1, color: '#77758C', fontSize: 10, lineHeight: 15 },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#EAE5F4' },
  historyTitle: { color: '#252653', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: 1, borderTopColor: '#F1EEF5' },
  historyDate: { color: '#68667C', fontSize: 10 },
  historySource: { color: '#9A759F', fontSize: 10, fontWeight: '700' },
  manualCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17, borderWidth: 1, borderColor: '#EAE5F4' },
  manualTitle: { color: '#252653', fontSize: 17, fontWeight: '800' },
  manualSubtitle: { color: '#77758C', fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 15 },
  inputGroup: { marginBottom: 13 },
  inputLabel: { color: '#343253', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  manualInput: { height: 45, borderRadius: 11, borderWidth: 1, borderColor: '#E6DFEF', paddingHorizontal: 12, color: '#29294E', backgroundColor: '#FFFCFE', fontSize: 14 },
  saveButton: { height: 48, borderRadius: 24, backgroundColor: '#5D43C4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
  cancelButtonText: { color: '#8A6684', fontSize: 12, fontWeight: '700' },
  bottomNav: { minHeight: 57, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EAE5F0', paddingTop: 7, paddingBottom: 3 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navLabel: { color: '#77758C', fontSize: 9 },
  navLabelActive: { color: '#4237A8', fontSize: 9, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: '#211A3970', alignItems: 'center', justifyContent: 'center', padding: 25 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, alignItems: 'center' },
  modalTitle: { color: '#252653', fontSize: 17, fontWeight: '800' },
  modalValue: { color: '#5D43C4', fontSize: 26, fontWeight: '800', marginTop: 12 },
  modalHint: { color: '#77758C', textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 9 },
  modalButton: { backgroundColor: '#5D43C4', paddingHorizontal: 30, paddingVertical: 11, borderRadius: 20, marginTop: 18 },
  modalButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
