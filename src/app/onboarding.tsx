import React from 'react';
import { useRouter } from 'expo-router';
import OnboardingScreen from '../components/OnboardingScreen';

export default function Onboarding() {
  const router = useRouter();

  return (
    <OnboardingScreen
      onContinue={(data) => {
        console.log('Onboarding data:', data);
        router.replace('/abha');
      }}
      onBack={() => router.back()}
    />
  );
}