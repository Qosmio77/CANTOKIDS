/**
 * HatchlingChallengeScreen — 7 天孵蛋挑戰
 *
 * 連續 7 天完成每日任務 → 雞蛋孵化 → 解鎖第一隻神獸（九尾狐）
 * 每完成當天所有任務 → 自動推進一天（由 store 處理）
 */

import React, { useEffect, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { CREATURES } from '../data/creatures';

const { width: SW } = Dimensions.get('window');

// Egg state per day count
function eggEmoji(daysDone: number): string {
  if (daysDone >= 7) return '🐣';
  if (daysDone >= 5) return '🥚';  // cracking soon
  if (daysDone >= 3) return '🥚';  // warming up
  return '🥚';
}

function eggSize(daysDone: number): number {
  if (daysDone >= 7) return 130;
  return 90 + daysDone * 6;  // grows with each day
}

// Day circle component
function DayCircle({ day, done, isToday }: { day: number; done: boolean; isToday: boolean }) {
  return (
    <View style={[
      s.dayCircle,
      done  && s.dayCircleDone,
      isToday && !done && s.dayCircleToday,
    ]}>
      {done
        ? <Ionicons name="checkmark" size={16} color="#fff" />
        : <AppText style={[s.dayNum, isToday && s.dayNumToday]}>{day}</AppText>
      }
    </View>
  );
}

export default function HatchlingChallengeScreen({ navigation }: any) {
  const {
    language,
    hatchlingDaysDone,
    hatchlingComplete,
    hatchlingStartDate,
    dailyTasksDone,
    dailyTasksDate,
    creatureProgress,
  } = useProgressStore();

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  // Egg bounce animation
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  // Hatch glow for day 7
  useEffect(() => {
    if (hatchlingComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hatchlingComplete]);

  const today = new Date().toISOString().split('T')[0];
  const todayTasksDone = dailyTasksDate === today ? dailyTasksDone : [];
  const TASK_IDS = ['learn', 'practice', 'quiz'];
  const todayComplete = TASK_IDS.every(id => todayTasksDone.includes(id));

  const foxUnlocked = !!creatureProgress['fox'];
  const fox = CREATURES.find(c => c.id === 'fox')!;

  // Progress description
  const daysLeft = 7 - hatchlingDaysDone;

  const iL = language === 'en';

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <AppText style={s.title}>
          {iL ? '🥚 7-Day Hatch Challenge' : '🥚 7 天孵蛋挑戰'}
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* ── Egg display ── */}
        <View style={s.eggSection}>
          {hatchlingComplete ? (
            <Animated.View style={{ opacity: glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.85, 1] }) }}>
              <AppText style={s.eggHatched}>🐣</AppText>
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
              <AppText style={[s.egg, { fontSize: eggSize(hatchlingDaysDone) }]}>🥚</AppText>
            </Animated.View>
          )}

          {!hatchlingComplete && (
            <View style={s.eggGlowRing}>
              <View style={[s.glowRing, { width: eggSize(hatchlingDaysDone) + 30, height: eggSize(hatchlingDaysDone) + 30, borderRadius: (eggSize(hatchlingDaysDone) + 30) / 2 }]} />
            </View>
          )}
        </View>

        {/* ── Status text ── */}
        {hatchlingComplete ? (
          <View style={s.hatchedCard}>
            <AppText style={s.hatchedTitle}>
              🎉 {iL ? 'Egg Hatched!' : '雞蛋孵化了！'}
            </AppText>
            <AppText style={s.hatchedEmoji}>{fox.emoji}</AppText>
            <AppText style={s.hatchedName}>
              {iL ? fox.nameEn : fox.nameZh}
            </AppText>
            <AppText style={s.hatchedDesc}>
              {iL
                ? 'You\'ve unlocked your first mythical creature! Visit the Creature Sanctuary to start feeding it.'
                : '你解鎖了第一隻神話生物！前往神獸庇護所開始餵食讓牠成長！'}
            </AppText>
            <TouchableOpacity
              style={s.visitBtn}
              onPress={() => navigation.navigate('Creature')}
            >
              <AppText style={s.visitBtnText}>
                {iL ? '🐾 Visit Sanctuary' : '🐾 前往神獸庇護所'}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.statusCard}>
            <AppText style={s.statusTitle}>
              {iL
                ? `Day ${hatchlingDaysDone}/7 · ${daysLeft} days to hatch!`
                : `第 ${hatchlingDaysDone}/7 天 · 還有 ${daysLeft} 天孵化！`}
            </AppText>
            <AppText style={s.statusDesc}>
              {iL
                ? 'Complete all 3 daily tasks each day to advance the challenge.'
                : '每天完成 3 個每日任務，挑戰便會推進一天。'}
            </AppText>
          </View>
        )}

        {/* ── 7 day progress ── */}
        <View style={s.daysSection}>
          <AppText style={s.daysSectionTitle}>
            {iL ? 'Progress' : '進度'}
          </AppText>
          <View style={s.daysRow}>
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum  = i + 1;
              const done    = i < hatchlingDaysDone;
              const isToday = i === hatchlingDaysDone && !hatchlingComplete;
              return <DayCircle key={i} day={dayNum} done={done} isToday={isToday} />;
            })}
          </View>
          <View style={s.daysLabelRow}>
            {Array.from({ length: 7 }, (_, i) => (
              <AppText key={i} style={s.dayLabel}>
                {iL ? `D${i+1}` : `第${i+1}天`}
              </AppText>
            ))}
          </View>
        </View>

        {/* ── Today's tasks ── */}
        {!hatchlingComplete && (
          <View style={s.tasksCard}>
            <AppText style={s.tasksTitle}>
              {iL ? "Today's Tasks" : '今日任務'}
            </AppText>
            {[
              { id: 'learn',    zh: '📖 學習 1 個新字', en: '📖 Learn 1 character' },
              { id: 'practice', zh: '✏️ 完成筆順練習',  en: '✏️ Complete stroke practice' },
              { id: 'quiz',     zh: '🎯 完成一次測驗',  en: '🎯 Complete a quiz' },
            ].map(task => {
              const done = todayTasksDone.includes(task.id);
              return (
                <View key={task.id} style={s.taskRow}>
                  <AppText style={[s.taskText, done && s.taskDone]}>
                    {iL ? task.en : task.zh}
                  </AppText>
                  {done
                    ? <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    : <View style={s.taskEmpty} />}
                </View>
              );
            })}
            {todayComplete && (
              <View style={s.todayDoneBadge}>
                <AppText style={s.todayDoneText}>
                  ✅ {iL ? "Today's tasks all done! See you tomorrow 👋" : '今日全部完成！明天繼續 👋'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* ── Reward preview ── */}
        <View style={s.rewardCard}>
          <AppText style={s.rewardTitle}>
            {iL ? '🏆 Hatch Reward' : '🏆 孵化獎勵'}
          </AppText>
          <View style={s.rewardRow}>
            <AppText style={s.rewardEmoji}>{fox.emoji}</AppText>
            <View style={s.rewardInfo}>
              <AppText style={s.rewardName}>
                {iL ? fox.stageNamesEn[0] : fox.stageNamesZh[0]}
              </AppText>
              <AppText style={s.rewardDesc}>
                {iL ? fox.descEn : fox.descZh}
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },

  body: { paddingHorizontal: 20, alignItems: 'center', gap: 20 },

  // ── Egg ──
  eggSection: {
    width: 200, height: 200,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  egg:        { textAlign: 'center' },
  eggHatched: { fontSize: 130, textAlign: 'center' },
  eggGlowRing: {
    position: 'absolute',
    justifyContent: 'center', alignItems: 'center',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  glowRing: {
    backgroundColor: '#FEF9C3',
    position: 'absolute',
    opacity: 0.4,
  },

  // ── Status card ──
  statusCard: {
    alignSelf: 'stretch', backgroundColor: '#FEF9C3',
    borderRadius: 18, padding: 18,
    borderWidth: 2, borderColor: '#FDE68A',
    alignItems: 'center', gap: 8,
  },
  statusTitle: { fontSize: 20, fontWeight: '800', color: '#B45309', textAlign: 'center' },
  statusDesc:  { fontSize: 14, color: '#92400E', textAlign: 'center', lineHeight: 20 },

  hatchedCard: {
    alignSelf: 'stretch', backgroundColor: '#DCFCE7',
    borderRadius: 18, padding: 20,
    borderWidth: 2, borderColor: '#86EFAC',
    alignItems: 'center', gap: 10,
  },
  hatchedTitle: { fontSize: 24, fontWeight: '800', color: '#15803D' },
  hatchedEmoji: { fontSize: 72 },
  hatchedName:  { fontSize: 20, fontWeight: '800', color: '#15803D' },
  hatchedDesc:  { fontSize: 14, color: '#166534', textAlign: 'center', lineHeight: 20 },
  visitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16A34A', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 4,
  },
  visitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── Days progress ──
  daysSection: {
    alignSelf: 'stretch', backgroundColor: Colors.primaryBg,
    borderRadius: 18, padding: 16,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
    gap: 12,
  },
  daysSectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  dayCircleDone:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayCircleToday: { backgroundColor: '#FEF9C3', borderColor: Colors.primary, borderWidth: 2.5 },
  dayNum:      { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  dayNumToday: { color: '#B45309' },
  daysLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { width: 38, fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  // ── Tasks card ──
  tasksCard: {
    alignSelf: 'stretch', backgroundColor: Colors.primaryBg,
    borderRadius: 18, padding: 16,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
    gap: 10,
  },
  tasksTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskText: { fontSize: 15, color: Colors.textSecondary, flex: 1 },
  taskDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskEmpty: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.borderLight,
  },
  todayDoneBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#A7F3D0',
  },
  todayDoneText: { fontSize: 13, fontWeight: '700', color: '#15803D' },

  // ── Reward card ──
  rewardCard: {
    alignSelf: 'stretch', backgroundColor: '#FEF9C3',
    borderRadius: 18, padding: 16,
    borderWidth: 2, borderColor: '#FDE68A', gap: 12,
  },
  rewardTitle: { fontSize: 16, fontWeight: '800', color: '#B45309' },
  rewardRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  rewardEmoji: { fontSize: 52 },
  rewardInfo:  { flex: 1, gap: 4 },
  rewardName:  { fontSize: 18, fontWeight: '800', color: '#92400E' },
  rewardDesc:  { fontSize: 13, color: '#B45309', lineHeight: 18 },
});
