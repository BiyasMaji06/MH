import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import SignInScreen from '../components/SignInScreen';
import { supabase } from '../services/supabase';

export default function SignIn() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async (data: {
    email: string;
    password: string;
  }) => {
    if (isSigningIn) return;

    setIsSigningIn(true);

    try {
      const { data: authData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });

      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }

      if (!authData.session) {
        Alert.alert(
          'Sign in incomplete',
          'MumWise could not establish your session. Please try again.'
        );
        return;
      }

      router.replace('/home');
    } catch (error: any) {
      Alert.alert(
        'Sign in error',
        error?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SignInScreen
      onBack={() => router.back()}
      onGoToSignUp={() => router.push('/onboarding')}
      onForgotPassword={() => router.push('/forgot-password')}
      onSignIn={handleSignIn}
    />
  );
}