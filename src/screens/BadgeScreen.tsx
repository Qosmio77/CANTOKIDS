/**
 * BadgeScreen — 徽章展示
 *
 * 顯示所有 14 個徽章：
 * - 已解鎖：彩色 + 解鎖時間（佔位）
 * - 未解鎖：灰色 + 條件提示
 *
 * 從 HomeScreen 點擊「我的徽章」進入
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { BADGES, getUnlockedBadges, buildBadgeStats, getBadgeLocalized } from '../services/badgeService';
import { useTranslation } from '../hooks/useTranslation';
import {
  SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
  SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
} from '../data/allWords';

export default function BadgeScreen({ navigation }: any) {
  const { totalStars, wordProgress, perfectQuizzes, streakDays, language } = useProgressStore();
  const { t } = useTranslation();

  const stats = buildBadgeStats(
    wordProgress, totalStars, perfectQuizzes, streakDays,
    SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
    SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
  );
  const { learnedCount, totalWords } = stats;

  const unlockedIds = useMemo(
    () => new Set(getUnlockedBadges(stats).map((b) => b.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalStars, stats.learnedCount, perfectQuizzes, streakDays, wordProgress]
  );

  const unlockedCount = unlockedIds.size;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 頂部欄 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <AppText style={styles.topTitle}>{t('badgeTitle')}</AppText>
        <View style={styles.countBadge}>
          <AppText style={styles.countText}>{unlockedCount} / {BADGES.length}</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 進度橫條 */}
        <View style={styles.progressCard}>
          <AppText style={styles.progressLabel}>
            {t('badgeProgressLabel')
              .replace('{n}', String(unlockedCount))
              .replace('{remaining}', String(BADGES.length - unlockedCount))}
          </AppText>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(unlockedCount / BADGES.length) * 100}%` }]}
            />
          </View>
        </View>

        {/* 徽章格子 */}
        <View style={styles.grid}>
          {BADGES.map((badge) => {
            const unlocked = unlockedIds.has(badge.id);
            const { name, description } = getBadgeLocalized(badge, language);
            return (
              <View
                key={badge.id}
                style={[styles.badgeCard, unlocked ? styles.badgeUnlocked : styles.badgeLocked]}
                accessibilityLabel={`${name}：${unlocked ? t('badgeAcquired') : t('badgeLocked')}`}
              >
                {/* 徽章圖示 */}
                <AppText style={[styles.badgeEmoji, !unlocked && styles.badgeEmojiLocked]}>
                  {unlocked ? badge.emoji : '🔒'}
                </AppText>

                {/* 名稱 */}
                <AppText style={[styles.badgeName, !unlocked && styles.badgeNameLocked]}>
                  {name}
                </AppText>

                {/* 條件 / 說明 */}
                <AppText style={[styles.badgeDesc, !unlocked && styles.badgeDescLocked]} numberOfLines={2}>
                  {description}
                </AppText>

                {/* 解鎖狀態標籤 */}
                {unlocked && (
                  <View style={styles.unlockedTag}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                    <AppText style={styles.unlockedTagText}>{t('badgeAcquired')}</AppText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 當前進度提示 */}
        <View style={styles.statsCard}>
          <AppText style={styles.statsTitle}>{t('badgeStatsTitle')}</AppText>
          <View style={styles.statsRow}>
            <StatItem icon="star"   color={Colors.primary}   label={t('statStars')}   value={String(totalStars)} />
            <StatItem icon="book"   color={Colors.cantonese} label={t('statLearned')} value={`${learnedCount}/${totalWords}`} />
            <StatItem icon="trophy" color="#F59E0B"           label={t('statPerfect')} value={String(perfectQuizzes)} />
            <StatItem icon="flame"  color="#EF4444"           label={t('statStreak')}  value={String(streakDays)} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  icon, color, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={color} />
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  countBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  container: { padding: 20, paddingBottom: 48, gap: 20 },

  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressBar: {
    height: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  badgeUnlocked: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  badgeLocked: {
    backgroundColor: Colors.borderLight,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  badgeEmoji: { fontSize: 40 },
  badgeEmojiLocked: { opacity: 0.35 },
  badgeName: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textMuted },
  badgeDesc: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  badgeDescLocked: { color: Colors.textMuted },
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  unlockedTagText: { fontSize: 10, fontWeight: '700', color: Colors.white },

  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statsTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
});
