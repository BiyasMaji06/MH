import React from 'react';
import { router } from 'expo-router';
import NutritionTrackingScreen from '../components/NutritionTrackingScreen';

export default function NutritionRoute() {
  return (
    <NutritionTrackingScreen
      onBack={() => router.replace('/home')}
    />
  );
}
