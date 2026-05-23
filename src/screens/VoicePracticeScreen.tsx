/**
 * VoicePracticeScreen — 粵語語音練習
 *
 * 技術：WebView + Web Speech API (lang: zh-HK)
 *      零原生模組，完全 OTA 相容
 *
 * 流程：
 *  1. 顯示漢字 + 粵拼
 *  2. 用戶點「開口說」→ WebView 啟動語音辨識
 *  3. WebView postMessage 回傳辨識結果
 *  4. 比對結果：✓ 正確 / ✗ 再試
 *  5. 正確後 → 下一個字，連對 3 個加食物獎勵
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import AppText from '../components/AppText';
import { useProgressStore } from '../store/useProgressStore';
import { ALL_CHARACTER_WORDS, getWordById } from '../data/allWords';
import { useTranslation } from '../hooks/useTranslation';
import { Word } from '../types/word';

// ── Build the practice pool: mastered OR in-progress chars ───────────────────

function buildPracticePool(wordProgress: Record<number, { learned?: boolean }>): Word[] {
  const unlocked = ALL_CHARACTER_WORDS.filter(w => wordProgress[w.id]?.learned === true);
  if (unlocked.length === 0) {
    // Fall back to first 5 characters for new users
    return ALL_CHARACTER_WORDS.slice(0, 5);
  }
  return unlocked;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Web Speech API HTML ──────────────────────────────────────────────────────

function buildSpeechHTML(expectedChar: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, sans-serif;
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    height: 100vh; overflow: hidden;
  }
  #status {
    font-size: 15px;
    color: #6b7280;
    text-align: center;
    padding: 12px 20px;
    border-radius: 12px;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    min-width: 200px;
  }
  #status.listening {
    color: #E8A000;
    border-color: #E8A000;
    background: #fffbeb;
  }
  #status.done {
    color: #16a34a;
    border-color: #16a34a;
    background: #f0fdf4;
  }
  #status.error {
    color: #dc2626;
    border-color: #fca5a5;
    background: #fef2f2;
  }
</style>
</head>
<body>
<div id="status">等待中…</div>
<script>
const expected = "${expectedChar}";
let recognition = null;

function post(type, data) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
}

function setStatus(text, cls) {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = cls || '';
}

function startListening() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    setStatus('此裝置不支援語音辨識', 'error');
    post('unsupported', {});
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'zh-HK';
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;
  recognition.continuous = false;

  recognition.onstart = function() {
    setStatus('🎤 聆聽中…', 'listening');
    post('listening', {});
  };

  recognition.onresult = function(e) {
    const results = Array.from(e.results[0]).map(r => r.transcript.trim());
    const matched = results.some(r => r.includes(expected));
    setStatus(matched ? '✓ 辨識成功' : '辨識：' + results[0], matched ? 'done' : 'error');
    post('result', { results, matched, transcript: results[0] });
  };

  recognition.onerror = function(e) {
    const msg = e.error === 'no-speech' ? '沒有檢測到聲音，請再試' :
                e.error === 'not-allowed' ? '請允許使用麥克風' :
                '辨識錯誤：' + e.error;
    setStatus(msg, 'error');
    post('error', { error: e.error });
  };

  recognition.onend = function() {
    recognition = null;
  };

  recognition.start();
}

function stopListening() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  setStatus('已停止', '');
}

document.addEventListener('message', function(e) {
  const msg = JSON.parse(e.data);
  if (msg.command === 'start') startListening();
  if (msg.command === 'stop') stopListening();
});
window.addEventListener('message', function(e) {
  const msg = JSON.parse(e.data);
  if (msg.command === 'start') startListening();
  if (msg.command === 'stop') stopListening();
});

post('ready', {});
</script>
</body>
</html>
  `.trim();
}

// ── Main Component ────────────────────────────────────────────────────────────

type SpeechState = 'idle' | 'listening' | 'correct' | 'wrong' | 'unsupported';

export default function VoicePracticeScreen() {
  const navigation = useNavigation();
  const { t, language } = useTranslation();
  const wordProgress = useProgressStore(s => s.wordProgress);
  const addFood = useProgressStore(s => s.addFood);

  const [pool]       = useState<Word[]>(() => shuffle(buildPracticePool(wordProgress)));
  const [index, setIndex]         = useState(0);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [transcript, setTranscript]   = useState('');
  const [streak, setStreak]           = useState(0);   // consecutive correct
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [webViewReady, setWebViewReady] = useState(false);

  const webRef = useRef<WebView>(null);

  // Animations
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  const word = pool[index % pool.length];

  // Rebuild HTML when word changes
  const html = buildSpeechHTML(word.character);

  const sendCommand = useCallback((cmd: 'start' | 'stop') => {
    webRef.current?.injectJavaScript(
      `(function(){
        const e = new MessageEvent('message', { data: JSON.stringify({ command: '${cmd}' }) });
        window.dispatchEvent(e);
      })(); true;`,
    );
  }, []);

  const handleStart = useCallback(() => {
    if (speechState === 'listening') {
      sendCommand('stop');
      setSpeechState('idle');
      return;
    }
    setSpeechState('listening');
    setTranscript('');
    sendCommand('start');
  }, [speechState, sendCommand]);

  const handleNext = useCallback(() => {
    setSpeechState('idle');
    setTranscript('');
    setIndex(prev => prev + 1);
  }, []);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') {
        setWebViewReady(true);
      } else if (msg.type === 'listening') {
        setSpeechState('listening');
      } else if (msg.type === 'result') {
        setTranscript(msg.transcript || '');
        if (msg.matched) {
          setSpeechState('correct');
          const newStreak = streak + 1;
          setStreak(newStreak);
          setTotalCorrect(prev => prev + 1);
          // Pop animation
          Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.18, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
          ]).start();
          // Food reward every 3 correct
          if (newStreak % 3 === 0) {
            addFood(1);
            Animated.loop(
              Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
              ]),
              { iterations: 3 },
            ).start();
          }
        } else {
          setSpeechState('wrong');
          setStreak(0);
          // Shake animation
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]).start();
        }
      } else if (msg.type === 'error') {
        if (msg.error === 'not-allowed') {
          setSpeechState('unsupported');
        } else {
          setSpeechState('idle');
        }
      } else if (msg.type === 'unsupported') {
        setSpeechState('unsupported');
      }
    } catch (_) { /* ignore */ }
  }, [streak, scaleAnim, shakeAnim, glowAnim, addFood]);

  // State colours
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

  const foodGlowStyle = {
    opacity: glowAnim,
    transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] }) }],
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
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

      {/* Streak + food hint */}
      {streak > 0 && (
        <View style={styles.streakBar}>
          <AppText style={styles.streakText}>
            🔥 {streak} {language === 'en' ? 'in a row' : '連勝'}
            {streak % 3 === 0 ? `  🍖 +1` : `  · ${3 - (streak % 3)} ${language === 'en' ? 'more for food' : '個到食物'}`}
          </AppText>
        </View>
      )}

      {/* Main card */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.charCard,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim },
              ],
              borderColor: speechState === 'correct' ? '#16a34a'
                         : speechState === 'wrong'   ? '#dc2626'
                         : '#e8e3d5',
            },
          ]}
        >
          {/* Food reward flash */}
          {streak > 0 && streak % 3 === 0 && (
            <Animated.View style={[styles.foodFlash, foodGlowStyle]}>
              <AppText style={styles.foodFlashText}>🍖 +1</AppText>
            </Animated.View>
          )}

          {/* Character */}
          <AppText style={styles.character}>{word.character}</AppText>

          {/* Jyutping */}
          <AppText style={styles.jyutping}>{word.jyutping}</AppText>

          {/* Meaning */}
          <AppText style={styles.meaning}>
            {language === 'en' ? word.meaning_en : word.meaning_zh}
          </AppText>

          {/* State indicator */}
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

        {/* Progress dots */}
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

      {/* WebView (hidden — just for Speech API) */}
      {Platform.OS !== 'web' && (
        <View style={styles.webViewHidden}>
          <WebView
            ref={webRef}
            source={{ html }}
            originWhitelist={['*']}
            onMessage={onMessage}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            style={styles.webViewInner}
          />
        </View>
      )}

      {/* Unsupported notice */}
      {speechState === 'unsupported' && (
        <View style={styles.unsupportedCard}>
          <AppText style={styles.unsupportedText}>
            {language === 'en'
              ? '⚠️ Voice recognition is not supported on this device/browser.\nTry on a newer iOS device with Safari permissions.'
              : '⚠️ 此裝置不支援語音辨識。\n請在較新的 iOS 裝置上使用，並確保已允許麥克風權限。'}
          </AppText>
        </View>
      )}

      {/* Action buttons */}
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
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <AppText style={styles.nextBtnText}>
              {language === 'en' ? 'Next →' : '下一個 →'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Hint */}
      <AppText style={styles.hint}>
        {language === 'en'
          ? 'Say the character aloud in Cantonese'
          : '用粵語大聲讀出這個漢字'}
      </AppText>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fbf9f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e3d5',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#E8A000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1c17',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  correctCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  streakBar: {
    backgroundColor: '#fff8e7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingVertical: 8,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  charCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 2.5,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'visible',
  },
  foodFlash: {
    position: 'absolute',
    top: -20,
    right: -10,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    zIndex: 10,
  },
  foodFlashText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  character: {
    fontSize: 96,
    fontWeight: '700',
    color: '#1b1c17',
    lineHeight: 110,
  },
  jyutping: {
    fontSize: 22,
    color: '#E8A000',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  meaning: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  resultBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  resultCorrect: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  resultWrong: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  listeningDots: {
    marginTop: 16,
  },
  listeningText: {
    fontSize: 16,
    color: '#E8A000',
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  dotDone: {
    backgroundColor: '#16a34a',
  },
  dotActive: {
    backgroundColor: '#E8A000',
    width: 20,
  },
  webViewHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  webViewInner: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  unsupportedCard: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 12,
  },
  unsupportedText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 12,
  },
  speakBtn: {
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  speakBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  nextBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
  },
  hint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingBottom: 24,
    paddingTop: 4,
  },
});
