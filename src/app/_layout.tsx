import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="abha" />
      <Stack.Screen name="pregnancy-questionnaire" />
      <Stack.Screen name="home" />
      <Stack.Screen name="nutrition" />
      <Stack.Screen name="health-tracking" />
      <Stack.Screen name="learn" />
      <Stack.Screen name="exercise-yoga" />
      <Stack.Screen name="sia" />
      <Stack.Screen name="clinician-summary" />
      <Stack.Screen name="admin-dashboard" />
      <Stack.Screen name="doctor-dashboard" />
    </Stack>
  );
}
