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
import { Colors } from '../../theme/colors';
import { getRankByXP, getNextRank, PLAYER_RANKS, BOSSES } from '../../store/useProgressStore';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS,
} from '../../data/allWords';
import { QRUserData } from '../../services/qrAuthService';
import { Word } from '../../types/word';

interface Props {
  userData: QRUserData;
  onLogout: () => void;
}

// ── Level 定義（標籤 + 顏色） ───────────────────────────────────────
const LEVEL_META = [
  { key: 'seedling',  label: '🌱 幼苗級',  words: SEEDLING_WORDS,  color: '#10B981', bg: '#ECFDF5' },
  { key: 'sapling',   label: '🌳 小樹級',  words: SAPLING_WORDS,   color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'tree',      label: '🏆 大樹級',  words: TREE_WORDS,      color: '#EF4444', bg: '#FEF2F2' },
  { key: 'sunflower', label: '🌻 向日葵級', words: SUNFLOWER_WORDS, color: '#F97316', bg: '#FFF7ED' },
  { key: 'rainbow',   label: '🌈 彩虹級',  words: RAINBOW_WORDS,   color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'galaxy',    label: '⭐ 星河級',  words: GALAXY_WORDS,    color: '#3B82F6', bg: '#EFF6FF' },
] as const;

// ── 字詞格子 ────────────────────────────────────────────────────────
function WordChip({
  word,
  learned,
  correct,
  wrong,
}: {
  word: Word;
  learned: boolean;
  correct: number;
  wrong: number;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.wordChip, learned && styles.wordChipLearned]}
      onPress={() => setShowTip((v) => !v)}
      accessibilityLabel={`${word.character}，${learned ? '已學' : '未學'}`}
    >
      <Text style={[styles.wordChipChar, learned && styles.wordChipCharLearned]}>
        {word.character}
      </Text>
      {learned && <Text style={styles.wordChipCheck}>✓</Text>}
      {showTip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTitle}>{word.character}</Text>
          <Text style={styles.tooltipSub}>{word.jyutping}  {word.meaning_zh}</Text>
          <Text style={styles.tooltipStats}>✅ {correct}  ❌ {wrong}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── 主組件 ─────────────────────────────────────────────────────────
export default function WebDashboardScreen({ userData, onLogout }: Props) {
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
        <Text style={styles.appName}>🐤 CantoKids</Text>
        <View style={styles.topRight}>
          <Text style={styles.syncLabel}>同步於 {syncTime}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>登出</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 玩家卡 ─────────────────────────────────────────────── */}
      <View style={styles.playerCard}>
        <View style={styles.playerLeft}>
          <Text style={styles.playerEmoji}>{rank.emoji}</Text>
          <View>
            <Text style={styles.playerName}>{userData.displayName}</Text>
            <Text style={styles.playerRank}>Lv.{rank.level} {rank.name}</Text>
          </View>
        </View>
        <View style={styles.playerRight}>
          <Text style={styles.playerXP}>{userData.playerXP} XP</Text>
          {nextRank && (
            <Text style={styles.playerXPSub}>距 {nextRank.name} 還需 {xpToNext} XP</Text>
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
          <Text style={styles.statEmoji}>❤️</Text>
          <Text style={styles.statValue}>{userData.totalStars}</Text>
          <Text style={styles.statLabel}>星星</Text>
        </View>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{userData.streakDays}</Text>
          <Text style={styles.statLabel}>連續天數</Text>
        </View>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statValue}>{userData.totalStars}</Text>
          <Text style={styles.statLabel}>星星</Text>
        </View>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statValue}>{correctRate}%</Text>
          <Text style={styles.statLabel}>答對率</Text>
        </View>
      </View>

      {/* ── 學習進度條 ──────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 學習進度</Text>
          <Text style={styles.sectionBadge}>{learnedCount} / {totalWords}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            { width: `${Math.round((learnedCount / totalWords) * 100)}%` as any },
          ]} />
        </View>
        <Text style={styles.progressPct}>
          {Math.round((learnedCount / totalWords) * 100)}% 完成
        </Text>
      </View>

      {/* ── Boss 狀態 ────────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚔️ Boss 戰</Text>
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
                <Text style={styles.bossChipEmoji}>{boss.emoji}</Text>
                <Text style={[styles.bossChipName, { color: boss.color }]}>
                  {boss.name}
                </Text>
                <Text style={styles.bossChipStatus}>
                  {defeated ? '✅ 已擊敗' : '🔒 未挑戰'}
                </Text>
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
              <Text style={[styles.sectionTitle, { color }]}>{label}</Text>
              <Text style={[styles.sectionBadge, { backgroundColor: bg, color }]}>
                {levelLearned} / {words.length}
              </Text>
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
                  />
                );
              })}
            </View>
          </View>
        );
      })}

      {/* ── 底部 ─────────────────────────────────────────────────── */}
      <Text style={styles.footer}>
        CantoKids — 資料僅從手機同步，不會儲存在瀏覽器
      </Text>
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
