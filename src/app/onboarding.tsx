import React from 'react';
import { useRouter } from 'expo-router';
import OnboardingScreen from '../components/OnboardingScreen';

export default function Onboarding() {
  const router = useRouter();
  return (
    <OnboardingScreen
      onContinue={(data) => {
        router.replace({
          pathname: '/abha',
          params: { name: data.name, dueDate: data.dueDate },
        });
      }}
      onBack={() => router.back()}
    />
  );
}