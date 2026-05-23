/**
 * PlacementTestScreen — 入學程度測試
 *
 * 流程：
 *   每個級別出 3 道選擇題（看字選讀音 or 聽音選字）
 *   連續 2/3 答對 → 進入下一級別
 *   失敗或 4 個級別測完 → 顯示結果
 *
 * 結果：
 *   解鎖對應課節（seedling=10, sapling=20, tree=30, sunflower=40）
 *   呼叫 completePlacement(n) 記錄到 store
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, Dimensions,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { useAudio } from '../hooks/useAudio';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS, SUNFLOWER_WORDS,
} from '../data/allWords';
import { Word } from '../types/word';

const { width: SW } = Dimensions.get('window');

// ── Level config ─────────────────────────────────────────────────────────────
const LEVELS = [
  { key: 'seedling',  words: SEEDLING_WORDS,  unlockCount: 10, labelZh: '幼苗級', labelEn: 'Seedling' },
  { key: 'sapling',   words: SAPLING_WORDS,   unlockCount: 20, labelZh: '小樹級', labelEn: 'Sapling'  },
  { key: 'tree',      words: TREE_WORDS,       unlockCount: 30, labelZh: '大樹級', labelEn: 'Tree'      },
  { key: 'sunflower', words: SUNFLOWER_WORDS,  unlockCount: 40, labelZh: '向日葵級',labelEn: 'Sunflower'},
];
const QUESTIONS_PER_LEVEL = 3;
const PASS_THRESHOLD       = 2; // need 2/3 correct to advance

// ── Generate questions for one level ─────────────────────────────────────────
interface Question {
  word:    Word;
  options: Word[];  // 4 options including correct
  correct: Word;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(words: Word[], allWords: Word[], count: number): Question[] {
  const pool    = shuffle(words).slice(0, count);
  return pool.map((word) => {
    const distractors = shuffle(
      allWords.filter((w) => w.id !== word.id && w.jyutping !== word.jyutping)
    ).slice(0, 3);
    const options = shuffle([word, ...distractors]);
    return { word, options, correct: word };
  });
}

// ── Result level ─────────────────────────────────────────────────────────────
interface ResultDef {
  levelIdx: number;   // -1 = below seedling (start from beginning)
  unlockCount: number;
  labelZh: string;
  labelEn: string;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PlacementTestScreen({ navigation }: any) {
  const { language, completePlacement } = useProgressStore();
  const { playWord } = useAudio();

  const iL = language === 'en';

  // ── State ──
  const [phase, setPhase] = useState<'intro' | 'testing' | 'result'>('intro');

  // All words pool for distractor generation
  const allTestWords = [...SEEDLING_WORDS, ...SAPLING_WORDS, ...TREE_WORDS, ...SUNFLOWER_WORDS];

  // Build all questions upfront
  const allQuestions = useRef<{ levelIdx: number; question: Question }[]>([]);

  const [currentLevelIdx, setCurrentLevelIdx]  = useState(0);
  const [currentQIdx, setCurrentQIdx]          = useState(0);
  const [levelCorrect, setLevelCorrect]        = useState(0);
  const [resultLevelIdx, setResultLevelIdx]    = useState(-1);

  const [selectedOption, setSelectedOption]    = useState<Word | null>(null);
  const [isCorrect, setIsCorrect]              = useState<boolean | null>(null);

  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  // Current level's questions
  const [questions, setQuestions] = useState<Question[]>([]);

  const startLevel = useCallback((levelIdx: number) => {
    const level = LEVELS[levelIdx];
    const qs = buildQuestions(level.words, allTestWords, QUESTIONS_PER_LEVEL);
    setQuestions(qs);
    setCurrentLevelIdx(levelIdx);
    setCurrentQIdx(0);
    setLevelCorrect(0);
    setSelectedOption(null);
    setIsCorrect(null);
  }, []);

  const handleStart = () => {
    startLevel(0);
    setPhase('testing');
  };

  const handleAnswer = useCallback((option: Word) => {
    if (selectedOption) return;
    const q = questions[currentQIdx];
    const correct = option.id === q.correct.id;

    setSelectedOption(option);
    setIsCorrect(correct);

    if (correct) {
      playWord(q.word.character, 'cantonese');
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,   duration: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
      ]).start();
    }

    const newCorrect = levelCorrect + (correct ? 1 : 0);

    setTimeout(() => {
      const nextQIdx = currentQIdx + 1;
      if (nextQIdx >= QUESTIONS_PER_LEVEL) {
        // Level done — check pass/fail
        const passed = newCorrect >= PASS_THRESHOLD;
        if (passed && currentLevelIdx + 1 < LEVELS.length) {
          // Advance to next level
          startLevel(currentLevelIdx + 1);
        } else {
          // Done — show result
          // Result = the level we just completed if passed, else previous
          const resultIdx = passed ? currentLevelIdx : currentLevelIdx - 1;
          setResultLevelIdx(resultIdx);
          setPhase('result');
        }
      } else {
        setCurrentQIdx(nextQIdx);
        setSelectedOption(null);
        setIsCorrect(null);
        if (correct) setLevelCorrect(newCorrect);
      }
    }, 900);

    if (correct) setLevelCorrect(newCorrect);
  }, [selectedOption, questions, currentQIdx, levelCorrect, currentLevelIdx]);

  const handleFinish = (resultIdx: number) => {
    const unlock = resultIdx >= 0 ? LEVELS[resultIdx].unlockCount : 10;
    completePlacement(unlock);
    navigation.replace('MainTabs');
  };

  const handleSkip = () => {
    completePlacement(10); // default: seedling
    navigation.goBack();
  };

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.introBg}>
          <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
            <AppText style={s.skipText}>{iL ? 'Skip' : '略過'}</AppText>
          </TouchableOpacity>
          <AppText style={s.introEmoji}>🎓</AppText>
          <AppText style={s.introTitle}>
            {iL ? 'Placement Test' : '程度測試'}
          </AppText>
          <AppText style={s.introDesc}>
            {iL
              ? 'Answer a few questions so we can find the right starting level for you.\n\nIt takes about 2 minutes.'
              : '回答幾道問題，讓我們找出最適合你的學習起點。\n\n大概需要 2 分鐘。'}
          </AppText>
          <View style={s.introDetails}>
            {LEVELS.map((lv, i) => (
              <View key={lv.key} style={s.levelPreviewRow}>
                <AppText style={s.levelPreviewDot}>●</AppText>
                <AppText style={s.levelPreviewText}>
                  {iL ? lv.labelEn : lv.labelZh} — {QUESTIONS_PER_LEVEL} {iL ? 'questions' : '題'}
                </AppText>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.startBtn} onPress={handleStart}>
            <AppText style={s.startBtnText}>
              {iL ? 'Start Test' : '開始測試'}
            </AppText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result ──
  if (phase === 'result') {
    const resultLevel = resultLevelIdx >= 0 ? LEVELS[resultLevelIdx] : null;
    const unlockCount = resultLevel ? resultLevel.unlockCount : 10;
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.introBg}>
          <AppText style={s.introEmoji}>
            {resultLevelIdx >= 3 ? '🏆' : resultLevelIdx >= 2 ? '🌟' : resultLevelIdx >= 1 ? '🌿' : '🌱'}
          </AppText>
          <AppText style={s.resultTitle}>
            {iL ? 'Test Complete!' : '測試完成！'}
          </AppText>
          <AppText style={s.resultLevel}>
            {resultLevel
              ? (iL ? resultLevel.labelEn : resultLevel.labelZh)
              : (iL ? 'Seedling' : '幼苗級')}
          </AppText>
          <AppText style={s.resultDesc}>
            {iL
              ? `We've unlocked the first ${unlockCount} lessons for you. Start learning!`
              : `我們已為你解鎖首 ${unlockCount} 個課節，開始學習吧！`}
          </AppText>
          <TouchableOpacity
            style={s.startBtn}
            onPress={() => handleFinish(resultLevelIdx)}
          >
            <AppText style={s.startBtnText}>
              {iL ? 'Start Learning!' : '開始學習！'}
            </AppText>
            <Ionicons name="rocket" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Testing ──
  const currentLevel = LEVELS[currentLevelIdx];
  const q = questions[currentQIdx];
  if (!q) return null;

  const totalQ  = (currentLevelIdx) * QUESTIONS_PER_LEVEL + currentQIdx + 1;
  const maxQ    = LEVELS.length * QUESTIONS_PER_LEVEL;
  const progressPct = totalQ / maxQ;

  return (
    <SafeAreaView style={s.safe}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progressPct * 100}%` as any }]} />
      </View>

      {/* Level badge */}
      <View style={s.levelBadgeRow}>
        <View style={s.levelBadge}>
          <AppText style={s.levelBadgeText}>
            {iL ? currentLevel.labelEn : currentLevel.labelZh}
          </AppText>
        </View>
        <AppText style={s.qCounter}>
          {currentQIdx + 1}/{QUESTIONS_PER_LEVEL}
        </AppText>
      </View>

      <View style={s.testBody}>
        {/* Question */}
        <AppText style={s.questionPrompt}>
          {iL ? 'What is the pronunciation of:' : '選出正確讀音：'}
        </AppText>

        <Animated.View style={{
          transform: [
            { translateX: shakeAnim },
            { scale: scaleAnim },
          ]
        }}>
          <View style={[
            s.charCard,
            selectedOption && (isCorrect ? s.charCardCorrect : s.charCardWrong),
          ]}>
            <AppText style={s.charDisplay}>{q.word.character}</AppText>
            <AppText style={s.charMeaning}>
              {iL ? q.word.meaning_en : q.word.meaning_zh}
            </AppText>
          </View>
        </Animated.View>

        {/* Options */}
        <View style={s.optionsGrid}>
          {q.options.map((option) => {
            const isSelected = selectedOption?.id === option.id;
            const isRight    = option.id === q.correct.id;
            const showGreen  = isSelected && isRight;
            const showRed    = isSelected && !isRight;
            const showHint   = !!selectedOption && isRight && !isSelected;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  s.optionBtn,
                  showGreen && s.optionCorrect,
                  showRed   && s.optionWrong,
                  showHint  && s.optionHint,
                ]}
                onPress={() => handleAnswer(option)}
                disabled={!!selectedOption}
                activeOpacity={0.75}
              >
                <AppText style={[
                  s.optionJyut,
                  showGreen && s.optionTextCorrect,
                  showRed   && s.optionTextWrong,
                ]}>
                  {option.jyutping}
                </AppText>
                <AppText style={[
                  s.optionChar,
                  showGreen && s.optionTextCorrect,
                  showRed   && s.optionTextWrong,
                ]}>
                  {option.character}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const OPTION_W = (SW - 48 - 12) / 2;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryBg },

  // ── Progress bar ──
  progressBar: { height: 5, backgroundColor: Colors.borderLight, marginBottom: 0 },
  progressFill: { height: 5, backgroundColor: Colors.primary, borderRadius: 3 },

  // ── Level badge ──
  levelBadgeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
  },
  levelBadge: {
    backgroundColor: Colors.primaryMuted, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  levelBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  qCounter: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },

  // ── Test body ──
  testBody: {
    flex: 1, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  questionPrompt: {
    fontSize: 16, color: Colors.textSecondary, textAlign: 'center',
  },
  charCard: {
    width: SW - 80, paddingVertical: 28, paddingHorizontal: 24,
    borderRadius: 24, alignItems: 'center',
    backgroundColor: Colors.primaryMuted, gap: 8,
    borderWidth: 2, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  charCardCorrect: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  charCardWrong:   { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  charDisplay: { fontSize: 80, fontWeight: '800', color: Colors.text },
  charMeaning: { fontSize: 18, color: Colors.textSecondary },

  optionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
  },
  optionBtn: {
    width: OPTION_W, paddingVertical: 16, paddingHorizontal: 12,
    borderRadius: 18, alignItems: 'center',
    backgroundColor: Colors.primaryBg, gap: 4,
    borderWidth: 2, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  optionWrong:   { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  optionHint:    { backgroundColor: '#FEF9C3', borderColor: '#FDE68A' },
  optionJyut:    { fontSize: 18, fontWeight: '800', color: Colors.text },
  optionChar:    { fontSize: 14, color: Colors.textMuted },
  optionTextCorrect: { color: '#15803D' },
  optionTextWrong:   { color: '#B91C1C' },

  // ── Intro / Result ──
  introBg: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 18,
  },
  skipBtn: {
    position: 'absolute', top: 16, right: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.primaryMuted, borderRadius: 10,
  },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  introEmoji:  { fontSize: 72 },
  introTitle:  { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  introDesc:   { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  introDetails: { alignSelf: 'stretch', gap: 6 },
  levelPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelPreviewDot: { color: Colors.primary, fontSize: 12 },
  levelPreviewText: { fontSize: 15, color: Colors.textSecondary },

  resultTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  resultLevel: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  resultDesc:  { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 36, marginTop: 8,
    shadowColor: '#8B6000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  startBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
});
