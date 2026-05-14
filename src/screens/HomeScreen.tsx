/**
 * HomeScreen — 首頁
 *
 * 架構概覽（Phase 1–5）：
 *   ┌─ Header ──────────────────────────────────────────────────────┐
 *   │  greeting + rank row  |  StreakBadge · ⭐ · 👤 · ⚙️         │
 *   └───────────────────────────────────────────────────────────────┘
 *   ┌─ EnergyCard (Phase 3) ────────────────────────────────────────┐
 *   │  ⚡ Star Power  [47%]  ▓▓▓▓▓▓▓░░░●  Charged 5/100 · 🚀…    │
 *   │  FloatingXP overlay（從課程返回時顯示 +N XP 動畫）           │
 *   └───────────────────────────────────────────────────────────────┘
 *   ┌─ Today's Learning Grid (Phase 2) ─────────────────────────────┐
 *   │  6 × WordCard（🔊喇叭 · 大字 · 漣漪 · 震動）                │
 *   └───────────────────────────────────────────────────────────────┘
 *   [Continue]  [Quiz]
 *   [🎙️ Practice Speaking ── Soon ──]   ← Phase 4 placeholder
 *   ─ Badges entry ─
 *   ─ My Pets entry ─
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WordCard from '../components/WordCard';
import FloatingXP from '../components/FloatingXP';
import StreakBadge from '../components/StreakBadge';
import { useProgressStore, getRankByXP, getRankName } from '../store/useProgressStore';
import { useAudio } from '../hooks/useAudio';
import { Colors } from '../theme/colors';
import { getUnlockedBadges, buildBadgeStats, TOTAL_WORDS } from '../services/badgeService';
import {
  // SEEDLING_WORDS is the only word list used on HomeScreen (first 6 preview cards)
  // SAPLING_WORDS … GALAXY_WORDS are intentionally omitted — not rendered here
  SEEDLING_WORDS,
  SEEDLING_IDS, SAPLING_IDS, TREE_IDS,
  SUNFLOWER_IDS, RAINBOW_IDS, GALAXY_IDS,
  BAMBOO_IDS, JADE_IDS,
} from '../data/allWords';
import { TREASURES } from '../data/treasures';
import { useTranslation } from '../hooks/useTranslation';

export default function HomeScreen({ navigation }: any) {
  const {
    displayName, totalStars, wordProgress, streakDays, perfectQuizzes,
    unlockedLessons, playerXP, treasures,
  } = useProgressStore();
  const rank = getRankByXP(playerXP);
  const { playWord } = useAudio();
  const { t, language } = useTranslation();

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

  // Phase 3 — 浮動 +XP 動畫：從課程回來時偵測 XP 增量
  const prevXPRef      = useRef(playerXP);
  const [showXP, setShowXP]   = useState(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 頂部歡迎區 */}
        <View style={styles.header}>
          {/* flex:1 + minWidth:0 讓左欄收縮，不擠壓右側 badge row */}
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} numberOfLines={1}>{t('greeting', { name: displayName })}</Text>
            {/* 玩家等級 */}
            <View style={styles.rankRow}>
              <Text style={styles.rankEmoji}>{rank.emoji}</Text>
              <Text style={styles.rankName} numberOfLines={1}>
                Lv.{rank.level} {getRankName(rank, language)}
              </Text>
              <Text style={styles.xpText}>{playerXP} XP</Text>
            </View>
          </View>
          {/* flexShrink:0 防止 badge row 被擠壓 */}
          <View style={[styles.badgeRow, { flexShrink: 0 }]}>
            {/* Phase 5 — 連勝火焰脈動（獨立元件，動畫不污染此 scope）*/}
            <StreakBadge streakDays={streakDays} />
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

        {/* ⚡ Phase 3 — Star Power / Energy System 卡片 */}
        <View style={styles.energyCard}>
          {/* 頭部：標題 + 百分比 */}
          <View style={styles.energyHeader}>
            <Text style={styles.energyTitle}>{t('energyTitle')}</Text>
            <View style={styles.energyPercentBadge}>
              <Text style={styles.energyPercentText}>{progressPercent}%</Text>
            </View>
          </View>

          {/* 能量條區塊 */}
          <View style={styles.energyBarWrapper}>
            {/* 軌道：overflow:hidden 確保填充色切齊圓角 */}
            <View style={styles.energyBarTrack}>
              <View style={[styles.energyBarFill, { width: `${Math.max(progressPercent, 2)}%` as any }]} />
              {/* 能量格線 (5 條分隔) */}
              {[20, 40, 60, 80].map((pct) => (
                <View key={pct} style={[styles.energyDivider, { left: `${pct}%` as any }]} />
              ))}
            </View>
            {/* 發光端點：在 wrapper 絕對定位，不受 track 的 overflow:hidden 影響 */}
            {progressPercent > 0 && (
              <View
                style={[
                  styles.energyGlowDot,
                  { left: `${Math.min(progressPercent, 96)}%` as any },
                ]}
              />
            )}
          </View>

          {/* 充能數量 + 副標 */}
          <View style={styles.energyFooter}>
            <Text style={styles.energyCharged}>
              {t('energyCharged', { learned: learnedCount, total: TOTAL_WORDS })}
            </Text>
            <Text style={styles.energySubtext}>{t('energySubtext')}</Text>
          </View>

          {/* 浮動 +XP 動畫（覆蓋在卡片上） */}
          <FloatingXP
            amount={xpGained}
            visible={showXP}
            onDone={() => setShowXP(false)}
          />
        </View>

        {/* 今日學習 — 會呼吸的字卡 (Phase 2) */}
        <Text style={styles.sectionTitle}>{t('todayLearning')}</Text>
        <View style={styles.wordGrid}>
          {SEEDLING_WORDS.slice(0, 6).map((word, index) => {
            const lessonId  = index + 1;
            const isLearned = wordProgress[word.id]?.learned ?? false;
            return (
              // 每張卡片外包一層固定寬度的 View，
              // WordCard 內部 flex:1 撐滿，確保 3 欄對齊
              <View key={word.id} style={styles.wordCardWrapper}>
                <WordCard
                  word={word}
                  isLearned={isLearned}
                  onPress={() =>
                    navigation.navigate('Lesson', { wordId: word.id, lessonId })
                  }
                  onLongPress={() => playWord(word.character, 'cantonese')}
                  onAudioPress={() => playWord(word.character, 'cantonese')}
                />
              </View>
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
            accessibilityLabel={hasStarted ? t('continueLearning') : t('startLearning')}
          >
            <Ionicons name="book" size={20} color={Colors.white} />
            <Text style={styles.ctaText}>{hasStarted ? t('continueLearning') : t('startLearning')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaQuiz]}
            onPress={() => navigation.navigate('QuizMenu')}
            accessibilityLabel={t('interactiveQuiz')}
          >
            <Ionicons name="game-controller" size={20} color={Colors.white} />
            <Text style={styles.ctaText}>{t('interactiveQuiz')}</Text>
          </TouchableOpacity>
        </View>

        {/* Phase 4 — 🎙️ 練習說話按鈕（發音預留） */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={() =>
            Alert.alert('🎙️', t('micComingSoon'), [{ text: 'OK', style: 'default' }])
          }
          accessibilityLabel={t('practiceSpeaking')}
        >
          <Ionicons name="mic" size={20} color={Colors.primary} />
          <Text style={styles.micText}>{t('practiceSpeaking')}</Text>
          {/* "Coming Soon" 標籤 */}
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>

        {/* 徽章快捷入口 */}
        <TouchableOpacity
          style={styles.badgeEntry}
          onPress={() => navigation.navigate('Badges')}
          accessibilityLabel={`查看徽章，已解鎖 ${unlockedBadgeCount} 個`}
        >
          <Text style={styles.badgeEntryEmoji}>🏅</Text>
          <View style={styles.badgeEntryInfo}>
            <Text style={styles.badgeEntryTitle}>{t('myBadges')}</Text>
            <Text style={styles.badgeEntryDesc}>
              {t('badgesCollected', { n: unlockedBadgeCount, total: 7 })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* 🥚 Phase 3 — My Pets 快捷入口 */}
        <TouchableOpacity
          style={[styles.badgeEntry, styles.treasureEntry]}
          onPress={() => navigation.navigate('Treasure')}
          accessibilityLabel={`${t('treasureVault')}，已孵化 ${ownedTreasureCount} 隻`}
        >
          {/* 發光蛋圖示 */}
          <View style={styles.petEggWrapper}>
            <Text style={styles.badgeEntryEmoji}>🥚</Text>
          </View>
          <View style={styles.badgeEntryInfo}>
            <Text style={styles.badgeEntryTitle}>{t('treasureVault')}</Text>
            <Text style={styles.badgeEntryDesc}>
              {t('treasuresCollected', { n: ownedTreasureCount, total: TREASURES.length })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── 全域佈局 ──────────────────────────────────────────────────────
  // 背景：暖奶油（兒童友好，護眼）
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  container: { padding: 20, paddingBottom: 40 },

  // ── 頂部 Header ───────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  // flex:1 + minWidth:0 讓左欄可以收縮，避免擠壓右側 badge row
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  rankEmoji: { fontSize: 18 },
  rankName: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  xpText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  // flexShrink:0 讓 badge row 不被左欄文字擠壓
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // 星數徽章（柔和黃背景，暖橙數字）
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,   // Phase 5: 柔和黃，取代硬碼 #FEF3C7
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  // StreakBadge 已抽為獨立元件，streakBadge 樣式可移除；保留 parentBadge
  parentBadge: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 10 },
  // 深琥珀數字（星數）
  starCount: { fontSize: 16, fontWeight: '700', color: Colors.primaryDeep },
  // ── Phase 3: Energy System Card ─────────────────────────────────
  energyCard: {
    backgroundColor: '#0F172A',   // 深空背景
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    // overflow: 'hidden' 不設定，讓 FloatingXP & 發光點可超出邊界
    // 紫光邊框
    borderWidth: 1,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  energyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  energyPercentBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  energyPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
  },
  // 能量條外層 wrapper（絕對定位發光點不受 track 的 overflow:hidden 影響）
  energyBarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  // 能量條軌道（overflow:hidden 夾住填充色到圓角邊界）
  energyBarTrack: {
    height: 14,
    backgroundColor: '#1E293B',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  // 充能填充（琥珀色）
  energyBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 7,
  },
  // 發光前沿圓點（定位在 wrapper，不在 track 內，故不被夾住）
  energyGlowDot: {
    position: 'absolute',
    top: -3,           // 讓點稍微突出軌道頂部
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    marginLeft: -10,   // 水平置中對齊端點
  },
  // 能量格線（分隔符）
  energyDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#0F172A',
    opacity: 0.5,
  },
  energyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  energyCharged: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  energySubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    opacity: 0.9,
  },
  // ── Pet Egg wrapper ──────────────────────────────────────────────
  petEggWrapper: {
    shadowColor: '#A78BFA',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  // ── 區塊標題 ─────────────────────────────────────────────────────
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  // 寬度固定在 wrapper；WordCard 內部 flex:1 撐滿
  wordCardWrapper: {
    width: '30%',
  },
  ctaRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
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

  // ── Phase 4: 麥克風按鈕 ─────────────────────────────────────────
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryMuted,
    gap: 8,
  },
  micText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  comingSoonBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── 快捷入口卡片（徽章 / My Pets）─────────────────────────────────
  // 白底 + 極輕陰影，比深色卡更柔和，符合 Phase 5 soft pastel 方向
  badgeEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: Colors.text,
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
