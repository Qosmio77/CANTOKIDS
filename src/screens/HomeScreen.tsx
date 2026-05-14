/**
 * HomeScreen — Honey Bear Joy 風格 (Phase 6 UI Refresh)
 *
 * 佈局（由上至下）：
 *   ① Header        — 頭像圓圈 + 問候語 + 連勝/星數/設定
 *   ② Daily Goal    — 暖黃卡片，顯示學習進度條
 *   ③ Categories    — 6 個主題分類卡（2 列），點按進入對應關卡
 *   ④ Daily Challen — 大橙色 CTA 按鈕（跳測驗）
 *   ⑤ Shortcuts     — 徽章 + My Pets 快捷入口
 *
 * 設計系統：Honey Bear Joy
 *   • 背景：暖奶油 #fbf9f1
 *   • 主色：琥珀黃 + 活力橙
 *   • 分類卡：天藍 / 薄荷 / 蜜黃 / 薰衣草 / 粉紅 / 蜜桃
 *   • 圓角：24px cards, pill buttons
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FloatingXP from '../components/FloatingXP';
import StreakBadge from '../components/StreakBadge';
import { useProgressStore, getRankByXP } from '../store/useProgressStore';
import { Colors } from '../theme/colors';
import { getUnlockedBadges, buildBadgeStats, TOTAL_WORDS } from '../services/badgeService';
import {
  SEEDLING_WORDS,  SAPLING_WORDS,  TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS,  GALAXY_WORDS,
  SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
  SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
  BAMBOO_IDS, JADE_IDS,
} from '../data/allWords';
import { TREASURES } from '../data/treasures';
import { useTranslation } from '../hooks/useTranslation';

// ── 主題分類定義 ────────────────────────────────────────────────────
interface CategoryDef {
  id: string;
  emoji: string;
  nameKey: string;
  words: typeof SEEDLING_WORDS;
  ids: number[];
  bgColor: string;
  borderColor: string;
  requiresPremium: boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'animals',   emoji: '🐶', nameKey: 'catAnimals',
    words: SAPLING_WORDS,  ids: SAPLING_IDS,
    bgColor: Colors.catAnimalsBg, borderColor: Colors.catAnimalsBorder,
    requiresPremium: true,
  },
  {
    id: 'nature',    emoji: '🌿', nameKey: 'catNature',
    words: SEEDLING_WORDS, ids: SEEDLING_IDS,
    bgColor: Colors.catNatureBg,  borderColor: Colors.catNatureBorder,
    requiresPremium: false,
  },
  {
    id: 'numbers',   emoji: '🔢', nameKey: 'catNumbers',
    words: SUNFLOWER_WORDS, ids: SUNFLOWER_IDS,
    bgColor: Colors.catNumbersBg, borderColor: Colors.catNumbersBorder,
    requiresPremium: true,
  },
  {
    id: 'colors',    emoji: '🎨', nameKey: 'catColors',
    words: RAINBOW_WORDS,  ids: RAINBOW_IDS,
    bgColor: Colors.catColorsBg,  borderColor: Colors.catColorsBorder,
    requiresPremium: true,
  },
  {
    id: 'family',    emoji: '👨‍👩‍👧', nameKey: 'catFamily',
    words: GALAXY_WORDS,   ids: GALAXY_IDS,
    bgColor: Colors.catFamilyBg,  borderColor: Colors.catFamilyBorder,
    requiresPremium: true,
  },
  {
    id: 'daily',     emoji: '📚', nameKey: 'catDaily',
    words: TREE_WORDS,     ids: TREE_IDS,
    bgColor: Colors.catDailyBg,   borderColor: Colors.catDailyBorder,
    requiresPremium: true,
  },
];

// ── Component ────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const {
    displayName, totalStars, wordProgress, streakDays, perfectQuizzes,
    unlockedLessons, playerXP, treasures, isPremium,
  } = useProgressStore();
  const rank = getRankByXP(playerXP);
  const { t } = useTranslation();

  // Badge stats
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

  // 浮動 +XP 動畫
  const prevXPRef = useRef(playerXP);
  const [showXP, setShowXP] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (playerXP > prevXPRef.current) {
        setXpGained(playerXP - prevXPRef.current);
        setShowXP(true);
        prevXPRef.current = playerXP;
      } else {
        prevXPRef.current = playerXP;
      }
    }, [playerXP]),
  );

  // 頭像首字母
  const initials = (displayName ?? '?').charAt(0).toUpperCase();

  // 分類卡點按
  const handleCategoryPress = (cat: CategoryDef) => {
    if (cat.requiresPremium && !isPremium) {
      navigation.navigate('ParentLogin');
      return;
    }
    const firstWord = cat.words[0];
    if (!firstWord) return;
    navigation.navigate('Lesson', { wordId: firstWord.id, lessonId: 1 });
  };

  // 每個分類已學字數
  const getLearnedCount = (ids: number[]) =>
    ids.filter((id) => wordProgress[id]?.learned).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ① Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* 頭像圓圈 */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* 問候 + 等級 */}
          <View style={styles.headerCenter}>
            <Text style={styles.greeting} numberOfLines={1}>
              {t('greeting', { name: displayName })}
            </Text>
            <Text style={styles.rankLine} numberOfLines={1}>
              {rank.emoji} Lv.{rank.level} · {playerXP} XP
            </Text>
          </View>

          {/* 右側 badge row */}
          <View style={styles.badgeRow}>
            <StreakBadge streakDays={streakDays} />
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="設定"
            >
              <Ionicons name="settings-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ② Daily Goal Card ──────────────────────────────────── */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.goalLabel}>{t('dailyGoalTitle')}</Text>
              <Text style={styles.goalProgress}>
                {t('dailyGoalProgress', { n: learnedCount, total: TOTAL_WORDS })}
              </Text>
            </View>
            <Text style={styles.goalPercent}>{progressPercent}%</Text>
          </View>

          {/* 進度條 */}
          <View style={styles.goalBarTrack}>
            <View style={[styles.goalBarFill, { width: `${Math.max(progressPercent, 2)}%` as any }]} />
          </View>

          <Text style={styles.goalSubtext}>{t('dailyGoalSubtext')}</Text>

          {/* 浮動 +XP */}
          <FloatingXP amount={xpGained} visible={showXP} onDone={() => setShowXP(false)} />
        </View>

        {/* ③ Categories ───────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('categoriesTitle')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Map')}>
            <Text style={styles.seeAll}>{t('seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const locked = cat.requiresPremium && !isPremium;
            const learned = getLearnedCount(cat.ids);
            const total = cat.ids.length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: cat.bgColor, borderColor: cat.borderColor },
                  locked && styles.categoryCardLocked,
                ]}
                onPress={() => handleCategoryPress(cat)}
                activeOpacity={0.8}
                accessibilityLabel={`${t(cat.nameKey as any)}, ${learned}/${total} lessons`}
              >
                {/* 鎖定遮罩 */}
                {locked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>
                )}
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catName}>{t(cat.nameKey as any)}</Text>
                <Text style={styles.catProgress}>
                  {t('lessonsProgress', { n: learned, total })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ④ Daily Challenge CTA ─────────────────────────────── */}
        <TouchableOpacity
          style={styles.challengeBtn}
          onPress={() => navigation.navigate('QuizMenu')}
          activeOpacity={0.85}
          accessibilityLabel={t('dailyChallenge')}
        >
          <Ionicons name="game-controller" size={22} color={Colors.white} />
          <Text style={styles.challengeText}>{t('dailyChallenge')}</Text>
          <View style={styles.challengeArrow}>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* ⑤ Shortcuts ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Badges')}
        >
          <Text style={styles.shortcutEmoji}>🏅</Text>
          <View style={styles.shortcutInfo}>
            <Text style={styles.shortcutTitle}>{t('myBadges')}</Text>
            <Text style={styles.shortcutDesc}>
              {t('badgesCollected', { n: unlockedBadgeCount, total: 7 })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcut, { marginTop: 10 }]}
          onPress={() => navigation.navigate('Treasure')}
        >
          <Text style={styles.shortcutEmoji}>🥚</Text>
          <View style={styles.shortcutInfo}>
            <Text style={styles.shortcutTitle}>{t('treasureVault')}</Text>
            <Text style={styles.shortcutDesc}>
              {t('treasuresCollected', { n: ownedTreasureCount, total: TREASURES.length })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  container: { padding: 20, paddingBottom: 48, gap: 0 },

  // ① Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  headerCenter: { flex: 1, minWidth: 0 },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  rankLine: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ② Daily Goal Card
  goalCard: {
    backgroundColor: Colors.goalCard,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: Colors.goalCardBorder,
    shadowColor: Colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goalProgress: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  goalPercent: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  goalBarTrack: {
    height: 12,
    backgroundColor: Colors.goalBarTrack,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: Colors.goalBar,
    borderRadius: 6,
  },
  goalSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDeep,
    opacity: 0.75,
  },

  // ③ Categories
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    borderRadius: 24,
    borderWidth: 2,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  categoryCardLocked: {
    opacity: 0.65,
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
  lockIcon: { fontSize: 14 },
  catEmoji: { fontSize: 36, lineHeight: 44 },
  catName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  catProgress: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },

  // ④ Daily Challenge Button
  challengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 28,
    marginBottom: 24,
    gap: 10,
    // 3D lip effect (Honey Bear style)
    borderBottomWidth: 4,
    borderBottomColor: Colors.secondaryDark,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  challengeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  challengeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ⑤ Shortcuts
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: Colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  shortcutEmoji: { fontSize: 28 },
  shortcutInfo: { flex: 1 },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  shortcutDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
