/**
 * WebDashboardScreen — 網頁版學習儀表板
 *
 * QR 登入後顯示：
 * - 玩家卡（名稱、等級、XP、體力）
 * - 學習進度概覽（60 字）
 * - 詳細字詞格狀圖（按 Level 分組）
 * - 統計（連續天數、答對率、徽章、Boss）
 * - 登出按鈕
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import AppText from '../../components/AppText';
import { Colors } from '../../theme/colors';
import { getRankByXP, getNextRank, getRankName, getBossName, PLAYER_RANKS, BOSSES, useProgressStore } from '../../store/useProgressStore';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS,
} from '../../data/allWords';
import { QRUserData } from '../../services/qrAuthService';
import { Word } from '../../types/word';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  userData: QRUserData;
  onLogout: () => void;
}

// ── 字詞格子 ────────────────────────────────────────────────────────
function WordChip({
  word,
  learned,
  correct,
  wrong,
  learnedLabel,
  unlearnedLabel,
  a11yTemplate,
}: {
  word: Word;
  learned: boolean;
  correct: number;
  wrong: number;
  learnedLabel: string;
  unlearnedLabel: string;
  a11yTemplate: string;
}) {
  const [showTip, setShowTip] = useState(false);
  const statusLabel = learned ? learnedLabel : unlearnedLabel;

  return (
    <TouchableOpacity
      style={[styles.wordChip, learned && styles.wordChipLearned]}
      onPress={() => setShowTip((v) => !v)}
      accessibilityLabel={a11yTemplate.replace('{char}', word.character).replace('{status}', statusLabel)}
    >
      <AppText style={[styles.wordChipChar, learned && styles.wordChipCharLearned]}>
        {word.character}
      </AppText>
      {learned && <AppText style={styles.wordChipCheck}>✓</AppText>}
      {showTip && (
        <View style={styles.tooltip}>
          <AppText style={styles.tooltipTitle}>{word.character}</AppText>
          <AppText style={styles.tooltipSub}>{word.jyutping}  {word.meaning_zh}</AppText>
          <AppText style={styles.tooltipStats}>✅ {correct}  ❌ {wrong}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── 主組件 ─────────────────────────────────────────────────────────
export default function WebDashboardScreen({ userData, onLogout }: Props) {
  const { t } = useTranslation();
  const language = useProgressStore((s) => s.language);

  // ── Level 定義（標籤從 i18n 取得） ───────────────────────────────
  const LEVEL_META = [
    { key: 'seedling',  label: t('levelSeedling'),  words: SEEDLING_WORDS,  color: '#10B981', bg: '#ECFDF5' },
    { key: 'sapling',   label: t('levelSapling'),   words: SAPLING_WORDS,   color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'tree',      label: t('levelTree'),      words: TREE_WORDS,      color: '#EF4444', bg: '#FEF2F2' },
    { key: 'sunflower', label: t('levelSunflower'), words: SUNFLOWER_WORDS, color: '#F97316', bg: '#FFF7ED' },
    { key: 'rainbow',   label: t('levelRainbow'),   words: RAINBOW_WORDS,   color: '#8B5CF6', bg: '#F5F3FF' },
    { key: 'galaxy',    label: t('levelGalaxy'),    words: GALAXY_WORDS,    color: '#3B82F6', bg: '#EFF6FF' },
  ];

  const rank     = getRankByXP(userData.playerXP);
  const nextRank = getNextRank(rank.level);
  const xpToNext = nextRank ? nextRank.xpRequired - userData.playerXP : 0;
  const xpProgress = nextRank
    ? ((userData.playerXP - rank.xpRequired) / (nextRank.xpRequired - rank.xpRequired)) * 100
    : 100;

  const totalWords   = SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length +
                       SUNFLOWER_WORDS.length + RAINBOW_WORDS.length + GALAXY_WORDS.length;
  const learnedCount = Object.values(userData.wordProgress).filter((p) => p.learned).length;
  const correctRate  = userData.totalAnswers > 0
    ? Math.round((userData.totalCorrect / userData.totalAnswers) * 100)
    : 0;

  const syncTime = new Date(userData.syncedAt).toLocaleTimeString('zh-HK', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
    >
      {/* ── 頂部欄 ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <AppText style={styles.appName}>🐤 CantoKids</AppText>
        <View style={styles.topRight}>
          <AppText style={styles.syncLabel}>{t('webSyncLabel').replace('{time}', syncTime)}</AppText>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <AppText style={styles.logoutBtnText}>{t('webLogout')}</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 玩家卡 ─────────────────────────────────────────────── */}
      <View style={styles.playerCard}>
        <View style={styles.playerLeft}>
          <AppText style={styles.playerEmoji}>{rank.emoji}</AppText>
          <View>
            <AppText style={styles.playerName}>{userData.displayName}</AppText>
            <AppText style={styles.playerRank}>Lv.{rank.level} {getRankName(rank, language)}</AppText>
          </View>
        </View>
        <View style={styles.playerRight}>
          <AppText style={styles.playerXP}>{userData.playerXP} XP</AppText>
          {nextRank && (
            <AppText style={styles.playerXPSub}>
              {t('webXPToNext').replace('{name}', getRankName(nextRank, language)).replace('{xp}', String(xpToNext))}
            </AppText>
          )}
          {/* XP 進度條 */}
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress, 100)}%` as any }]} />
          </View>
        </View>
      </View>

      {/* ── 體力 + 連續天數 ─────────────────────────────────────── */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, { flex: 1 }]}>
          <AppText style={styles.statEmoji}>❤️</AppText>
          <AppText style={styles.statValue}>{userData.totalStars}</AppText>
          <AppText style={styles.statLabel}>{t('webStatStars')}</AppText>
        </View>
        <View style={[styles.statCard, { flex: 1 }]}>
          <AppText style={styles.statEmoji}>🔥</AppText>
          <AppText style={styles.statValue}>{userData.streakDays}</AppText>
          <AppText style={styles.statLabel}>{t('webStatStreak')}</AppText>
        </View>
        <View style={[styles.statCard, { flex: 1 }]}>
          <AppText style={styles.statEmoji}>⭐</AppText>
          <AppText style={styles.statValue}>{userData.totalStars}</AppText>
          <AppText style={styles.statLabel}>{t('webStatStars')}</AppText>
        </View>
        <View style={[styles.statCard, { flex: 1 }]}>
          <AppText style={styles.statEmoji}>🎯</AppText>
          <AppText style={styles.statValue}>{correctRate}%</AppText>
          <AppText style={styles.statLabel}>{t('webStatAccuracy')}</AppText>
        </View>
      </View>

      {/* ── 學習進度條 ──────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>{t('webProgressTitle')}</AppText>
          <AppText style={styles.sectionBadge}>{learnedCount} / {totalWords}</AppText>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            { width: `${Math.round((learnedCount / totalWords) * 100)}%` as any },
          ]} />
        </View>
        <AppText style={styles.progressPct}>
          {t('webProgressPct').replace('{pct}', String(Math.round((learnedCount / totalWords) * 100)))}
        </AppText>
      </View>

      {/* ── Boss 狀態 ────────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <AppText style={styles.sectionTitle}>{t('webBossTitle')}</AppText>
        <View style={styles.bossGrid}>
          {BOSSES.map((boss) => {
            const defeated = userData.bossesDefeated.includes(boss.id);
            return (
              <View
                key={boss.id}
                style={[
                  styles.bossChip,
                  { backgroundColor: boss.bgColor, borderColor: boss.color + '60' },
                  defeated && { borderColor: boss.color },
                ]}
              >
                <AppText style={styles.bossChipEmoji}>{boss.emoji}</AppText>
                <AppText style={[styles.bossChipName, { color: boss.color }]}>
                  {getBossName(boss, language)}
                </AppText>
                <AppText style={styles.bossChipStatus}>
                  {defeated ? t('webBossDefeated') : t('webBossUnbeaten')}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── 按 Level 顯示字詞格子 ────────────────────────────────── */}
      {LEVEL_META.map(({ key, label, words, color, bg }) => {
        const levelLearned = words.filter((w) => userData.wordProgress[w.id]?.learned).length;
        return (
          <View key={key} style={[styles.sectionCard, { borderLeftWidth: 4, borderLeftColor: color }]}>
            <View style={styles.sectionHeader}>
              <AppText style={[styles.sectionTitle, { color }]}>{label}</AppText>
              <AppText style={[styles.sectionBadge, { backgroundColor: bg, color }]}>
                {levelLearned} / {words.length}
              </AppText>
            </View>
            <View style={styles.wordGrid}>
              {words.map((w) => {
                const p = userData.wordProgress[w.id];
                return (
                  <WordChip
                    key={w.id}
                    word={w}
                    learned={p?.learned ?? false}
                    correct={p?.correctCount ?? 0}
                    wrong={p?.wrongCount ?? 0}
                    learnedLabel={t('webWordLearned')}
                    unlearnedLabel={t('webWordUnlearned')}
                    a11yTemplate={t('webWordA11y')}
                  />
                );
              })}
            </View>
          </View>
        );
      })}

      {/* ── 底部 ─────────────────────────────────────────────────── */}
      <AppText style={styles.footer}>
        {t('webFooter')}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  container: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },

  // 頂部欄
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  appName: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncLabel: { fontSize: 12, color: Colors.textMuted },
  logoutBtn: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },

  // 玩家卡
  playerCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerEmoji: { fontSize: 52 },
  playerName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  playerRank: { fontSize: 14, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  playerRight: { flex: 1, gap: 4 },
  playerXP: { fontSize: 20, fontWeight: '800', color: Colors.primary, textAlign: 'right' },
  playerXPSub: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  xpBarBg: { height: 6, backgroundColor: Colors.primaryLight, borderRadius: 3, marginTop: 4 },
  xpBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },

  // 統計卡
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  // 通用卡片
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionBadge: {
    backgroundColor: Colors.primaryMuted,
    color: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 13,
    fontWeight: '700',
  },

  // 進度條
  progressBarBg: { height: 10, backgroundColor: Colors.borderLight, borderRadius: 5 },
  progressBarFill: { height: 10, backgroundColor: Colors.primary, borderRadius: 5 },
  progressPct: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  // Boss 格子
  bossGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bossChip: {
    width: '30%',
    minWidth: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
  },
  bossChipEmoji: { fontSize: 28 },
  bossChipName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  bossChipStatus: { fontSize: 11, color: Colors.textMuted },

  // 字詞格子
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: {
    width: 56,
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  wordChipLearned: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  wordChipChar: { fontSize: 24, fontWeight: '700', color: Colors.textMuted },
  wordChipCharLearned: { color: Colors.text },
  wordChipCheck: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 11,
    color: Colors.success,
    fontWeight: '800',
  },

  // Tooltip（點擊字詞後出現）
  tooltip: {
    position: 'absolute',
    bottom: 62,
    left: '50%',
    transform: [{ translateX: -70 }],
    width: 140,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 8,
    gap: 2,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  tooltipTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  tooltipSub: { fontSize: 11, color: '#D1D5DB', textAlign: 'center' },
  tooltipStats: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },

  footer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
