import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { useProgressStore } from './src/store/useProgressStore';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initIAP } from './src/services/iap/iapService';
import { initSFX } from './src/services/sfxService';
import { initBGM } from './src/services/bgmService';
import { Audio } from 'expo-av';


export default function App() {
  const checkAndUpdateStreak = useProgressStore((s) => s.checkAndUpdateStreak);
  const setLanguage = useProgressStore((s) => s.setLanguage);

  // Web: skip custom font loading (font URLs break under GitHub Pages subpath)
  // Mobile: load JF Open Huninn font
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          'JFOpenHuninn':     require('./assets/fonts/jf-openhuninn.ttf'),
          'NotoSerifTC':      require('./assets/fonts/NotoSerifTC-subset.ttf'),
        }
  );

  useEffect(() => {
    // Web: read ?lang=en / ?lang=zh / ?lang=sc from URL and apply immediately
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get('lang');
      if (lang === 'en' || lang === 'zh' || lang === 'sc') {
        setLanguage(lang);
      }
    }

    checkAndUpdateStreak();
    initIAP().catch(() => {});

    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      })
        .then(() => {
          initSFX().catch(() => {});
          initBGM().catch(() => {});
        })
        .catch(() => {
          initSFX().catch(() => {});
          initBGM().catch(() => {});
        });
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fbf9f1' }}>
        <ActivityIndicator size="large" color="#E8A000" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style="dark" backgroundColor="#FFFBEB" />
      <AppNavigator />
    </ErrorBoundary>
  );
}
