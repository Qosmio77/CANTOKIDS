import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import AppText from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Word } from '../../types/word';
import { useAudio } from '../../hooks/useAudio';
import { playSFX } from '../../services/sfxService';
import { useProgressStore } from '../../store/useProgressStore';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS, ALL_WORDS, ALL_CHARACTER_WORDS,
  VOCAB_WORDS, IDIOM_WORDS,
  SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
  SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
} from '../../data/allWords';
import { buildBadgeStats, getNewlyUnlockedBadges, Badge } from '../../services/badgeService';
import BadgeUnlockModal from '../../components/BadgeUnlockModal';
import { QuizLevel } from '../QuizMenuScreen';
import { useTranslation } from '../../hooks/useTranslation';

type QuizType = 'listenPick' | 'readPick' | 'findWrong';

/** 根據級別取得詞庫 */
function getWordPool(level: QuizLevel): Word[] {
  switch (level) {
    case 'seedling':  return SEEDLING_WORDS;
    case 'sapling':   return SAPLING_WORDS;
    case 'tree':      return TREE_WORDS;
    case 'sunflower': return SUNFLOWER_WORDS;
    case 'rainbow':   return RAINBOW_WORDS;
    case 'galaxy':    return GALAXY_WORDS;
    case 'vocab':     return VOCAB_WORDS;
    case 'idiom':     return IDIOM_WORDS;
    case 'all':       return ALL_WORDS.filter((w) => !w.contentType || w.contentType === 'character');
    default:          return SEEDLING_WORDS;
  }
}

interface QuizQuestion {
  type: QuizType;
  correct: Word;       // 正確答案（findWrong = 奇異字）
  options: Word[];     // 4 個選項
}

const QUESTIONS_PER_ROUND = 5;

/** Fisher-Yates 均勻洗牌（修復 Gemini M-2 偏態洗牌） */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 產生「聽音選字」或「看字選音」題目 */
function generateStandardQuestions(quizType: QuizType, level: QuizLevel): QuizQuestion[] {
  const pool = getWordPool(level);
  if (pool.length < 4) return [];
  const selected = shuffle(pool).slice(0, QUESTIONS_PER_ROUND);
  return selected.map((correct) => {
    const wrongs = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3);
    const options = shuffle([...wrongs, correct]);
    return { type: quizType, correct, options };
  });
}

/**
 * 產生「揀錯字」題目
 *
 * 規則：
 * - 選出一個「主題級別」（majority level），取其中 3 個字
 * - 再從另一個級別取 1 個「入侵者」（odd one out）
 * - 玩家需揀出那個不屬於同一主題的字
 * - correct 欄位 = 入侵者（玩家應選的答案）
 *
 * 當 level !== 'all'：強制使用全部 60 字，確保有足夠的跨級別差異。
 */
function generateFindWrongQuestions(): QuizQuestion[] {
  // P2 fix: 改用 ALL_CHARACTER_WORDS，避免詞語/成語混入「找錯字」測驗
  // 按 level 分組
  const groups: Record<string, Word[]> = {};
  for (const w of ALL_CHARACTER_WORDS) {
    if (!groups[w.level]) groups[w.level] = [];
    groups[w.level].push(w);
  }
  const levelKeys = Object.keys(groups).filter((k) => groups[k].length >= 3);
  if (levelKeys.length < 2) return []; // 至少需要 2 個級別才能出題

  const questions: QuizQuestion[] = [];
  const usedMajorityWords = new Set<number>();

  for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
    // 隨機選一個主題級別（majority），取 3 個未用過的字
    const majorityLevel = levelKeys[Math.floor(Math.random() * levelKeys.length)];
    let majorityPool = shuffle(groups[majorityLevel].filter((w) => !usedMajorityWords.has(w.id)));
    if (majorityPool.length < 3) {
      // 用完了就重置，重新從整個 level 取
      usedMajorityWords.clear();
      majorityPool = shuffle(groups[majorityLevel]);
    }
    const majority = majorityPool.slice(0, 3);
    majority.forEach((w) => usedMajorityWords.add(w.id));

    // 選一個來自其他級別的入侵者（odd one out）
    const otherLevels = levelKeys.filter((k) => k !== majorityLevel);
    const oddLevel = otherLevels[Math.floor(Math.random() * otherLevels.length)];
    const oddWord = shuffle(groups[oddLevel])[0];

    const options = shuffle([...majority, oddWord]);
    questions.push({ type: 'findWrong', correct: oddWord, options });
  }
  return questions;
}

/** 產生題目（Phase 5: findWrong 改用語意分組邏輯） */
function generateQuestions(quizType: QuizType, level: QuizLevel): QuizQuestion[] {
  if (quizType === 'findWrong') {
    return generateFindWrongQuestions();
  }
  return generateStandardQuestions(quizType, level);
}

/**
 * QuizScreen — 互動測驗
 *
 * 修復 C-1: addStars 移入 useEffect，guarded by ref，避免 render 迴圈
 * 修復 C-2: setTimeout 以 timeoutRef 追蹤，useEffect cleanup 清除
 * 修復 H-1: Animated.Value 以 useRef 包裝，不隨 render 重建
 * 修復 C-4: findWrong 選項加入渲染邏輯
 * 修復 H-2: 全對時呼叫 incrementPerfectQuiz
 */
export default function QuizScreen({ route, navigation }: any) {
  // 修復 L-4: runtime 驗證 quizType
  const RAW = route?.params?.quizType;
  const VALID: QuizType[] = ['listenPick', 'readPick', 'findWrong'];
  const quizType: QuizType = VALID.includes(RAW) ? RAW : 'listenPick';

  // Phase 4: 驗證 quizLevel
  const RAW_LEVEL = route?.params?.quizLevel;
  const VALID_LEVELS: QuizLevel[] = ['seedling', 'sapling', 'tree', 'sunflower', 'rainbow', 'galaxy', 'vocab', 'idiom', 'all'];
  const quizLevel: QuizLevel = VALID_LEVELS.includes(RAW_LEVEL) ? RAW_LEVEL : 'seedling';

  const { t } = useTranslation();
  const { playWord } = useAudio();
  const { addStars, recordAnswer, incrementPerfectQuiz, incrementTotalAnswers, language, completeDailyTask } = useProgressStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuestions(quizType, quizLevel));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Word | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // 修復 C-1: 防止重複給分的 ref
  const starsAwardedRef = useRef(false);
  // 修復 C-2: timeout ref 追蹤
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 修復 H-1: Animated.Value 以 useRef 包裝
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 修復 C-2: 組件卸載時清除 timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 修復 C-1: 結算給分移入 useEffect，只觸發一次
  useEffect(() => {
    if (finished && !starsAwardedRef.current) {
      starsAwardedRef.current = true;
      const stars = score >= QUESTIONS_PER_ROUND ? 3 : score >= 3 ? 2 : 1;

      // 抓取修改前 stats
      const storeBefore = useProgressStore.getState();
      const statsBefore = buildBadgeStats(
        storeBefore.wordProgress, storeBefore.totalStars,
        storeBefore.perfectQuizzes, storeBefore.streakDays,
        SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
        SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
      );

      addStars(stars);
      completeDailyTask('quiz'); // 每日任務：完成測驗
      if (score === QUESTIONS_PER_ROUND) {
        incrementPerfectQuiz();
      }

      // 比對新解鎖徽章
      const storeAfter = useProgressStore.getState();
      const statsAfter = buildBadgeStats(
        storeAfter.wordProgress, storeAfter.totalStars,
        storeAfter.perfectQuizzes, storeAfter.streakDays,
        SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
        SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
      );
      const unlocked = getNewlyUnlockedBadges(statsBefore, statsAfter);
      if (unlocked.length > 0) {
        setNewBadges(unlocked);
        setShowBadgeModal(true);
      }
    }
  }, [finished]);

  const currentQ = questions[currentIndex];

  // 自動播放（listenPick 模式）—— 只依賴 currentQ，修復 Gemini M-3
  useEffect(() => {
    if (currentQ?.type === 'listenPick') {
      playWord(currentQ.correct.character, 'cantonese');
    }
  }, [currentQ]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerBounce = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleSelect = (option: Word) => {
    if (selectedOption) return;
    setSelectedOption(option);

    const correct = option.id === currentQ.correct.id;
    setIsCorrect(correct);
    recordAnswer(option.id, correct);
    incrementTotalAnswers(correct);

    if (correct) {
      triggerBounce();
      setScore((s) => s + 1);
      playSFX('correct');
    } else {
      triggerShake();
      playWord(currentQ.correct.character, 'cantonese');
      playSFX('wrong');
    }

    // 修復 C-2: 用 timeoutRef 追蹤，修復 M-2: 用 functional updater
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= QUESTIONS_PER_ROUND) {
          setFinished(true);
          return prev;
        }
        setSelectedOption(null);
        setIsCorrect(null);
        return next;
      });
    }, 1200);
  };

  // 重玩
  const handleRetry = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    starsAwardedRef.current = false;
    setQuestions(generateQuestions(quizType, quizLevel));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setFinished(false);
  };

  // 結算畫面
  if (finished) {
    const stars = score >= QUESTIONS_PER_ROUND ? 3 : score >= 3 ? 2 : 1;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <AppText style={styles.resultEmoji}>{score === QUESTIONS_PER_ROUND ? '🎉' : '👏'}</AppText>
          <AppText style={styles.resultTitle}>
            {score === QUESTIONS_PER_ROUND ? t('quizResultPerfect') : t('quizResultDone')}
          </AppText>
          <AppText style={styles.resultScore}>
            {t('quizResultScore').replace('{score}', String(score)).replace('{total}', String(QUESTIONS_PER_ROUND))}
          </AppText>
          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={36} color={Colors.primary} />
            ))}
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <AppText style={styles.retryBtnText}>{t('quizPlayAgain')}</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.goBack()}>
            <AppText style={styles.homeBtnText}>{t('quizGoHome')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQ) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 進度條 */}
      <View style={styles.progressRow}>
        <AppText style={styles.progressLabel}>{currentIndex + 1} / {QUESTIONS_PER_ROUND}</AppText>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / QUESTIONS_PER_ROUND) * 100}%` }]} />
        </View>
        <View style={styles.scoreTag}>
          <Ionicons name="star" size={14} color={Colors.primary} />
          <AppText style={styles.scoreText}>{score}</AppText>
        </View>
      </View>

      {/* 題目區 */}
      <View style={styles.questionArea}>
        {currentQ.type === 'listenPick' && (
          <>
            <AppText style={styles.questionHint}>{t('quizHintListen')}</AppText>
            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => playWord(currentQ.correct.character, 'cantonese')}
              accessibilityLabel={t('quizHintReplay')}
            >
              <Ionicons name="volume-high" size={52} color={Colors.cantonese} />
              <AppText style={styles.speakerLabel}>{t('quizHintReplay')}</AppText>
            </TouchableOpacity>
          </>
        )}
        {currentQ.type === 'readPick' && (
          <>
            <AppText style={styles.questionHint}>{t('quizHintRead')}</AppText>
            <Animated.Text style={[styles.questionChar, { transform: [{ scale: scaleAnim }] }]}>
              {currentQ.correct.character}
            </Animated.Text>
          </>
        )}
        {currentQ.type === 'findWrong' && (
          <>
            <AppText style={styles.questionHint}>{t('quizHintFindWrong')}</AppText>
            <AppText style={styles.questionSubhint}>{t('quizHintFindWrongSub')}</AppText>
          </>
        )}
      </View>

      {/* 選項格 */}
      <Animated.View style={[styles.optionsGrid, { transform: [{ translateX: shakeAnim }] }]}>
        {currentQ.options.map((option) => {
          const isSelected = selectedOption?.id === option.id;
          const isAnswer = option.id === currentQ.correct.id;
          const cardStyle = [
            styles.optionCard,
            selectedOption && isAnswer && styles.optionCorrect,
            selectedOption && isSelected && !isAnswer && styles.optionWrong,
          ];

          return (
            <TouchableOpacity
              key={option.id}
              style={cardStyle}
              onPress={() => handleSelect(option)}
              disabled={!!selectedOption}
              accessibilityLabel={t('quizA11yOption').replace('{char}', option.character).replace('{meaning}', option.meaning_zh)}
            >
              {/* 修復 C-4: 所有模式都正確渲染選項內容 */}
              {(currentQ.type === 'listenPick' || currentQ.type === 'findWrong') && (
                <AppText style={styles.optionChar}>{option.character}</AppText>
              )}
              {currentQ.type === 'findWrong' && (
                <AppText style={styles.optionMeaning}>{option.meaning_zh}</AppText>
              )}
              {currentQ.type === 'readPick' && (
                <>
                  <AppText style={styles.optionJyutping}>{option.jyutping}</AppText>
                  <AppText style={styles.optionPinyin}>{option.pinyin}</AppText>
                </>
              )}
              {selectedOption && isAnswer && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={styles.resultIcon} />
              )}
              {selectedOption && isSelected && !isAnswer && (
                <Ionicons name="close-circle" size={20} color={Colors.error} style={styles.resultIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* 答題後回饋 */}
      {selectedOption && (
        <View style={[styles.feedbackBar, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <AppText style={styles.feedbackText}>
            {(() => {
              const char = currentQ.correct.character;
              const meaning = language === 'en' ? currentQ.correct.meaning_en : currentQ.correct.meaning_zh;
              if (currentQ.type === 'findWrong') {
                return isCorrect
                  ? t('quizFeedbackFindCorrect').replace('{char}', char).replace('{meaning}', meaning)
                  : t('quizFeedbackFindWrong').replace('{char}', char).replace('{meaning}', meaning);
              }
              return isCorrect
                ? t('quizFeedbackCorrect').replace('{char}', char).replace('{meaning}', meaning)
                : t('quizFeedbackWrong').replace('{char}', char).replace('{meaning}', meaning);
            })()}
          </AppText>
        </View>
      )}

      {/* 徽章解鎖慶祝彈窗 */}
      <BadgeUnlockModal
        badges={newBadges}
        visible={showBadgeModal}
        onClose={() => {
          const remaining = newBadges.slice(1);
          setNewBadges(remaining);
          setShowBadgeModal(remaining.length > 0);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  progressLabel: { fontSize: 13, color: Colors.textMuted, width: 40 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  scoreTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  questionArea: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  questionHint: { fontSize: 15, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  questionSubhint: { fontSize: 13, color: Colors.textMuted, marginBottom: 16, textAlign: 'center' },
  speakerBtn: { alignItems: 'center', gap: 8 },
  speakerLabel: { fontSize: 13, color: Colors.cantonese },
  questionChar: { fontSize: 80, fontWeight: '800', color: Colors.text },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 20, justifyContent: 'center' },
  optionCard: {
    width: '45%',
    paddingVertical: 20,
    backgroundColor: Colors.primaryBg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C4BFA8',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)',
    borderRightColor: 'rgba(180,175,155,0.4)',
    gap: 4,
  },
  optionCorrect: {
    backgroundColor: Colors.successLight,
    borderTopColor: Colors.success,
    borderLeftColor: Colors.success,
    borderBottomColor: Colors.success,
    borderRightColor: Colors.success,
  },
  optionWrong: {
    backgroundColor: Colors.errorLight,
    borderTopColor: Colors.error,
    borderLeftColor: Colors.error,
    borderBottomColor: Colors.error,
    borderRightColor: Colors.error,
  },
  optionChar: { fontSize: 36, fontWeight: '700', color: Colors.text },
  optionMeaning: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  optionJyutping: { fontSize: 20, fontWeight: '700', color: Colors.cantonese },
  optionPinyin: { fontSize: 13, color: Colors.textMuted },
  resultIcon: { position: 'absolute', top: 8, right: 8 },
  feedbackBar: { marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12 },
  feedbackCorrect: { backgroundColor: Colors.successLight },
  feedbackWrong: { backgroundColor: Colors.errorLight },
  feedbackText: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  resultEmoji: { fontSize: 64 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: Colors.text },
  resultScore: { fontSize: 18, color: Colors.textSecondary },
  starsRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, gap: 8, marginTop: 8, shadowColor: '#8B6000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  retryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  homeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: Colors.primaryBg,
    borderRadius: 14,
    shadowColor: '#C4BFA8',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)',
    borderRightColor: 'rgba(180,175,155,0.4)',
  },
  homeBtnText: { fontSize: 15, color: Colors.textSecondary },
});
