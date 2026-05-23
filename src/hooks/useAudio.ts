/**
 * useAudio — 跨平台粵語播放 Hook
 *
 * 優先順序（Native）：
 *   1. 本地 MP3（assets/audio/cantonese/*.mp3）— 真正廣東話，離線可用
 *   2. expo-speech (zh-HK) — 裝置原生 TTS，真正廣東話（不再用 Google TTS URL）
 *
 * Web：
 *   → window.speechSynthesis（zh-HK），無需下載任何檔案
 *
 * 生成真實音檔：GOOGLE_TTS_API_KEY=xxx node scripts/generate-audio.mjs
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { CANTONESE_AUDIO } from '../data/audioMap';
import { ALL_WORDS } from '../data/allWords';

type Language = 'cantonese' | 'mandarin';

// ── jyutping 查找表（character → jyutping）──────────────────────────
const CHAR_TO_JYUTPING: Record<string, string> = {};
for (const w of ALL_WORDS) {
  CHAR_TO_JYUTPING[w.character] = w.jyutping;
}

// ── Web Speech API（瀏覽器內建） ─────────────────────────────────────
const LANG_CODE: Record<Language, string> = {
  cantonese: 'zh-HK',
  mandarin:  'zh-TW',
};

function speakWeb(character: string, language: Language): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(character);
    utter.lang = LANG_CODE[language];
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  } catch {
    // 靜默失敗
  }
}

// ── Native 音訊播放 ──────────────────────────────────────────────────
async function speakNative(
  character: string,
  language: Language,
  soundRef: React.MutableRefObject<any>,
  isMountedRef: React.MutableRefObject<boolean>,
  isLoadingRef: React.MutableRefObject<boolean>
): Promise<void> {
  if (isLoadingRef.current) return;
  isLoadingRef.current = true;

  try {
    const { Audio } = await import('expo-av');

    // 安全卸載舊音訊
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    // ── 決定音源 ──────────────────────────────────────────────────
    let audioSource: { uri: string } | number | null = null;

    if (language === 'cantonese') {
      // 1. 優先：本地 MP3（真正廣東話）
      const jyutping = CHAR_TO_JYUTPING[character];
      const localAsset = jyutping ? CANTONESE_AUDIO[jyutping] : undefined;
      if (localAsset !== undefined) {
        audioSource = localAsset; // require() 結果 (number)
        if (__DEV__) console.info(`[useAudio] 本地音檔: ${jyutping}.mp3`);
      } else {
        // 2. Fallback：expo-speech 裝置原生 TTS（zh-HK 廣東話）
        if (__DEV__) console.info(`[useAudio] expo-speech fallback: ${character}`);
        isLoadingRef.current = false;
        const Speech = await import('expo-speech');
        if (isMountedRef.current) {
          Speech.speak(character, {
            language: 'zh-HK',
            rate: 0.85,
            pitch: 1.0,
          });
        }
        return;
      }
    } else {
      // 普通話：Google TTS zh-TW（原本正常運作，保持不變）
      audioSource = {
        uri:
          `https://translate.google.com/translate_tts` +
          `?ie=UTF-8&q=${encodeURIComponent(character)}` +
          `&tl=zh-TW&client=tw-ob`,
      };
    }

    if (!audioSource) return;

    const { sound } = await Audio.Sound.createAsync(
      audioSource,
      { shouldPlay: true, volume: 1.0 }
    );

    if (!isMountedRef.current) {
      sound.setOnPlaybackStatusUpdate(null);
      await sound.unloadAsync().catch(() => {});
      return;
    }

    soundRef.current = sound;

    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.setOnPlaybackStatusUpdate(null);
        sound.unloadAsync().catch(() => {});
        if (soundRef.current === sound) soundRef.current = null;
      }
    });
  } catch {
    if (__DEV__) console.info('[useAudio] 發音失敗（靜默）');
  } finally {
    isLoadingRef.current = false;
  }
}

// ────────────────────────────────────────────────────────────────────
export function useAudio() {
  const soundRef     = useRef<any>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    if (Platform.OS !== 'web') {
      import('expo-av').then(({ Audio }) => {
        Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        }).catch(() => {});
      }).catch(() => {});
    }

    return () => {
      isMountedRef.current = false;
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate?.(null);
        soundRef.current.unloadAsync?.().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const playWord = useCallback(
    (character: string, language: Language = 'cantonese') => {
      if (Platform.OS === 'web') {
        speakWeb(character, language);
      } else {
        speakNative(character, language, soundRef, isMountedRef, isLoadingRef);
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (Platform.OS === 'web') {
      window.speechSynthesis?.cancel();
    } else {
      // 停止 expo-speech（若正在朗讀）
      import('expo-speech').then(Speech => Speech.stop()).catch(() => {});
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate?.(null);
        soundRef.current.stopAsync?.().catch(() => {});
        soundRef.current.unloadAsync?.().catch(() => {});
        soundRef.current = null;
      }
    }
  }, []);

  return { playWord, stop };
}
