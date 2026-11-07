import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLINICIAN_SUMMARY_STORAGE_KEY = '@mumwise/clinician-summary-v1';

export type ClinicianSummaryData = {
  health?: { readings?: Record<string, number>; entries?: any[]; lastSynced?: string; readingSource?: 'Demo' | 'Manual' };
  nutrition?: { entries?: Record<string, any[]>; waterMl?: number; totalCalories?: number; };
  exercise?: { durationMinutes?: string; saved?: boolean };
};

export async function readClinicianSummaryData(): Promise<ClinicianSummaryData> {
  try {
    const raw = await AsyncStorage.getItem(CLINICIAN_SUMMARY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Unable to read clinician summary data:', error);
    return {};
  }
}

export async function updateClinicianSummaryData(
  section: keyof ClinicianSummaryData,
  value: NonNullable<ClinicianSummaryData[keyof ClinicianSummaryData]>,
): Promise<void> {
  try {
    const current = await readClinicianSummaryData();
    const next = { ...current, [section]: value };
    await AsyncStorage.setItem(CLINICIAN_SUMMARY_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Unable to save clinician summary data:', error);
  }
}
