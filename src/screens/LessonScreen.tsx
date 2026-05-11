/**
 * LessonScreen — 單字課程頁面
 *
 * Phase 5 重寫：
 * - 支援全部 60 個漢字（透過 allWords.getWordById）
 * - 字義分頁：發音按鈕（粵 / 普）、意思、例句、筆畫數
 * - 練寫分頁：動畫示範 → 「開始練寫」→ 手寫測驗 → 動態星級結果
 * - unlockLesson 使用 lessonId（來自 route.params）
 * - 完成後提供「下一關」或「返回地圖」
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

type Tab = 'meaning' | 'write';

// 練寫流程狀態機
type WritePhase = 'animating' | 'ready' | 'quizzing' | 'done';

function starsForMistakes(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

export default function LessonScreen({ route, navigation }: any) {
  const { wordId, lessonId } = route.params as { wordId: number; lessonId: number };

  const [activeTab, setActiveTab] = useState<Tab>('meaning');
  const [writePhase, setWritePhase] = useState<WritePhase>('animating');
  const [earnedStars, setEarnedStars] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRank, setNewRank] = useState<PlayerRank | null>(null);

  // Star pop animation
  const starScale = useRef(new Animated.Value(0)).current;

  const writerRef = useRef<HanziWriterHandle>(null);
  const {
    markWordLearned, addStars, unlockLesson,
    playerXP, addXP,
  } = useProgressStore();
  const { playWord } = useAudio();

  const word = getWordById(wordId);
  if (!word) return null;

  // ── 動畫結束 → 顯示「開始練寫」按鈕
  const handleAnimationComplete = useCallback(() => {
    setWritePhase('ready');
  }, []);

  // ── 使用者按下「開始練寫」→ 進入 quiz 模式
  const handleStartQuiz = useCallback(() => {
    setWritePhase('quizzing');
    writerRef.current?.startQuiz();
  }, []);

  // ── 練寫完成 → 給分、解鎖、XP、體力、徽章偵測、動畫
  const handleQuizComplete = useCallback(
    (totalMistakes: number) => {
      if (writePhase === 'done') return; // 防止重複
      const stars = starsForMistakes(totalMistakes);

      // 抓取修改前的 stats（用於比對新解鎖徽章）
      const storeBefore = useProgressStore.getState();
      const statsBefore = buildBadgeStats(
        storeBefore.wordProgress, storeBefore.totalStars,
        storeBefore.perfectQuizzes, storeBefore.streakDays,
        SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
        SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
      );

      // 套用進度更新（Zustand 同步執行）
      markWordLearned(wordId);
      addStars(stars);
      unlockLesson(lessonId + 1);

      // 計算並獎勵 XP
      const xpGained = XP_PER_WORD_LEARNED + (totalMistakes === 0 ? XP_PER_QUIZ_CORRECT * 2 : XP_PER_QUIZ_CORRECT);
      const leveledUp = addXP(xpGained);
      if (leveledUp) {
        const currentXP = useProgressStore.getState().playerXP;
        const rank = getRankByXP(currentXP);
        setNewRank(rank);
        setShowLevelUp(true);
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

      setEarnedStars(stars);
      setWritePhase('done');

      // Star pop animation
      Animated.spring(starScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    },
    [writePhase, wordId, lessonId, markWordLearned, addStars, unlockLesson,
     addXP, starScale]
  );

  // ── 下一關（若有）
  const nextWordId = wordId < ALL_WORDS.length ? wordId + 1 : null;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── 頂部：大字 + 發音徽章 ── */}
      <View style={styles.wordHeader}>
        <Text style={styles.mainChar}>{word.character}</Text>

        <View style={styles.pronunciationRow}>
          {/* 粵語發音 */}
          <TouchableOpacity
            style={styles.pronBadge}
            onPress={() => playWord(word.character, 'cantonese')}
            accessibilityLabel={`粵語發音：${word.jyutping}`}
          >
            <Ionicons name="volume-high" size={14} color="#1D4ED8" />
            <Text style={styles.pronLabel}>粵</Text>
            <Text style={styles.pronText}>{word.jyutping}</Text>
          </TouchableOpacity>

          {/* 普通話發音 */}
          <TouchableOpacity
            style={[styles.pronBadge, styles.pronBadgeMandarin]}
            onPress={() => playWord(word.character, 'mandarin')}
            accessibilityLabel={`普通話發音：${word.pinyin}`}
          >
            <Ionicons name="volume-high" size={14} color="#7C3AED" />
            <Text style={[styles.pronLabel, styles.pronLabelMandarin]}>普</Text>
            <Text style={styles.pronText}>{word.pinyin}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 分頁切換 ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meaning' && styles.tabActive]}
          onPress={() => setActiveTab('meaning')}
          accessibilityLabel="字義分頁"
        >
          <Text style={[styles.tabText, activeTab === 'meaning' && styles.tabTextActive]}>
            📖 字義
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'write' && styles.tabActive]}
          onPress={() => setActiveTab('write')}
          accessibilityLabel="練寫分頁"
        >
          <Text style={[styles.tabText, activeTab === 'write' && styles.tabTextActive]}>
            ✍️ 練寫
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
              <Text style={styles.infoLabel}>意思</Text>
              <Text style={styles.infoValue}>{word.meaning_zh}</Text>
              <Text style={styles.infoValueEn}>{word.meaning_en}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>例句</Text>
              <Text style={styles.exampleSentence}>{word.example_sentence}</Text>
            </View>

            <View style={styles.infoCardRow}>
              <View style={[styles.infoCard, styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>筆畫數</Text>
                <Text style={styles.infoValue}>{word.stroke_count} 畫</Text>
              </View>
              <View style={[styles.infoCard, styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>級別</Text>
                <Text style={styles.infoValue}>
                  {{ seedling:'🌱幼苗', sapling:'🌳小樹', tree:'🏆大樹',
                     sunflower:'🌻向日葵', rainbow:'🌈彩虹', galaxy:'⭐星河' }[word.level]}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.nextTabBtn}
              onPress={() => setActiveTab('write')}
              accessibilityLabel="前往練寫分頁"
            >
              <Text style={styles.nextTabBtnText}>去練寫 ✍️</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════
            練寫分頁
        ═══════════════════════════════ */}
        {activeTab === 'write' && (
          <View style={styles.writeContainer}>
            {/* 狀態提示文字 */}
            <Text style={styles.writeHint}>
              {writePhase === 'animating' && '👀 觀看示範筆順…'}
              {writePhase === 'ready'     && '✋ 準備好了嗎？'}
              {writePhase === 'quizzing'  && `✍️ 按筆順寫「${word.character}」`}
              {writePhase === 'done'      && '🎉 完成！'}
            </Text>

            {/* HanziWriter 畫布 */}
            <HanziWriterView
              ref={writerRef}
              character={word.character}
              width={280}
              height={280}
              showOutline={true}
              animateOnLoad={true}
              onAnimationComplete={handleAnimationComplete}
              onQuizComplete={handleQuizComplete}
            />

            {/* ── 階段：ready → 顯示「開始練寫」 ── */}
            {writePhase === 'ready' && (
              <View style={styles.phaseActions}>
                <TouchableOpacity
                  style={styles.replayBtn}
                  onPress={() => writerRef.current?.replay()}
                  accessibilityLabel="重播示範動畫"
                >
                  <Ionicons name="refresh" size={18} color={Colors.primary} />
                  <Text style={styles.replayBtnText}>重播示範</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startQuizBtn}
                  onPress={handleStartQuiz}
                  accessibilityLabel="開始手寫練習"
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                  <Text style={styles.startQuizBtnText}>開始練寫</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── 階段：quizzing → 顯示重播提示 ── */}
            {writePhase === 'quizzing' && (
              <Text style={styles.quizTip}>
                按照筆順逐筆描寫，系統自動偵測
              </Text>
            )}

            {/* ── 階段：done → 星級結果 ── */}
            {writePhase === 'done' && (
              <Animated.View style={[styles.completeBox, { transform: [{ scale: starScale }] }]}>
                <View style={styles.starRow}>{starRow(earnedStars)}</View>
                <Text style={styles.completeText}>
                  {earnedStars === 3
                    ? '完美！零錯誤 🏆'
                    : earnedStars === 2
                    ? '做得好！繼續加油 👍'
                    : '完成！多練幾次會更棒 💪'}
                </Text>
                <Text style={styles.starsEarned}>+ {earnedStars} ⭐</Text>

                <View style={styles.doneButtons}>
                  <TouchableOpacity
                    style={styles.replayQuizBtn}
                    onPress={() => {
                      setWritePhase('animating');
                      setEarnedStars(0);
                      starScale.setValue(0);
                      writerRef.current?.replay();
                    }}
                    accessibilityLabel="再練一次"
                  >
                    <Ionicons name="refresh" size={16} color={Colors.primary} />
                    <Text style={styles.replayQuizBtnText}>再練</Text>
                  </TouchableOpacity>

                  {nextWordId ? (
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={handleNextLesson}
                      accessibilityLabel="前往下一課"
                    >
                      <Text style={styles.nextBtnText}>下一課</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={() => navigation.goBack()}
                      accessibilityLabel="返回地圖"
                    >
                      <Ionicons name="map" size={18} color="#fff" />
                      <Text style={styles.nextBtnText}>返回地圖</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 徽章解鎖慶祝彈窗 */}
      <BadgeUnlockModal
        badges={newBadges}
        visible={showBadgeModal}
        onClose={() => {
          // 若有多個徽章，依次顯示
          const remaining = newBadges.slice(1);
          setNewBadges(remaining);
          setShowBadgeModal(remaining.length > 0);
        }}
      />

      {/* 升級慶祝彈窗 */}
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
    paddingVertical: 20,
    backgroundColor: '#FEF3C7',
    gap: 10,
  },
  mainChar: { fontSize: 72, fontWeight: '800', color: '#1F2937', lineHeight: 80 },
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
  pronText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

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
  nextTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  nextTabBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // 練寫分頁
  writeContainer: { alignItems: 'center', gap: 16 },
  writeHint: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  phaseActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
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
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  startQuizBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  quizTip: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },

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
