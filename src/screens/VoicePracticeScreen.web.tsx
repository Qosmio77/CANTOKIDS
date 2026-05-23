/**
 * VoicePracticeScreen.web.tsx — 語音練習 Web 版
 *
 * Web 版直接使用 window.SpeechRecognition，不需要 WebView wrapper
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppText from '../components/AppText';
import { useProgressStore } from '../store/useProgressStore';
import { ALL_CHARACTER_WORDS } from '../data/allWords';
import { useTranslation } from '../hooks/useTranslation';
import { Word } from '../types/word';

function buildPracticePool(wordProgress: Record<number, { learned?: boolean }>): Word[] {
  const unlocked = ALL_CHARACTER_WORDS.filter(w => wordProgress[w.id]?.learned === true);
  return unlocked.length === 0 ? ALL_CHARACTER_WORDS.slice(0, 5) : unlocked;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type SpeechState = 'idle' | 'listening' | 'correct' | 'wrong' | 'unsupported';

// Extend window for Web Speech API
declare const window: Window & {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
};

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export default function VoicePracticeScreen() {
  const navigation = useNavigation();
  const { language } = useTranslation();
  const wordProgressRaw = useProgressStore(s => s.wordProgress);
  const addFood = useProgressStore(s => s.addFood);

  const [pool] = useState<Word[]>(() => shuffle(buildPracticePool(wordProgressRaw)));
  const [index, setIndex] = useState(0);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [transcript, setTranscript] = useState('');
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const word = pool[index % pool.length];

  const hasSpeechAPI = typeof window !== 'undefined' &&
    (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined);

  const handleStart = useCallback(() => {
    if (!hasSpeechAPI) {
      setSpeechState('unsupported');
      return;
    }

    if (speechState === 'listening') {
      recognitionRef.current?.stop();
      setSpeechState('idle');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSpeechState('unsupported'); return; }

    const rec = new SR();
    rec.lang = 'zh-HK';
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setSpeechState('listening');

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const results = Array.from({ length: e.results[0].length }, (_, i) =>
        e.results[0][i].transcript.trim()
      );
      const matched = results.some(r => r.includes(word.character));
      setTranscript(results[0] || '');

      if (matched) {
        setSpeechState('correct');
        const newStreak = streak + 1;
        setStreak(newStreak);
        setTotalCorrect(prev => prev + 1);
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.18, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
        if (newStreak % 3 === 0) addFood(1);
      } else {
        setSpeechState('wrong');
        setStreak(0);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed') setSpeechState('unsupported');
      else setSpeechState('idle');
      recognitionRef.current = null;
    };

    rec.onend = () => { recognitionRef.current = null; };

    rec.start();
    setSpeechState('listening');
  }, [speechState, word, streak, scaleAnim, shakeAnim, addFood, hasSpeechAPI]);

  const handleNext = useCallback(() => {
    setSpeechState('idle');
    setTranscript('');
    setIndex(prev => prev + 1);
  }, []);

  const stateColor = {
    idle:        '#E8A000',
    listening:   '#ef4444',
    correct:     '#16a34a',
    wrong:       '#dc2626',
    unsupported: '#9ca3af',
  }[speechState];

  const btnLabel = {
    idle:        language === 'en' ? '🎤 Speak Now' : '🎤 開口說',
    listening:   language === 'en' ? '⏹ Stop' : '⏹ 停止',
    correct:     language === 'en' ? '🎤 Speak Now' : '🎤 開口說',
    wrong:       language === 'en' ? '🎤 Try Again' : '🎤 再試一次',
    unsupported: language === 'en' ? 'Not Supported' : '不支援',
  }[speechState];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppText style={styles.backIcon}>←</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>
          {language === 'en' ? '🎤 Voice Practice' : '🎤 語音練習'}
        </AppText>
        <View style={styles.headerRight}>
          <AppText style={styles.correctCount}>✓ {totalCorrect}</AppText>
        </View>
      </View>

      {streak > 0 && (
        <View style={styles.streakBar}>
          <AppText style={styles.streakText}>
            🔥 {streak} {language === 'en' ? 'in a row' : '連勝'}
            {streak % 3 === 0 ? '  🍖 +1' : `  · ${3 - (streak % 3)} ${language === 'en' ? 'more for food' : '個到食物'}`}
          </AppText>
        </View>
      )}

      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.charCard,
            {
              transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
              borderColor: speechState === 'correct' ? '#16a34a'
                         : speechState === 'wrong'   ? '#dc2626'
                         : '#e8e3d5',
            },
          ]}
        >
          <AppText style={styles.character}>{word.character}</AppText>
          <AppText style={styles.jyutping}>{word.jyutping}</AppText>
          <AppText style={styles.meaning}>
            {language === 'en' ? word.meaning_en : word.meaning_zh}
          </AppText>

          {speechState === 'correct' && (
            <View style={styles.resultBadge}>
              <AppText style={styles.resultCorrect}>
                {language === 'en' ? '✓ Correct!' : '✓ 答對了！'}
              </AppText>
            </View>
          )}
          {speechState === 'wrong' && transcript ? (
            <View style={styles.resultBadge}>
              <AppText style={styles.resultWrong}>
                {language === 'en' ? `Heard: "${transcript}"` : `聽到：「${transcript}」`}
              </AppText>
            </View>
          ) : null}
          {speechState === 'listening' && (
            <View style={styles.listeningDots}>
              <AppText style={styles.listeningText}>
                {language === 'en' ? '🎤 Listening…' : '🎤 聆聽中…'}
              </AppText>
            </View>
          )}
        </Animated.View>

        <View style={styles.dotsRow}>
          {pool.slice(Math.max(0, index - 2), index + 5).map((_, i) => {
            const pos = Math.max(0, index - 2) + i;
            return (
              <View
                key={pos}
                style={[
                  styles.dot,
                  pos < index  && styles.dotDone,
                  pos === index && styles.dotActive,
                ]}
              />
            );
          })}
        </View>
      </View>

      {speechState === 'unsupported' && (
        <View style={styles.unsupportedCard}>
          <AppText style={styles.unsupportedText}>
            {language === 'en'
              ? '⚠️ Please allow microphone access in your browser and reload.'
              : '⚠️ 請在瀏覽器中允許麥克風權限，然後重新整理頁面。'}
          </AppText>
        </View>
      )}

      <View style={styles.actions}>
        {speechState !== 'unsupported' && (
          <TouchableOpacity
            style={[styles.speakBtn, { backgroundColor: stateColor }]}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <AppText style={styles.speakBtnText}>{btnLabel}</AppText>
          </TouchableOpacity>
        )}
        {(speechState === 'correct' || speechState === 'wrong') && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <AppText style={styles.nextBtnText}>
              {language === 'en' ? 'Next →' : '下一個 →'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      <AppText style={styles.hint}>
        {language === 'en' ? 'Say the character aloud in Cantonese' : '用粵語大聲讀出這個漢字'}
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fbf9f1', maxWidth: 480, marginHorizontal: 'auto', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8e3d5' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#E8A000' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1b1c17' },
  headerRight: { width: 40, alignItems: 'flex-end' },
  correctCount: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  streakBar: { backgroundColor: '#fff8e7', borderBottomWidth: 1, borderBottomColor: '#fde68a', paddingVertical: 8, alignItems: 'center' },
  streakText: { fontSize: 14, fontWeight: '700', color: '#b45309' },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  charCard: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 28, borderWidth: 2.5, paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
  character: { fontSize: 96, fontWeight: '700', color: '#1b1c17', lineHeight: 110 },
  jyutping: { fontSize: 22, color: '#E8A000', fontWeight: '600', marginTop: 4, letterSpacing: 1 },
  meaning: { fontSize: 16, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  resultBadge: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f0fdf4' },
  resultCorrect: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  resultWrong: { fontSize: 14, color: '#dc2626', fontWeight: '600' },
  listeningDots: { marginTop: 16 },
  listeningText: { fontSize: 16, color: '#E8A000', fontWeight: '600' },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  dotDone: { backgroundColor: '#16a34a' },
  dotActive: { backgroundColor: '#E8A000', width: 20 },
  unsupportedCard: { marginHorizontal: 24, padding: 16, backgroundColor: '#fef2f2', borderRadius: 14, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 12 },
  unsupportedText: { fontSize: 14, color: '#dc2626', textAlign: 'center', lineHeight: 20 },
  actions: { paddingHorizontal: 24, paddingBottom: 8, gap: 12 },
  speakBtn: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  speakBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  nextBtn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb' },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: '#374151' },
  hint: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingBottom: 24, paddingTop: 4 },
});
