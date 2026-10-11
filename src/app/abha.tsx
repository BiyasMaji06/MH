import React from 'react';
import { useRouter } from 'expo-router';
import ABHAIntegrationScreen from '../components/ABHAIntegrationScreen';

export default function ABHA() {
  const router = useRouter();

  return (
    <ABHAIntegrationScreen
      onSkip={() => router.replace('/home')}
    />
  );
}