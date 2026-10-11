import React from 'react';
import { useRouter } from 'expo-router';

import SignInScreen from '../components/SignInScreen';

export default function SignIn() {
  const router = useRouter();

  return (
    <SignInScreen
      onBack={() => router.back()}
      onGoToSignUp={() => router.push('/onboarding')}
      onForgotPassword={() => router.push('/forgot-password')}
      onSignIn={(data) => {
        console.log('Sign in data:', data);
        router.push('/home');
      }}
    />
  );
}