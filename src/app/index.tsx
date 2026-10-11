import React from 'react';
import { useRouter } from 'expo-router';
import WelcomeScreen from '../components/WelcomeScreen';

export default function Index() {
  const router = useRouter();

  return (
    <WelcomeScreen
      onGetStarted={() => router.push('/onboarding')}
      onSignIn={() => router.push('/sign-in')}
    />
  );
}