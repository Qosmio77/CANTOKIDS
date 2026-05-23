/**
 * DictationScreen — 默書模式
 *
 * 讀默：自動播音 → 空白 HanziWriter（無輪廓無字形）→ 用家憑聲音寫出
 * 背默：顯示意思 → 空白 HanziWriter（無輪廓無字形）→ 用家憑記憶寫出
 *
 * 字庫：只用 wordProgress[id].learned === true 的已學字詞
 * 每次最多 10 題，隨機洗牌
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import PronButton from '../components/PronButton';
import HanziWriterView, { HanziWriterHandle } from '../components/HanziWriterView';
import { useProgressStore } from '../store/useProgressStore';
import { useAudio } from '../hooks/useAudio';
import { ALL_WORDS } from '../data/allWords';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import { playSFX } from '../services/sfxService';

const { width: SW } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SW - 32, 340);
const MAX_WORDS = 10;

type DictationMode = 'listen' | 'memory';
type Phase = 'question' | 'feedback' | 'done';

interface Result {
  wordId: number;
  character: string;
  mistakes: number;
  skipped: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DictationScreen({ route, navigation }: any) {
  const { mode } = route.params as { mode: DictationMode };
  const { t } = useTranslation();
  const language = useProgressStore(s => s.language);
  const wordProgress = useProgressStore(s => s.wordProgress);
  const { playWord, stop } = useAudio();
  const writerRef = useRef<HanziWriterHandle>(null);

  // ── 字庫：只取已學字，最多 MAX_WORDS 題 ───────────────────────
  const [words] = useState(() => {
    const learned = ALL_WORDS.filter(w => wordProgress[w.id]?.learned);
    return shuffle(learned).slice(0, MAX_WORDS);
  });

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [results, setResults] = useState<Result[]>([]);
  const [mistakesThisWord, setMistakesThisWord] = useState(0);
  const [writerKey, setWriterKey] = useState(0); // force remount on next word
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  const currentWord = words[index];

  // ── 播音（讀默用）────────────────────────────────────────────
  const playAudio = useCallback(() => {
    if (currentWord) playWord(currentWord.character, 'cantonese');
  }, [currentWord, playWord]);

  const playMandarin = useCallback(() => {
    if (currentWord) playWord(currentWord.character, 'mandarin');
  }, [currentWord, playWord]);

  // ── HanziWriter 就緒後立即開始默書測驗 ───────────────────────
  const handleWriterReady = useCallback(() => {
    setTimeout(() => {
      writerRef.current?.startDictationQuiz();
      // 讀默：自動播音
      if (mode === 'listen') {
        setTimeout(playAudio, 300);
      }
    }, 100);
  }, [mode, playAudio]);

  // ── 每題完成 ─────────────────────────────────────────────────
  const handleQuizComplete = useCallback((totalMistakes: number) => {
    setMistakesThisWord(totalMistakes);
    setPhase('feedback');
    if (totalMistakes === 0) {
      playSFX('correct');
    } else {
      playSFX('wrong');
    }
  }, []);

  // ── 記錄結果，前往下一題 ──────────────────────────────────────
  const goNext = useCallback((skipped = false) => {
    const result: Result = {
      wordId: currentWord.id,
      character: currentWord.character,
      mistakes: skipped ? 99 : mistakesThisWord,
      skipped,
    };
    const newResults = [...results, result];
    setResults(newResults);

    if (index + 1 >= words.length) {
      playSFX('complete');
      setPhase('done');
    } else {
      setIndex(i => i + 1);
      setMistakesThisWord(0);
      setWriterKey(k => k + 1);
      setPhase('question');
    }
  }, [currentWord, index, words.length, mistakesThisWord, results]);

  // ── 空字庫：顯示提示 ─────────────────────────────────────────
  if (words.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <AppText style={s.headerTitle}>{t('dictationMode')}</AppText>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.emptyBox}>
          <AppText style={s.emptyEmoji}>📖</AppText>
          <AppText style={s.emptyText}>{t('dictationNoWords')}</AppText>
          <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
            <AppText style={s.retryBtnText}>{t('back') ?? '返回'}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── 完成畫面 ─────────────────────────────────────────────────
  if (phase === 'done') {
    const correct = results.filter(r => r.mistakes === 0).length;
    const total = results.length;
    const pct = Math.round((correct / total) * 100);
    const stars = pct === 100 ? 3 : pct >= 70 ? 2 : 1;

    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <AppText style={s.headerTitle}>{t('dictationDone')}</AppText>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.doneBox}>
          <AppText style={s.doneStars}>{'⭐'.repeat(stars)}</AppText>
          <AppText style={s.doneScore}>
            {t('dictationScore')
              .replace('{correct}', String(correct))
              .replace('{total}', String(total))}
          </AppText>
          <AppText style={s.donePct}>{pct}%</AppText>

          {/* 每題結果 */}
          <View style={s.resultList}>
            {results.map((r, i) => (
              <View key={i} style={s.resultRow}>
                <AppText style={s.resultChar}>{r.character}</AppText>
                {r.skipped ? (
                  <AppText style={s.resultSkip}>跳過</AppText>
                ) : r.mistakes === 0 ? (
                  <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                ) : (
                  <AppText style={s.resultMistake}>
                    {t('dictationMistakes').replace('{n}', String(r.mistakes))}
                  </AppText>
                )}
              </View>
            ))}
          </View>

          <View style={s.doneActions}>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.replace('Dictation', { mode })}>
              <AppText style={s.retryBtnText}>{t('dictationRetry')}</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtnLarge} onPress={() => navigation.goBack()}>
              <AppText style={s.backBtnLargeText}>{t('back') ?? '返回'}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── 主測驗畫面 ───────────────────────────────────────────────
  const meaning = language === 'en'
    ? currentWord.meaning_en
    : language === 'sc'
    ? currentWord.meaning_zh
    : currentWord.meaning_zh;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <AppText style={s.headerTitle}>
          {mode === 'listen' ? t('dictationListen') : t('dictationMemory')}
        </AppText>
        <View style={s.headerRight}>
          <AppText style={s.progressLabel}>
            {t('dictationProgress')
              .replace('{current}', String(index + 1))
              .replace('{total}', String(words.length))}
          </AppText>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${((index) / words.length) * 100}%` }]} />
      </View>

      {/* Question card */}
      <View style={s.questionCard}>
        {mode === 'listen' ? (
          /* 讀默：播音按鈕 */
          <View style={s.listenBox}>
            <TouchableOpacity style={s.playBtn} onPress={playAudio} activeOpacity={0.8}>
              <Ionicons name="volume-high" size={48} color="#fff" />
            </TouchableOpacity>
            <AppText style={s.hintText}>{t('dictationHintListen')}</AppText>
            <View style={s.pronRow}>
              <PronButton lang="cantonese" size="md" onPress={playAudio} />
              <PronButton lang="mandarin"  size="md" onPress={playMandarin} />
            </View>
          </View>
        ) : (
          /* 背默：顯示意思 */
          <View style={s.memoryBox}>
            <AppText style={s.meaningLabel}>{t('dictationMeaning')}</AppText>
            <AppText style={s.meaningText}>{meaning}</AppText>
            <AppText style={s.hintText}>{t('dictationHintMemory')}</AppText>
          </View>
        )}
      </View>

      {/* HanziWriter */}
      <View style={s.canvasWrap}>
        <HanziWriterView
          key={writerKey}
          ref={writerRef}
          character={currentWord.character.length === 1 ? currentWord.character : currentWord.character[0]}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          showOutline={false}
          showCharacter={false}
          animateOnLoad={false}
          onReady={handleWriterReady}
          onQuizComplete={handleQuizComplete}
        />

        {/* Feedback overlay */}
        {phase === 'feedback' && (
          <View style={s.feedbackOverlay}>
            <View style={[
              s.feedbackBadge,
              { backgroundColor: mistakesThisWord === 0 ? '#DCFCE7' : '#FEF3C7' }
            ]}>
              <AppText style={s.feedbackEmoji}>
                {mistakesThisWord === 0 ? '✅' : '🟡'}
              </AppText>
              <AppText style={[
                s.feedbackText,
                { color: mistakesThisWord === 0 ? '#16A34A' : '#B45309' }
              ]}>
                {mistakesThisWord === 0
                  ? t('dictationCorrect')
                  : t('dictationMistakes').replace('{n}', String(mistakesThisWord))}
              </AppText>
              <TouchableOpacity style={s.nextBtn} onPress={() => goNext(false)}>
                <AppText style={s.nextBtnText}>{t('dictationNext')} →</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom actions */}
      {phase === 'question' && (
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.skipBtn} onPress={() => goNext(true)}>
            <AppText style={s.skipBtnText}>{t('dictationSkip')}</AppText>
          </TouchableOpacity>
          {mode === 'listen' && (
            <View style={s.replayRow}>
              <PronButton lang="cantonese" size="sm" onPress={playAudio} />
              <PronButton lang="mandarin"  size="sm" onPress={playMandarin} />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.text },
  headerRight: { width: 80, alignItems: 'flex-end' },
  progressLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  progressTrack: { height: 6, backgroundColor: Colors.borderLight, marginHorizontal: 16, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },

  questionCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: 18, padding: 18,
    backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },

  /* 讀默 */
  listenBox: { alignItems: 'center', gap: 12 },
  pronRow: { flexDirection: 'row', gap: 10 },
  replayRow: { flexDirection: 'row', gap: 8 },
  playBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  replayPill: { marginTop: 4 },

  /* 背默 */
  memoryBox: { alignItems: 'center', gap: 8 },
  meaningLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  meaningText: { fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center' },

  hintText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  /* Canvas */
  canvasWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  /* Feedback overlay */
  feedbackOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(251,249,241,0.88)',
  },
  feedbackBadge: {
    borderRadius: 24, paddingHorizontal: 32, paddingVertical: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
    minWidth: 220,
  },
  feedbackEmoji: { fontSize: 48 },
  feedbackText: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  nextBtn: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  /* Bottom */
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    backgroundColor: Colors.primaryBg,
  },
  skipBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  skipBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  replayBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  /* Empty */
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },

  /* Done */
  doneBox: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 24 },
  doneStars: { fontSize: 48, marginBottom: 8 },
  doneScore: { fontSize: 24, fontWeight: '800', color: Colors.text },
  donePct: { fontSize: 48, fontWeight: '900', color: Colors.primary, marginBottom: 16 },
  resultList: { width: '100%', gap: 10, marginBottom: 24 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: Colors.primaryBg, borderRadius: 14,
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  resultChar: { fontSize: 24, fontWeight: '700', color: Colors.text },
  resultSkip: { fontSize: 14, color: Colors.textMuted },
  resultMistake: { fontSize: 14, color: '#B45309', fontWeight: '600' },
  doneActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  retryBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, flex: 1, alignItems: 'center',
  },
  retryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  backBtnLarge: {
    backgroundColor: Colors.primaryBg, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, flex: 1, alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  backBtnLargeText: { fontSize: 16, fontWeight: '700', color: Colors.text },
});
