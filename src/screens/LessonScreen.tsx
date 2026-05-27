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
  Modal,
  Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import PronButton from '../components/PronButton';
import HanziWriterView, { HanziWriterHandle } from '../components/HanziWriterView';
import HanziChar from '../components/HanziChar';
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
import { Colors, CHAR_FONT } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import { playSFX } from '../services/sfxService';

type Tab = 'meaning' | 'write';
type WritePhase = 'animating' | 'ready' | 'quizzing' | 'done';

function starsForMistakes(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

/** 根據字數決定主字體大小 */
function mainCharFontSize(charLength: number): number {
  if (charLength <= 1) return 130;
  if (charLength <= 2) return 72;
  return 52;
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
    playerXP, addXP, completeDailyTask,
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
    playSFX('complete');
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
    completeDailyTask('learn');   // 每日任務：學習新字
    completeDailyTask('practice'); // 每日任務：完成筆順練習

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

  // 字義分頁：級別顯示（使用 t() 以支援多語言）
  const levelEmoji: Record<string, string> = {
    seedling:  t('levelSeedling'),
    sapling:   t('levelSapling'),
    tree:      t('levelTree'),
    sunflower: t('levelSunflower'),
    rainbow:   t('levelRainbow'),
    galaxy:    t('levelGalaxy'),
    bamboo:    t('levelBamboo'),
    jade:      t('levelJade'),
    vocab:     t('levelVocab'),
    idiom:     t('levelIdiom'),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── 頂部：字 + 發音 + 類型徽章 ── */}
      <View style={styles.wordHeader}>
        {/* 內容類型徽章 */}
        <View style={[styles.contentTypeBadge, { backgroundColor: typeColor + '1A', borderColor: typeColor + '60' }]}>
          <AppText style={[styles.contentTypeBadgeText, { color: typeColor }]}>{typeLabel}</AppText>
        </View>

        {/* 主字顯示 — 用 HanziChar（與寫字練習完全相同筆畫數據） */}
        <View style={styles.mainCharRow}>
          {[...word.character].map((c, i) => (
            <HanziChar
              key={i}
              character={c}
              size={mainCharFontSize(word.character.length)}
              color="#1F2937"
            />
          ))}
        </View>

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
                  accessibilityLabel={t('lessonA11yCantonese').replace('{p}', jp)}
                >
                  <AppText style={styles.componentChar}>{(word.components ?? [])[i]}</AppText>
                  <AppText style={styles.componentJyutping}>{jp}</AppText>
                </TouchableOpacity>
              ))}
            </View>
            {/* 整體播放 */}
            <View style={styles.pronunciationRow}>
              <View style={styles.pronBadge}>
                <PronButton lang="cantonese" size="lg" onPress={() => playMultiChar('cantonese')} />
                <AppText style={styles.pronText}>{word.jyutping}</AppText>
              </View>
              <View style={[styles.pronBadge, styles.pronBadgeMandarin]}>
                <PronButton lang="mandarin" size="lg" onPress={() => playMultiChar('mandarin')} />
                <AppText style={styles.pronText}>{word.pinyin}</AppText>
              </View>
            </View>
          </View>
        ) : (
          /* 單字：發音徽章 */
          <View style={styles.pronunciationRow}>
            <View style={styles.pronBadge}>
              <PronButton lang="cantonese" size="lg" onPress={() => playWord(word.character, 'cantonese')} />
              <AppText style={styles.pronText}>{word.jyutping}</AppText>
            </View>
            <View style={[styles.pronBadge, styles.pronBadgeMandarin]}>
              <PronButton lang="mandarin" size="lg" onPress={() => playWord(word.character, 'mandarin')} />
              <AppText style={styles.pronText}>{word.pinyin}</AppText>
            </View>
          </View>
        )}
      </View>

      {/* ── 分頁切換 ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meaning' && styles.tabActive]}
          onPress={() => setActiveTab('meaning')}
          accessibilityLabel={t('lessonA11yMeaningTab')}
        >
          <AppText style={[styles.tabText, activeTab === 'meaning' && styles.tabTextActive]}>
            {contentType === 'character' ? t('lessonTab_meaning') : t('lessonTab_wordMeaning')}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'write' && styles.tabActive]}
          onPress={() => setActiveTab('write')}
          accessibilityLabel={t('lessonTab_writing')}
        >
          <AppText style={[styles.tabText, activeTab === 'write' && styles.tabTextActive]}>
            {t('lessonTab_writing')}
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} scrollEnabled={activeTab === 'meaning'}>
        {/* ═══════════════════════════════
            字義分頁
        ═══════════════════════════════ */}
        {activeTab === 'meaning' && (
          <View style={styles.meaningContainer}>
            <View style={styles.infoCard}>
              <AppText style={styles.infoLabel}>{t('lessonMeaning')}</AppText>
              <AppText style={styles.infoValue}>{word.meaning_zh}</AppText>
              <AppText style={styles.infoValueEn}>{word.meaning_en}</AppText>
            </View>

            <View style={styles.infoCard}>
              <AppText style={styles.infoLabel}>{t('lessonExample')}</AppText>
              <AppText style={styles.exampleSentence}>{word.example_sentence}</AppText>
            </View>

            <View style={styles.infoCardRow}>
              <View style={[styles.infoCard, styles.infoCardHalf]}>
                <AppText style={styles.infoLabel}>{t('lessonStrokes')}</AppText>
                <AppText style={styles.infoValue}>{t('lessonStrokeCount').replace('{n}', String(word.stroke_count))}</AppText>
              </View>
              <View style={[styles.infoCard, styles.infoCardHalf]}>
                <AppText style={styles.infoLabel}>{t('lessonLevel')}</AppText>
                <AppText style={[styles.infoValue, { color: typeColor }]}>{levelEmoji[word.level] ?? word.level}</AppText>
              </View>
            </View>

            {/* 成語額外說明 */}
            {contentType === 'idiom' && (
              <View style={[styles.infoCard, styles.idiomNote]}>
                <AppText style={styles.infoLabel}>{t('lessonIdiomComponents')}</AppText>
                <View style={styles.idiomCharsRow}>
                  {(word.components ?? []).map((c, i) => (
                    <View key={i} style={styles.idiomCharItem}>
                      <AppText style={styles.idiomCharText}>{c}</AppText>
                      <AppText style={styles.idiomCharJp}>{(word.componentJyutping ?? [])[i]}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextTabBtn, { backgroundColor: typeColor }]}
              onPress={() => setActiveTab('write')}
              accessibilityLabel={t('lessonA11yGoToWrite')}
            >
              <AppText style={styles.nextTabBtnText}>{t('lessonPractice')}</AppText>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════
            練寫分頁 — 完成結果（寫字過程在全屏 Modal）
        ═══════════════════════════════ */}
        {activeTab === 'write' && writePhase === 'done' && (
          <View style={styles.writeContainer}>
            <Animated.View style={[styles.completeBox, { transform: [{ scale: starScale }] }]}>
              <View style={styles.starRow}>{starRow(earnedStars)}</View>
              <AppText style={styles.completeText}>
                {earnedStars === 3
                  ? t('lessonPerfect')
                  : earnedStars === 2
                  ? t('lessonGood')
                  : t('lessonOk')}
              </AppText>
              <AppText style={styles.starsEarned}>{t('lessonStarsEarned').replace('{n}', String(earnedStars))}</AppText>

              <View style={styles.doneButtons}>
                <TouchableOpacity
                  style={styles.replayQuizBtn}
                  onPress={handleReplay}
                  accessibilityLabel={t('lessonPracticeAgain')}
                >
                  <Ionicons name="refresh" size={16} color={Colors.primary} />
                  <AppText style={styles.replayQuizBtnText}>{t('lessonPracticeAgain')}</AppText>
                </TouchableOpacity>

                {nextWordId ? (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNextLesson}
                    accessibilityLabel={t('lessonNextBtn')}
                  >
                    <AppText style={styles.nextBtnText}>{t('lessonNextBtn')}</AppText>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel={t('lessonBackToMap')}
                  >
                    <Ionicons name="map" size={18} color="#fff" />
                    <AppText style={styles.nextBtnText}>{t('lessonBackToMap')}</AppText>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* ══ 全屏寫字 Modal ══ */}
      <Modal
        visible={activeTab === 'write' && writePhase !== 'done'}
        animationType="fade"
        statusBarTranslucent
      >
        <SafeAreaView style={styles.writingModal}>
          {/* 返回鍵 */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setActiveTab('meaning')}
          >
            <Ionicons name="close" size={26} color={Colors.text} />
          </TouchableOpacity>

          {/* 多字進度指示器 */}
          {isMultiChar && (
            <View style={styles.modalProgressRow}>
              {writeComponents.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.charProgressItem,
                    i === charIndex && styles.charProgressItemActive,
                    i < charIndex  && styles.charProgressItemDone,
                  ]}
                >
                  <AppText style={[
                    styles.charProgressText,
                    i === charIndex && styles.charProgressTextActive,
                    i < charIndex  && styles.charProgressTextDone,
                  ]}>{c}</AppText>
                  {i < charIndex && (
                    <Ionicons name="checkmark" size={10} color={Colors.success} style={styles.charProgressCheck} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 提示文字 */}
          <AppText style={styles.modalHint}>
            {writePhase === 'animating' && (isMultiChar
              ? t('watchingChar').replace('{char}', currentWriteChar)
              : t('lessonWatchDemo'))}
            {writePhase === 'ready'    && t('lessonReady')}
            {writePhase === 'quizzing' && quizRound === 1 && t('lessonQuizRound1').replace('{char}', currentWriteChar)}
            {writePhase === 'quizzing' && quizRound === 2 && t('lessonQuizRound2').replace('{char}', currentWriteChar)}
          </AppText>

          {/* HanziWriter — 全屏大畫布 */}
          <HanziWriterView
            key={`${word.id}-char-${charIndex}`}
            ref={writerRef}
            character={currentWriteChar}
            width={SW}
            height={SW}
            showOutline={true}
            animateOnLoad={true}
            onAnimationComplete={handleAnimationComplete}
            onQuizComplete={handleQuizComplete}
          />

          {/* Ready：重播 + 開始練寫 */}
          {writePhase === 'ready' && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.replayBtn}
                onPress={() => writerRef.current?.replay()}
              >
                <Ionicons name="refresh" size={18} color={Colors.primary} />
                <AppText style={styles.replayBtnText}>{t('lessonReplayDemo')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.startQuizBtn, { backgroundColor: typeColor }]}
                onPress={handleStartQuiz}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
                <AppText style={styles.startQuizBtnText}>{t('lessonStartPractice')}</AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* Quizzing：提示 */}
          {writePhase === 'quizzing' && (
            <AppText style={styles.quizTip}>
              {quizRound === 1 ? t('lessonTipRound1') : t('lessonTipRound2')}
            </AppText>
          )}
        </SafeAreaView>
      </Modal>

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
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },

  // 頂部大字
  wordHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryBg,
    gap: 8,
  },
  contentTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  contentTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  mainChar: { fontFamily: CHAR_FONT, fontWeight: '400', color: '#1F2937', lineHeight: undefined },
  mainCharRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
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
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
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
  componentChar:     { fontSize: 22, fontFamily: CHAR_FONT, fontWeight: '400', color: '#1F2937' },
  componentJyutping: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },

  // 分頁
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryBg,
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
    backgroundColor: Colors.primaryBg,
    borderRadius: 14,
    padding: 16,
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
  idiomCharText: { fontSize: 24, fontFamily: CHAR_FONT, fontWeight: '400', color: '#4C1D95' },
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
    backgroundColor: Colors.primaryBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  charProgressItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
  },
  charProgressItemActive: {
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: '#F59E0B',
    borderLeftColor: '#F59E0B',
    borderBottomColor: '#F59E0B',
    borderRightColor: '#F59E0B',
  },
  charProgressItemDone: {
    backgroundColor: '#ECFDF5',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: '#6EE7B7',
    borderLeftColor: '#6EE7B7',
    borderBottomColor: '#6EE7B7',
    borderRightColor: '#6EE7B7',
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
    backgroundColor: Colors.primaryBg,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
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
    backgroundColor: Colors.primaryBg,
    borderRadius: 20,
    padding: 24,
    width: '100%',
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
  starRow: { flexDirection: 'row', gap: 6 },
  completeText: { fontSize: 18, fontWeight: '700', color: '#065F46', textAlign: 'center' },
  starsEarned: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  doneButtons: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  replayQuizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 5,
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

  // ── 全屏寫字 Modal ──
  writingModal: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  modalCloseBtn: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
    borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 1, borderRightWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  modalProgressRow: {
    flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4,
  },
  modalHint: {
    fontSize: 14, color: Colors.textMuted, fontWeight: '500',
    textAlign: 'center', marginVertical: 6,
  },
  modalActions: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20,
    width: '100%', marginTop: 12,
  },
});
