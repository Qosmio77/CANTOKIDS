/**
 * HomeScreen — 新版首頁（對應設計稿）
 *
 * 佈局：
 *   ① Header    — Hello [名字]！👋 + ⭐ 星數
 *   ② 每日一句   — 藍紫漸層卡片
 *   ③ 繼續學習   — 最近學習課程卡
 *   ④ 學習主題   — 2×N Topic Grid
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Dimensions, Image,
} from 'react-native';
import AppText from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '../store/useProgressStore';
import { pauseBGM, resumeBGM, skipToNextBGM } from '../services/bgmService';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import { TOPICS } from '../data/topics';
import { getTodayPhrase } from '../data/dailyPhrases';
import { ALL_WORDS } from '../data/allWords';
import { CREATURES } from '../data/creatures';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

// ── Daily Task IDs ────────────────────────────────────────────────────────────
const DAILY_TASKS = [
  { id: 'learn',    emojiZh: '📖', labelZh: '學習 1 個新字', labelEn: 'Learn 1 new character' },
  { id: 'practice', emojiZh: '✏️', labelZh: '完成筆順練習',  labelEn: 'Complete stroke practice' },
  { id: 'quiz',     emojiZh: '🎯', labelZh: '完成一次測驗',  labelEn: 'Complete a quiz' },
];

const { width: SW } = Dimensions.get('window');

type Props = { navigation: StackNavigationProp<RootStackParamList> };

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const storedName        = useProgressStore(s => s.displayName);
  const totalStars        = useProgressStore(s => s.totalStars);
  const wordProgress      = useProgressStore(s => s.wordProgress);
  const language          = useProgressStore(s => s.language);
  const bgmEnabled        = useProgressStore(s => s.bgmEnabled);
  const toggleBGM         = useProgressStore(s => s.toggleBGM);
  const foodCount         = useProgressStore(s => s.foodCount);
  const dailyTasksDone    = useProgressStore(s => s.dailyTasksDone);
  const dailyTasksDate    = useProgressStore(s => s.dailyTasksDate);
  const dailyFoodClaimed  = useProgressStore(s => s.dailyFoodClaimed);
  const claimDailyBonus   = useProgressStore(s => s.claimDailyBonus);
  const completeDailyTask = useProgressStore(s => s.completeDailyTask);
  const bossesDefeated    = useProgressStore(s => s.bossesDefeated);
  const creatureProgress  = useProgressStore(s => s.creatureProgress);

  const hatchlingStartDate = useProgressStore(s => s.hatchlingStartDate);
  const hatchlingDaysDone  = useProgressStore(s => s.hatchlingDaysDone);
  const hatchlingComplete  = useProgressStore(s => s.hatchlingComplete);
  const placementDone      = useProgressStore(s => s.placementDone);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = dailyTasksDate === today ? dailyTasksDone : [];
  const allTasksDone = todayTasks.length >= 3;
  const showHatchling = !!hatchlingStartDate && !hatchlingComplete;

  // Find first unlocked creature for display
  const BOSS_TO_CREATURE: Record<string, string> = {
    boss_seedling: 'fox', boss_sapling: 'tiger', boss_tree: 'phoenix',
    boss_sunflower: 'qilin', boss_rainbow: 'dragon',
    boss_galaxy: 'pixiu', boss_bamboo: 'xuanwu',
  };
  const unlockedCreatureIds = bossesDefeated.map(b => BOSS_TO_CREATURE[b]).filter(Boolean);
  const featuredCreature = unlockedCreatureIds.length > 0
    ? CREATURES.find(c => c.id === unlockedCreatureIds[unlockedCreatureIds.length - 1])
    : null;

  const [stars, setStars] = useState(totalStars);

  useFocusEffect(useCallback(() => {
    setStars(useProgressStore.getState().totalStars);
  }, []));

  useEffect(() => {
    if (bgmEnabled) {
      resumeBGM();
    } else {
      pauseBGM();
    }
  }, [bgmEnabled]);

  const phrase = getTodayPhrase();
  const lastUnfinished = ALL_WORDS.find(w => !wordProgress[w.id]?.learned);
  const displayName = storedName || (language === 'en' ? 'Friend' : language === 'sc' ? '朋友' : '小朋友');

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ① Header */}
        <View style={s.header}>
          <AppText style={s.greeting}>
            {language === 'en' ? `Hello, ${displayName}! 👋` : `你好，${displayName}！👋`}
          </AppText>
          <View style={s.headerRight}>
            <View style={s.starChip}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <AppText style={s.starCount}>{stars}</AppText>
            </View>
            <TouchableOpacity
              style={s.bgmBtn}
              onPress={() => skipToNextBGM()}
              onLongPress={toggleBGM}
              activeOpacity={0.7}
            >
              <Ionicons
                name={bgmEnabled ? 'play-skip-forward' : 'musical-notes-outline'}
                size={22}
                color={bgmEnabled ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ① b 孵蛋挑戰橫幅 */}
        {showHatchling && (
          <TouchableOpacity
            style={s.hatchBanner}
            onPress={() => (navigation as any).navigate('HatchlingChallenge')}
            activeOpacity={0.85}
          >
            <AppText style={s.hatchBannerEmoji}>🥚</AppText>
            <View style={{ flex: 1 }}>
              <AppText style={s.hatchBannerTitle}>
                {language === 'en' ? '7-Day Hatch Challenge' : '7 天孵蛋挑戰'}
              </AppText>
              <AppText style={s.hatchBannerSub}>
                {language === 'en'
                  ? `Day ${hatchlingDaysDone}/7 — keep going!`
                  : `第 ${hatchlingDaysDone}/7 天 — 繼續加油！`}
              </AppText>
            </View>
            <View style={s.hatchProgressRow}>
              {Array.from({ length: 7 }, (_, i) => (
                <View key={i} style={[s.hatchDot, i < hatchlingDaysDone && s.hatchDotDone]} />
              ))}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B45309" />
          </TouchableOpacity>
        )}

        {/* ① c 程度測試提示（只顯示一次） */}
        {!placementDone && (
          <TouchableOpacity
            style={s.placementBanner}
            onPress={() => (navigation as any).navigate('PlacementTest')}
            activeOpacity={0.85}
          >
            <AppText style={s.placementEmoji}>🎓</AppText>
            <View style={{ flex: 1 }}>
              <AppText style={s.placementTitle}>
                {language === 'en' ? 'Take Placement Test' : '程度測試'}
              </AppText>
              <AppText style={s.placementSub}>
                {language === 'en' ? 'Find your starting level (2 min)' : '找出你的起點級別（2 分鐘）'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        )}

        {/* ② 每日一句 */}
        <View style={s.phraseCard}>
          <View style={s.phraseTop}>
            <View style={s.phraseBadge}>
              <AppText style={s.phraseBadgeText}>
                {language === 'en' ? "Today's Phrase!" : '每日一句！'}
              </AppText>
            </View>
            <AppText style={s.phraseEmoji}>{phrase.emoji}</AppText>
          </View>
          <AppText style={s.phraseZh}>{phrase.zh}</AppText>
          <AppText style={s.phraseJyut}>{phrase.jyutping}</AppText>
          {language === 'en' && (
            <AppText style={s.phraseEn}>{phrase.en}</AppText>
          )}
        </View>

        {/* ③ 快捷功能 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.quickRow}
          style={s.quickRowScroll}
        >
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => (navigation as any).navigate('Practice')}
            activeOpacity={0.82}
          >
            <AppText style={s.quickEmoji}>✏️</AppText>
            <AppText style={s.quickLabel}>
              {language === 'en' ? 'Free Practice' : language === 'sc' ? '自由练习' : '自由練習'}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => (navigation as any).navigate('QuizMenu')}
            activeOpacity={0.82}
          >
            <AppText style={s.quickEmoji}>🎯</AppText>
            <AppText style={s.quickLabel}>
              {language === 'en' ? 'Quiz' : '測驗'}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => (navigation as any).navigate('PracticeSheet')}
            activeOpacity={0.82}
          >
            <AppText style={s.quickEmoji}>📄</AppText>
            <AppText style={s.quickLabel}>
              {language === 'en' ? 'Sheet' : language === 'sc' ? '练习纸' : '練習紙'}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => (navigation as any).navigate('VoicePractice')}
            activeOpacity={0.82}
          >
            <AppText style={s.quickEmoji}>🎤</AppText>
            <AppText style={s.quickLabel}>
              {language === 'en' ? 'Voice' : language === 'sc' ? '语音练习' : '語音練習'}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => (navigation as any).navigate('Curriculum')}
            activeOpacity={0.82}
          >
            <AppText style={s.quickEmoji}>📚</AppText>
            <AppText style={s.quickLabel}>
              {language === 'en' ? 'K1-K3' : 'K1-K3 課程'}
            </AppText>
          </TouchableOpacity>
        </ScrollView>

        {/* ③b 每日任務 + 神獸快捷 */}
        <View style={s.dailyRow}>
          {/* Daily Tasks Card */}
          <View style={s.dailyCard}>
            <View style={s.dailyHeader}>
              <AppText style={s.dailyTitle}>
                {language === 'en' ? '📋 Daily Tasks' : '📋 每日任務'}
              </AppText>
              <View style={s.foodBadge}>
                <AppText style={s.foodBadgeText}>🍖 {foodCount}</AppText>
              </View>
            </View>
            {DAILY_TASKS.map(task => {
              const done = todayTasks.includes(task.id);
              return (
                <View key={task.id} style={s.taskRow}>
                  <AppText style={s.taskEmoji}>{task.emojiZh}</AppText>
                  <AppText style={[s.taskLabel, done && s.taskLabelDone]} numberOfLines={1}>
                    {language === 'en' ? task.labelEn : task.labelZh}
                  </AppText>
                  {done
                    ? <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                    : <View style={s.taskCircle} />}
                </View>
              );
            })}
            {allTasksDone && !dailyFoodClaimed && (
              <TouchableOpacity style={s.claimBtn} onPress={claimDailyBonus}>
                <AppText style={s.claimBtnText}>
                  {language === 'en' ? '🎁 Claim +2 Bonus!' : '🎁 領取 +2 獎勵！'}
                </AppText>
              </TouchableOpacity>
            )}
            {allTasksDone && dailyFoodClaimed && (
              <View style={s.allDoneBadge}>
                <AppText style={s.allDoneText}>
                  ✅ {language === 'en' ? 'All done today!' : '今日全部完成！'}
                </AppText>
              </View>
            )}
          </View>

          {/* Creature Shortcut */}
          <TouchableOpacity
            style={s.creatureShortcut}
            onPress={() => (navigation as any).navigate('Creature')}
            activeOpacity={0.82}
          >
            <AppText style={s.creatureShortcutEmoji}>
              {featuredCreature
                ? featuredCreature.emoji
                : '🥚'}
            </AppText>
            <AppText style={s.creatureShortcutTitle}>
              {language === 'en' ? 'Sanctuary' : '神獸庇護所'}
            </AppText>
            <AppText style={s.creatureShortcutSub}>
              {unlockedCreatureIds.length > 0
                ? `${unlockedCreatureIds.length}/${CREATURES.length}`
                : (language === 'en' ? 'Defeat a\nboss to start' : '擊敗 Boss\n解鎖神獸')}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ④ 繼續學習 */}
        {lastUnfinished && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <AppText style={s.sectionTitle}>
                {language === 'en' ? 'Continue Learning' : '繼續學習'}
              </AppText>
              <TouchableOpacity onPress={() => (navigation as any).navigate('Map')}>
                <AppText style={s.sectionLink}>
                  {language === 'en' ? 'See all ›' : '查看全部 ›'}
                </AppText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.continueCard}
              onPress={() => navigation.navigate('Lesson', {
                wordId: lastUnfinished.id,
                lessonId: lastUnfinished.id,
              })}
              activeOpacity={0.85}
            >
              <View style={s.continueCoverBox}>
                <AppText style={s.continueCoverEmoji}>
                  {(lastUnfinished as any).emoji ?? '📖'}
                </AppText>
              </View>
              <View style={s.continueInfo}>
                <AppText style={s.continueName}>{lastUnfinished.character}</AppText>
                <AppText style={s.continueSub}>
                  {language === 'en' ? lastUnfinished.meaning_en : lastUnfinished.meaning_zh}
                </AppText>
                <View style={s.progressRow}>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: '0%' }]} />
                  </View>
                  <AppText style={s.progressPct}>0%</AppText>
                </View>
              </View>
              <View style={s.continueArrow}>
                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ④ 學習主題 */}
        <View style={s.section}>
          <AppText style={s.sectionTitle}>
            {language === 'en' ? 'Topics' : '學習主題'}
          </AppText>
          <View style={s.topicGrid}>
            {TOPICS.map(topic => (
              <TouchableOpacity
                key={topic.id}
                style={[s.topicCard, {
                  backgroundColor: topic.bgColor,
                }]}
                onPress={() => (navigation as any).navigate('TopicDetail', { topicId: topic.id })}
                activeOpacity={0.82}
              >
                <Image source={topic.iconPng} style={s.topicIcon} resizeMode="contain" />
                <AppText style={s.topicName} numberOfLines={1}>
                  {language === 'en' ? topic.title_en :
                   language === 'sc' ? topic.title_sc : topic.title_zh}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = (SW - 48 - 12) / 2;

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primaryBg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
  },
  greeting:  { fontSize: 26, fontWeight: '700', color: Colors.text, flex: 1 },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  starChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryBg, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  starCount: { fontSize: 19, fontWeight: '700', color: '#B45309' },
  bgmBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },

  phraseCard: {
    marginHorizontal: 20, marginTop: 4, marginBottom: 4,
    borderRadius: 20, padding: 18,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5', shadowOpacity: 0.35, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  phraseTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  phraseBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  phraseBadgeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  phraseEmoji:     { fontSize: 38 },
  phraseZh:        { fontSize: 25, fontWeight: '700', color: '#fff', marginBottom: 6 },
  phraseJyut:      { fontSize: 16, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' },
  phraseEn:        { fontSize: 16, color: 'rgba(255,255,255,0.80)', marginTop: 4 },

  quickRowScroll: {
    marginTop: 14,
  },
  quickRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingRight: 24,
  },
  quickCard: {
    width: 80, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
    backgroundColor: Colors.primaryBg, gap: 6,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  quickEmoji: { fontSize: 28 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },

  // ── Hatchling banner ──
  hatchBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 10, marginBottom: 2,
    backgroundColor: '#FEF9C3', borderRadius: 14, padding: 12,
    borderWidth: 2, borderColor: '#FDE68A',
  },
  hatchBannerEmoji: { fontSize: 28 },
  hatchBannerTitle: { fontSize: 15, fontWeight: '800', color: '#92400E' },
  hatchBannerSub:   { fontSize: 12, color: '#B45309' },
  hatchProgressRow: { flexDirection: 'row', gap: 3 },
  hatchDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  hatchDotDone: { backgroundColor: Colors.primary },

  // ── Placement banner ──
  placementBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 8, marginBottom: 2,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12,
    borderWidth: 2, borderColor: '#BFDBFE',
  },
  placementEmoji: { fontSize: 24 },
  placementTitle: { fontSize: 15, fontWeight: '800', color: '#1E40AF' },
  placementSub:   { fontSize: 12, color: '#3B82F6' },

  // ── Daily Tasks + Creature Row ──
  dailyRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, marginTop: 14,
  },
  dailyCard: {
    flex: 1.7, backgroundColor: Colors.primaryBg, borderRadius: 16, padding: 13,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 5,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
    gap: 7,
  },
  dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyTitle:  { fontSize: 14, fontWeight: '800', color: Colors.text },
  foodBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  foodBadgeText: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskEmoji: { fontSize: 15, width: 22 },
  taskLabel: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  taskLabelDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskCircle: {
    width: 17, height: 17, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.borderLight,
  },
  claimBtn: {
    backgroundColor: '#DCFCE7', borderRadius: 10,
    paddingVertical: 6, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#86EFAC',
  },
  claimBtnText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  allDoneBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 10,
    paddingVertical: 6, alignItems: 'center',
  },
  allDoneText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  creatureShortcut: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: Colors.primaryBg, gap: 4,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 5,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  creatureShortcutEmoji: { fontSize: 40 },
  creatureShortcutTitle: { fontSize: 12, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  creatureShortcutSub:   { fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 14 },

  section: { marginTop: 22, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sectionLink:  { fontSize: 18, color: Colors.primary, fontWeight: '600' },

  continueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryBg, borderRadius: 16, padding: 14,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  continueCoverBox: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  continueCoverEmoji: { fontSize: 38 },
  continueInfo:  { flex: 1 },
  continueName:  { fontSize: 21, fontWeight: '700', color: Colors.text },
  continueSub:   { fontSize: 15, color: Colors.textMuted, marginTop: 2, marginBottom: 8 },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1, height: 6, backgroundColor: Colors.borderLight,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill:  { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  progressPct:   { fontSize: 14, color: Colors.textMuted, width: 28 },
  continueArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },

  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  topicCard: {
    width: CARD_W, paddingVertical: 16, paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center', gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  topicEmoji: { fontSize: 48 },
  topicIcon:  { width: CARD_W - 20, height: CARD_W - 20 },
  topicName:  { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
});
