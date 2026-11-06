import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ABHAIntegrationScreen from '../components/ABHAIntegrationScreen';

export default function ABHA() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; dueDate?: string }>();
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const dueDate = Array.isArray(params.dueDate) ? params.dueDate[0] : params.dueDate;
  const continueToQuestionnaire = () => router.replace({
    pathname: '/pregnancy-questionnaire',
    params: { name: name ?? '', dueDate: dueDate ?? '' },
  });

  return (
    <ABHAIntegrationScreen
      onBack={() => router.back()}
      onSkip={continueToQuestionnaire}
    />
  );
}