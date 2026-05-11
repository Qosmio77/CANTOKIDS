import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore, getRankByXP } from '../store/useProgressStore';
import { useAudio } from '../hooks/useAudio';
import { Colors } from '../theme/colors';
import { getUnlockedBadges, buildBadgeStats, TOTAL_WORDS } from '../services/badgeService';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS,
  SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
  SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
  BAMBOO_IDS, JADE_IDS,
} from '../data/allWords';
import { TREASURES } from '../data/treasures';

/**
 * HomeScreen — 首頁
 * 顯示歡迎訊息、學習進度概覽與快速入口
 */
export default function HomeScreen({ navigation }: any) {
  const {
    displayName, totalStars, wordProgress, streakDays, perfectQuizzes,
    unlockedLessons, playerXP, treasures,
  } = useProgressStore();
  const rank = getRankByXP(playerXP);
  const { playWord } = useAudio();

  // 使用 buildBadgeStats helper，確保與 badgeService 邏輯一致
  const badgeStats = buildBadgeStats(
    wordProgress, totalStars, perfectQuizzes, streakDays,
    SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
    SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
    BAMBOO_IDS, JADE_IDS,
  );
  const { learnedCount, totalWords } = badgeStats;
  const progressPercent = Math.round((learnedCount / totalWords) * 100);
  const unlockedBadgeCount = getUnlockedBadges(badgeStats).length;
  const ownedTreasureCount = Object.values(treasures).filter((c) => c > 0).length;

  // 修復 F-2: 計算「繼續學習」的下一課（第一個已解鎖但未完成的課）
  const nextLessonWord = SEEDLING_WORDS.find((w, idx) => {
    const lessonId = idx + 1;
    const isUnlocked = unlockedLessons.includes(lessonId) || lessonId === 1;
    const isLearned = wordProgress[w.id]?.learned ?? false;
    return isUnlocked && !isLearned;
  });
  const continueLessonId = nextLessonWord
    ? SEEDLING_WORDS.indexOf(nextLessonWord) + 1
    : 1;
  const continueWordId = nextLessonWord?.id ?? 1;
  const hasStarted = learnedCount > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 頂部歡迎區 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好，{displayName}！ 👋</Text>
            {/* 玩家等級 */}
            <View style={styles.rankRow}>
              <Text style={styles.rankEmoji}>{rank.emoji}</Text>
              <Text style={styles.rankName}>Lv.{rank.level} {rank.name}</Text>
              <Text style={styles.xpText}>{playerXP} XP</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            {streakDays > 0 && (
              <View style={[styles.starBadge, styles.streakBadge]}>
                <Ionicons name="flame" size={16} color="#EF4444" />
                <Text style={[styles.starCount, { color: '#EF4444' }]}>{streakDays}</Text>
              </View>
            )}
            <View style={styles.starBadge}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.starCount}>{totalStars}</Text>
            </View>
            <TouchableOpacity
              style={[styles.starBadge, styles.parentBadge]}
              onPress={() => navigation.navigate('ParentLogin')}
              accessibilityLabel="家長控制台"
            >
              <Ionicons name="people" size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.starBadge, styles.parentBadge]}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="設定"
            >
              <Ionicons name="settings-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 學習進度卡片 */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.cardTitle}>📊 學習進度</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            已學 {learnedCount} / {TOTAL_WORDS} 個漢字 · 共 8 個級別
          </Text>
        </View>

        {/* 今日學習單字列表 */}
        <Text style={styles.sectionTitle}>📖 今日學習</Text>
        <View style={styles.wordGrid}>
          {/* 修復 F-3: lessonId 用 index+1，與 MapScreen 一致 */}
          {SEEDLING_WORDS.slice(0, 6).map((word, index) => {
            const lessonId = index + 1; // 正確的全域 lessonId
            const progress = wordProgress[word.id];
            const isLearned = progress?.learned ?? false;
            return (
              <TouchableOpacity
                key={word.id}
                style={[styles.wordCard, isLearned && styles.wordCardLearned]}
                onLongPress={() => playWord(word.character, 'cantonese')}
                onPress={() =>
                  navigation.navigate('Lesson', {
                    wordId: word.id,
                    lessonId,
                  })
                }
                accessibilityLabel={`${word.character}，${word.meaning_zh}，長按播放發音`}
              >
                <Text style={styles.wordChar}>{word.character}</Text>
                <Text style={styles.wordPinyin}>{word.jyutping}</Text>
                {isLearned && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.success}
                    style={styles.learnedIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 快速行動按鈕列 */}
        <View style={styles.ctaRow}>
          {/* 修復 F-2: 顯示「繼續學習」或「開始學習」，導航至正確課程 */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() =>
              navigation.navigate('Lesson', { wordId: continueWordId, lessonId: continueLessonId })
            }
            accessibilityLabel={hasStarted ? '繼續學習' : '開始學習'}
          >
            <Ionicons name="book" size={20} color={Colors.white} />
            <Text style={styles.ctaText}>{hasStarted ? '繼續學習' : '開始學習'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaQuiz]}
            onPress={() => navigation.navigate('QuizMenu')}
            accessibilityLabel="進入互動測驗"
          >
            <Ionicons name="game-controller" size={20} color={Colors.white} />
            <Text style={styles.ctaText}>互動測驗</Text>
          </TouchableOpacity>
        </View>

        {/* 徽章快捷入口 */}
        <TouchableOpacity
          style={styles.badgeEntry}
          onPress={() => navigation.navigate('Badges')}
          accessibilityLabel={`查看徽章，已解鎖 ${unlockedBadgeCount} 個`}
        >
          <Text style={styles.badgeEntryEmoji}>🏅</Text>
          <View style={styles.badgeEntryInfo}>
            <Text style={styles.badgeEntryTitle}>我的徽章</Text>
            <Text style={styles.badgeEntryDesc}>
              已收集 {unlockedBadgeCount} / 7 個
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* 寶物庫快捷入口 */}
        <TouchableOpacity
          style={[styles.badgeEntry, styles.treasureEntry]}
          onPress={() => navigation.navigate('Treasure')}
          accessibilityLabel={`查看寶物庫，已收集 ${ownedTreasureCount} 件`}
        >
          <Text style={styles.badgeEntryEmoji}>🎁</Text>
          <View style={styles.badgeEntryInfo}>
            <Text style={styles.badgeEntryTitle}>寶物庫</Text>
            <Text style={styles.badgeEntryDesc}>
              已收集 {ownedTreasureCount} / {TREASURES.length} 件
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBEB' },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  rankEmoji: { fontSize: 18 },
  rankName: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  xpText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakBadge: { backgroundColor: '#FEF2F2' },
  parentBadge: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 10 },
  starCount: { fontSize: 16, fontWeight: '700', color: '#D97706' },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  progressPercent: { fontSize: 18, fontWeight: '800', color: '#F59E0B' },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 5 },
  progressText: { fontSize: 13, color: '#6B7280' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  wordCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  wordCardLearned: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7', borderWidth: 1.5 },
  wordChar: { fontSize: 32, fontWeight: '700', color: '#1F2937' },
  wordPinyin: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  learnedIcon: { position: 'absolute', top: 6, right: 6 },
  ctaRow: { flexDirection: 'row', gap: 12 },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  ctaQuiz: { backgroundColor: Colors.quiz },
  ctaText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  badgeEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeEntryEmoji: { fontSize: 28 },
  badgeEntryInfo: { flex: 1 },
  badgeEntryTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  badgeEntryDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  treasureEntry: { marginTop: 12 },
});
