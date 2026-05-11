import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { useProgressStore } from './src/store/useProgressStore';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initIAP } from './src/services/iap/iapService';

export default function App() {
  const checkAndUpdateStreak = useProgressStore((s) => s.checkAndUpdateStreak);

  useEffect(() => {
    checkAndUpdateStreak();
    initIAP().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="dark" backgroundColor="#FFFBEB" />
      <AppNavigator />
    </ErrorBoundary>
  );
}
