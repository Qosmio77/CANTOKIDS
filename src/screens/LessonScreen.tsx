/**
 * LessonScreen — 學習課室
 *
 * 支援三種內容：
 *   character — 單字（原有流程）
 *   word      — 詞語（2字）：顯示各分字拼音、逐字練寫
 *   idiom     — 成語（4字）：同上
 *
 * 自適應字體：
 *   1 字 → 72px | 2 字 → 56px | 4 字 → 40px
 *
 * 逐字練寫：
 *   charIndex 指向目前正在練寫的分字
 *   每字完成後移到下一字，最後一字完成才統計分數
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HanziWriterView, { HanziWriterHandle } from '../components/HanziWriterView';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import LevelUpModal from '../components/LevelUpModal';
import {
  useProgressStore,
  getRankByXP,
  XP_PER_WORD_LEARNED,
  XP_PER_QUIZ_CORRECT,
  PlayerRank,
} from '../store/useProgressStore';
import { useAudio } from '../hooks/useAudio';
import { getWordById, ALL_WORDS, SEEDLING_IDS, SAPLING_IDS, TREE_IDS, SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS } from '../data/allWords';
import { buildBadgeStats, getNewlyUnlockedBadges, Badge } from '../services/badgeService';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';

type Tab = 'meaning' | 'write';
type WritePhase = 'animating' | 'ready' | 'quizzing' | 'done';

function starsForMistakes(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

/** 根據字數決定主字體大小 */
function mainCharFontSize(charLength: number): number {
  if (charLength <= 1) return 72;
  if (charLength <= 2) return 56;
  return 40;
}

const CONTENT_TYPE_COLOR: Record<string, string> = {
  character: Colors.primary,
  word:      '#059669',
  idiom:     '#7C3AED',
};

export default function LessonScreen({ route, navigation }: any) {
  const { wordId, lessonId } = route.params as { wordId: number; lessonId: number };
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<Tab>('meaning');
  const [writePhase, setWritePhase] = useState<WritePhase>('animating');
  const [earnedStars, setEarnedStars] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRank, setNewRank] = useState<PlayerRank | null>(null);

  // ── 多字練寫狀態 ──────────────────────────────────────────────────
  const [charIndex, setCharIndex] = useState(0);
  const accMistakesRef = useRef(0);
  // 每個字固定練 2 次：第 1 次有數字，第 2 次無數字（0 = 未開始）
  const [quizRound, setQuizRound] = useState(0);

  // Star pop animation
  const starScale = useRef(new Animated.Value(0)).current;
  const writerRef = useRef<HanziWriterHandle>(null);
  // 練寫嘗試次數：第 1 次保留筆順數字，第 2 次起清除
  const quizAttemptRef = useRef(0);

  const {
    markWordLearned, addStars, unlockLesson,
    playerXP, addXP,
  } = useProgressStore();
  const { playWord } = useAudio();

  const word = getWordById(wordId);
  if (!word) return null;

  // ── 多字支援相關計算 ──────────────────────────────────────────────
  const isMultiChar = (word.components?.length ?? 1) > 1;
  const writeComponents = word.components ?? [word.character];
  const currentWriteChar = writeComponents[charIndex];

  /** 播放整個詞語/成語的發音（逐字間隔播放） */
  const playMultiChar = useCallback((lang: 'cantonese' | 'mandarin') => {
    const chars = word.components ?? [word.character];
    chars.forEach((ch, i) => {
      setTimeout(() => playWord(ch, lang), i * 650);
    });
  }, [word, playWord]);

  // ── 動畫結束 → 顯示「開始練寫」 ─────────────────────────────────
  const handleAnimationComplete = useCallback(() => {
    quizAttemptRef.current = 0;
    setQuizRound(0);
    setWritePhase('ready');
  }, []);

  // ── 開始練寫（永遠從第 1 次開始，有筆順數字）────────────────────
  const handleStartQuiz = useCallback(() => {
    quizAttemptRef.current = 1;
    setQuizRound(1);
    setWritePhase('quizzing');
    writerRef.current?.startQuiz();   // 第 1 次：保留數字作引導
  }, []);

  // ── 完成整個課程 ──────────────────────────────────────────────────
  const finalizeLesson = useCallback((totalMistakes: number) => {
    const stars = starsForMistakes(totalMistakes);

    const storeBefore = useProgressStore.getState();
    const statsBefore = buildBadgeStats(
      storeBefore.wordProgress, storeBefore.totalStars,
      storeBefore.perfectQuizzes, storeBefore.streakDays,
      SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
      SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
    );

    markWordLearned(wordId);
    addStars(stars);
    unlockLesson(lessonId + 1);

    const xpGained = XP_PER_WORD_LEARNED + (totalMistakes === 0 ? XP_PER_QUIZ_CORRECT * 2 : XP_PER_QUIZ_CORRECT);
    const leveledUp = addXP(xpGained);
    if (leveledUp) {
      const currentXP = useProgressStore.getState().playerXP;
      const rank = getRankByXP(currentXP);
      setNewRank(rank);
      setShowLevelUp(true);
    }

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

    setEarnedStars(stars);
    setWritePhase('done');

    Animated.spring(starScale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [wordId, lessonId, markWordLearned, addStars, unlockLesson, addXP, starScale]);

  // ── 每個分字練寫完成 ──────────────────────────────────────────────
  const handleQuizComplete = useCallback(
    (mistakes: number) => {
      if (writePhase === 'done') return;

      accMistakesRef.current += mistakes;

      if (quizAttemptRef.current === 1) {
        // ── 第 1 次完成 → 自動開始第 2 次（無數字）──
        quizAttemptRef.current = 2;
        setQuizRound(2);
        writerRef.current?.startQuizNoNumbers();
        return;
      }

      // ── 第 2 次完成 → 結算這個字 ──
      const totalMistakes = accMistakesRef.current;
      quizAttemptRef.current = 0;
      setQuizRound(0);

      if (isMultiChar && charIndex < writeComponents.length - 1) {
        // 多字詞：移到下一個字（accMistakesRef 繼續累加）
        setCharIndex((prev) => prev + 1);
        setWritePhase('animating');
      } else {
        // 全部字完成
        finalizeLesson(totalMistakes);
        accMistakesRef.current = 0;
      }
    },
    [writePhase, isMultiChar, charIndex, writeComponents.length, finalizeLesson]
  );

  // ── 重新練寫（重置所有狀態） ──────────────────────────────────────
  const handleReplay = useCallback(() => {
    setCharIndex(0);
    accMistakesRef.current = 0;
    quizAttemptRef.current = 0;
    setQuizRound(0);
    setWritePhase('animating');
    setEarnedStars(0);
    starScale.setValue(0);
    writerRef.current?.replay();
  }, [starScale]);

  // ── 下一關 ────────────────────────────────────────────────────────
  // P2 fix: 改用陣列索引尋找，避免非連續 ID（1001, 2001）與 length 比較出錯
  // 同時確保不會跨內容類型自動跳轉（字元 → 詞語應由地圖頁選擇）
  const nextWordId = (() => {
    const idx = ALL_WORDS.findIndex((w) => w.id === wordId);
    if (idx === -1 || idx + 1 >= ALL_WORDS.length) return null;
    const curr = ALL_WORDS[idx];
    const next = ALL_WORDS[idx + 1];
    const currType = curr.contentType ?? 'character';
    const nextType = next.contentType ?? 'character';
    return currType === nextType ? next.id : null;
  })();
  const handleNextLesson = () => {
    if (nextWordId) {
      navigation.replace('Lesson', { wordId: nextWordId, lessonId: lessonId + 1 });
    } else {
      navigation.goBack();
    }
  };

  const starRow = (count: number) =>
    Array.from({ length: 3 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < count ? 'star' : 'star-outline'}
        size={36}
        color={i < count ? '#F59E0B' : '#D1D5DB'}
      />
    ));

  // ── 內容類型標籤顏色 ──────────────────────────────────────────────
  const contentType = word.contentType ?? 'character';
  const typeColor   = CONTENT_TYPE_COLOR[contentType] ?? Colors.primary;
  const typeLabel   = t(
    contentType === 'word'  ? 'contentTypeWord' :
    contentType === 'idiom' ? 'contentTypeIdiom' : 'contentTypeChar'
  );

  // 字義分頁：級別顯示
  const levelEmoji: Record<string, string> = {
    seedling:  '🌱幼苗', sapling: '🌳小樹', tree: '🏆大樹',
    sunflower: '🌻向日葵', rainbow: '🌈彩虹', galaxy: '⭐星河',
    bamboo:    '🎋竹林', jade: '💎玉龍',
    vocab:     '📝詞語', idiom: '🏮成語',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── 頂部：字 + 發音 + 類型徽章 ── */}
      <View style={styles.wordHeader}>
        {/* 內容類型徽章 */}
        <View style={[styles.contentTypeBadge, { backgroundColor: typeColor + '1A', borderColor: typeColor + '60' }]}>
          <Text style={[styles.contentTypeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>

        {/* 主字顯示 */}
        <Text style={[styles.mainChar, { fontSize: mainCharFontSize(word.character.length) }]}>
          {word.character}
        </Text>

        {/* 發音徽章 */}
        {isMultiChar ? (
          /* 多字：顯示各分字拼音 + 整體播放按鈕 */
          <View style={styles.multiPronContainer}>
            {/* 各分字 jyutping */}
            <View style={styles.componentBadgeRow}>
              {(word.componentJyutping ?? []).map((jp, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.componentBadge}
                  onPress={() => playWord((word.components ?? [])[i] ?? word.character, 'cantonese')}
                  accessibilityLabel={`粵語：${jp}`}
                >
                  <Text style={styles.componentChar}>{(word.components ?? [])[i]}</Text>
                  <Text style={styles.componentJyutping}>{jp}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* 整體播放 */}
            <View style={styles.pronunciationRow}>
              <TouchableOpacity
                style={styles.pronBadge}
                onPress={() => playMultiChar('cantonese')}
                accessibilityLabel={`粵語：${word.jyutping}`}
              >
                <Ionicons name="volume-high" size={14} color="#1D4ED8" />
                <Text style={styles.pronLabel}>{t('lessonCantonese')}</Text>
                <Text style={styles.pronText}>{word.jyutping}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pronBadge, styles.pronBadgeMandarin]}
                onPress={() => playMultiChar('mandarin')}
                accessibilityLabel={`普通話：${word.pinyin}`}
              >
                <Ionicons name="volume-high" size={14} color="#7C3AED" />
                <Text style={[styles.pronLabel, styles.pronLabelMandarin]}>{t('lessonMandarin')}</Text>
                <Text style={styles.pronText}>{word.pinyin}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* 單字：原有發音徽章 */
          <View style={styles.pronunciationRow}>
            <TouchableOpacity
              style={styles.pronBadge}
              onPress={() => playWord(word.character, 'cantonese')}
              accessibilityLabel={`粵語發音：${word.jyutping}`}
            >
              <Ionicons name="volume-high" size={14} color="#1D4ED8" />
              <Text style={styles.pronLabel}>{t('lessonCantonese')}</Text>
              <Text style={styles.pronText}>{word.jyutping}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pronBadge, styles.pronBadgeMandarin]}
              onPress={() => playWord(word.character, 'mandarin')}
              accessibilityLabel={`普通話發音：${word.pinyin}`}
            >
              <Ionicons name="volume-high" size={14} color="#7C3AED" />
              <Text style={[styles.pronLabel, styles.pronLabelMandarin]}>{t('lessonMandarin')}</Text>
              <Text style={styles.pronText}>{word.pinyin}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── 分頁切換 ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meaning' && styles.tabActive]}
          onPress={() => setActiveTab('meaning')}
          accessibilityLabel="字義分頁"
        >
          <Text style={[styles.tabText, activeTab === 'meaning' && styles.tabTextActive]}>
            {contentType === 'character' ? t('lessonTab_meaning') : t('lessonTab_wordMeaning')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'write' && styles.tabActive]}
          onPress={() => setActiveTab('write')}
          accessibilityLabel={t('lessonTab_writing')}
        >
          <Text style={[styles.tabText, activeTab === 'write' && styles.tabTextActive]}>
            {t('lessonTab_writing')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} scrollEnabled={activeTab === 'meaning'}>
        {/* ═══════════════════════════════
            字義分頁
        ═══════════════════════════════ */}
        {activeTab === 'meaning' && (
          <View style={styles.meaningContainer}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('lessonMeaning')}</Text>
              <Text style={styles.infoValue}>{word.meaning_zh}</Text>
              <Text style={styles.infoValueEn}>{word.meaning_en}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{t('lessonExample')}</Text>
              <Text style={styles.exampleSentence}>{word.example_sentence}</Text>
            </View>

            <View style={styles.infoCardRow}>
              <View style={[styles.infoCard, styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>{t('lessonStrokes')}</Text>
                <Text style={styles.infoValue}>{t('lessonStrokeCount').replace('{n}', String(word.stroke_count))}</Text>
              </View>
              <View style={[styles.infoCard, styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>{t('lessonLevel')}</Text>
                <Text style={[styles.infoValue, { color: typeColor }]}>{levelEmoji[word.level] ?? word.level}</Text>
              </View>
            </View>

            {/* 成語額外說明 */}
            {contentType === 'idiom' && (
              <View style={[styles.infoCard, styles.idiomNote]}>
                <Text style={styles.infoLabel}>{t('lessonIdiomComponents')}</Text>
                <View style={styles.idiomCharsRow}>
                  {(word.components ?? []).map((c, i) => (
                    <View key={i} style={styles.idiomCharItem}>
                      <Text style={styles.idiomCharText}>{c}</Text>
                      <Text style={styles.idiomCharJp}>{(word.componentJyutping ?? [])[i]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextTabBtn, { backgroundColor: typeColor }]}
              onPress={() => setActiveTab('write')}
              accessibilityLabel="前往練寫分頁"
            >
              <Text style={styles.nextTabBtnText}>{t('lessonPractice')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════
            練寫分頁
        ═══════════════════════════════ */}
        {activeTab === 'write' && (
          <View style={styles.writeContainer}>
            {/* 多字進度指示器 */}
            {isMultiChar && writePhase !== 'done' && (
              <View style={styles.charProgressRow}>
                {writeComponents.map((c, i) => (
                  <View
                    key={i}
                    style={[
                      styles.charProgressItem,
                      i === charIndex && styles.charProgressItemActive,
                      i < charIndex  && styles.charProgressItemDone,
                    ]}
                  >
                    <Text style={[
                      styles.charProgressText,
                      i === charIndex && styles.charProgressTextActive,
                      i < charIndex  && styles.charProgressTextDone,
                    ]}>
                      {c}
                    </Text>
                    {i < charIndex && (
                      <Ionicons
                        name="checkmark"
                        size={10}
                        color={Colors.success}
                        style={styles.charProgressCheck}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* 狀態提示文字 */}
            <Text style={styles.writeHint}>
              {writePhase === 'animating' && (isMultiChar
                ? t('watchingChar').replace('{char}', currentWriteChar)
                : t('lessonWatchDemo'))}
              {writePhase === 'ready'    && t('lessonReady')}
              {writePhase === 'quizzing' && quizRound === 1 && t('lessonQuizRound1').replace('{char}', currentWriteChar)}
              {writePhase === 'quizzing' && quizRound === 2 && t('lessonQuizRound2').replace('{char}', currentWriteChar)}
              {writePhase === 'done'     && t('lessonAllDone')}
            </Text>

            {/* HanziWriter 畫布
                key 改變 → 強制重新掛載，載入新字 */}
            {writePhase !== 'done' && (
              <HanziWriterView
                key={`${word.id}-char-${charIndex}`}
                ref={writerRef}
                character={currentWriteChar}
                width={280}
                height={280}
                showOutline={true}
                animateOnLoad={true}
                onAnimationComplete={handleAnimationComplete}
                onQuizComplete={handleQuizComplete}
              />
            )}

            {/* ── 階段：ready → 開始練寫 ── */}
            {writePhase === 'ready' && (
              <View style={styles.phaseActions}>
                <TouchableOpacity
                  style={styles.replayBtn}
                  onPress={() => writerRef.current?.replay()}
                  accessibilityLabel="重播示範動畫"
                >
                  <Ionicons name="refresh" size={18} color={Colors.primary} />
                  <Text style={styles.replayBtnText}>{t('lessonReplayDemo')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.startQuizBtn, { backgroundColor: typeColor }]}
                  onPress={handleStartQuiz}
                  accessibilityLabel={t('lessonStartPractice')}
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                  <Text style={styles.startQuizBtnText}>{t('lessonStartPractice')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── 階段：quizzing ── */}
            {writePhase === 'quizzing' && (
              <Text style={styles.quizTip}>
                {quizRound === 1 ? t('lessonTipRound1') : t('lessonTipRound2')}
              </Text>
            )}

            {/* ── 階段：done → 星級結果 ── */}
            {writePhase === 'done' && (
              <Animated.View style={[styles.completeBox, { transform: [{ scale: starScale }] }]}>
                <View style={styles.starRow}>{starRow(earnedStars)}</View>
                <Text style={styles.completeText}>
                  {earnedStars === 3
                    ? t('lessonPerfect')
                    : earnedStars === 2
                    ? t('lessonGood')
                    : t('lessonOk')}
                </Text>
                <Text style={styles.starsEarned}>{t('lessonStarsEarned').replace('{n}', String(earnedStars))}</Text>

                <View style={styles.doneButtons}>
                  <TouchableOpacity
                    style={styles.replayQuizBtn}
                    onPress={handleReplay}
                    accessibilityLabel={t('lessonPracticeAgain')}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.primary} />
                    <Text style={styles.replayQuizBtnText}>{t('lessonPracticeAgain')}</Text>
                  </TouchableOpacity>

                  {nextWordId ? (
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={handleNextLesson}
                      accessibilityLabel={t('lessonNextBtn')}
                    >
                      <Text style={styles.nextBtnText}>{t('lessonNextBtn')}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={() => navigation.goBack()}
                      accessibilityLabel={t('lessonBackToMap')}
                    >
                      <Ionicons name="map" size={18} color="#fff" />
                      <Text style={styles.nextBtnText}>{t('lessonBackToMap')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 徽章解鎖彈窗 */}
      <BadgeUnlockModal
        badges={newBadges}
        visible={showBadgeModal}
        onClose={() => {
          const remaining = newBadges.slice(1);
          setNewBadges(remaining);
          setShowBadgeModal(remaining.length > 0);
        }}
      />

      {/* 升級彈窗 */}
      <LevelUpModal
        visible={showLevelUp}
        newRank={newRank}
        onClose={() => setShowLevelUp(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBEB' },

  // 頂部大字
  wordHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    gap: 8,
  },
  contentTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  contentTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  mainChar: { fontWeight: '800', color: '#1F2937', lineHeight: undefined },
  pronunciationRow: { flexDirection: 'row', gap: 10 },
  pronBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  pronBadgeMandarin: { backgroundColor: '#EDE9FE' },
  pronLabel: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  pronLabelMandarin: { color: '#7C3AED' },
  pronText: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  // 多字拼音展示
  multiPronContainer: { alignItems: 'center', gap: 8, width: '100%' },
  componentBadgeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  componentBadge: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  componentChar:     { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  componentJyutping: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },

  // 分頁
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#F59E0B' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { color: '#F59E0B', fontWeight: '700' },

  content: { padding: 20, paddingBottom: 48 },

  // 字義分頁
  meaningContainer: { gap: 14 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  infoCardRow: { flexDirection: 'row', gap: 12 },
  infoCardHalf: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 6, fontWeight: '600' },
  infoValue: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  infoValueEn: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  exampleSentence: { fontSize: 18, color: '#374151', lineHeight: 28 },

  // 成語組成漢字
  idiomNote: { backgroundColor: '#F5F3FF' },
  idiomCharsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  idiomCharItem: { alignItems: 'center', gap: 4 },
  idiomCharText: { fontSize: 24, fontWeight: '700', color: '#4C1D95' },
  idiomCharJp:   { fontSize: 12, color: '#7C3AED', fontWeight: '600' },

  nextTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  nextTabBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // 練寫分頁
  writeContainer: { alignItems: 'center', gap: 16 },

  // 多字進度指示器
  charProgressRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  charProgressItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  charProgressItemActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  charProgressItemDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  charProgressText:       { fontSize: 18, fontWeight: '600', color: '#9CA3AF' },
  charProgressTextActive: { color: '#92400E' },
  charProgressTextDone:   { color: '#065F46' },
  charProgressCheck:      { position: 'absolute', bottom: 2, right: 2 },

  writeHint: { fontSize: 16, color: '#374151', fontWeight: '500', textAlign: 'center' },
  phaseActions: { flexDirection: 'row', gap: 12, width: '100%' },
  replayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  replayBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  startQuizBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  startQuizBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  quizTip: { fontSize: 13, color: '#6B7280', textAlign: 'center', fontStyle: 'italic' },

  // 完成結果
  completeBox: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  starRow: { flexDirection: 'row', gap: 6 },
  completeText: { fontSize: 18, fontWeight: '700', color: '#065F46', textAlign: 'center' },
  starsEarned: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  doneButtons: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  replayQuizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 5,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  replayQuizBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
