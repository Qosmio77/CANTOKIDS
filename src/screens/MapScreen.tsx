/**
 * MapScreen — 學習地圖
 *
 * Phase 3 更新：
 * - 免費版前 FREE_LESSON_LIMIT 課可用，之後顯示「升級解鎖」
 * - 右上角加入家長控制台入口
 * - isPremium 解鎖全部課程
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore, BOSSES } from '../store/useProgressStore';
import { Colors } from '../theme/colors';
import { FREE_LESSON_LIMIT } from '../services/iap/iapService';
import { Word } from '../types/word';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS,
  BAMBOO_WORDS, JADE_WORDS, ALL_WORDS,
} from '../data/allWords';

interface LevelSectionProps {
  label: string;
  words: Word[];
  lessonOffset: number;    // global lessonId 偏移（sapling 從 11 開始）
  isPremium: boolean;
  unlockedLessons: number[];
  wordProgress: Record<number, any>;
  bossesDefeated: string[];
  navigation: any;
  forceAllPremium?: boolean; // 整個 level 強制為 premium
  bossId: string;
}

function LevelSection({
  label, words, lessonOffset, isPremium, unlockedLessons, wordProgress,
  bossesDefeated, navigation, forceAllPremium = false, bossId,
}: LevelSectionProps) {
  // 判斷此 level 是否全部學完 → 解鎖 Boss
  const levelComplete = isPremium
    ? words.every((w) => wordProgress[w.id]?.learned)
    : words
        .filter((_, idx) => {
          const lessonId = lessonOffset + idx + 1;
          return !forceAllPremium && lessonId <= FREE_LESSON_LIMIT;
        })
        .every((w) => wordProgress[w.id]?.learned);
  const bossDefeated = bossesDefeated.includes(bossId);

  return (
    <View style={styles.levelSection}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelBadge}>{label}</Text>
        <Text style={styles.levelCount}>{words.length} 個漢字</Text>
      </View>
      <View style={styles.grid}>
        {words.map((word, index) => {
          const lessonId = lessonOffset + index + 1;
          const isPremiumLesson = forceAllPremium || lessonId > FREE_LESSON_LIMIT;
          const isAvailable = isPremium || !isPremiumLesson;
          const isUnlocked = isAvailable && (unlockedLessons.includes(lessonId) || lessonId === 1);
          const isLearned = wordProgress[word.id]?.learned ?? false;

          return (
            <TouchableOpacity
              key={word.id}
              style={[
                styles.lessonNode,
                isLearned && isAvailable && styles.lessonNodeDone,
                !isUnlocked && !isPremiumLesson && styles.lessonNodeLocked,
                isPremiumLesson && !isPremium && styles.lessonNodePremium,
              ]}
              onPress={() => {
                if (!isAvailable) {
                  navigation.navigate('ParentLogin');
                } else if (isUnlocked) {
                  navigation.navigate('Lesson', { wordId: word.id, lessonId });
                }
              }}
              accessibilityLabel={
                isPremiumLesson && !isPremium
                  ? `課程 ${lessonId}（高級版）`
                  : `課程 ${lessonId}：${word.character}`
              }
            >
              {isLearned && isAvailable ? (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              ) : isPremiumLesson && !isPremium ? (
                <>
                  <Ionicons name="diamond" size={18} color="#A78BFA" />
                  <Text style={styles.lessonNumPremium}>{lessonId}</Text>
                </>
              ) : isUnlocked ? (
                <Text style={styles.lessonChar}>{word.character}</Text>
              ) : (
                <Ionicons name="lock-closed" size={20} color={Colors.textMuted} />
              )}
              {!(isPremiumLesson && !isPremium) && (
                <Text style={styles.lessonNum}>{lessonId}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Boss 戰入口：完成該 Level 後解鎖 */}
      {levelComplete && (
        <TouchableOpacity
          style={[
            styles.bossBtn,
            bossDefeated && styles.bossBtnDefeated,
          ]}
          onPress={() => navigation.navigate('BossBattle', { bossId })}
          accessibilityLabel={bossDefeated ? 'Boss 已擊敗' : '挑戰 Boss'}
        >
          {bossDefeated ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.bossBtnTextDefeated}>
                {BOSSES.find((b) => b.id === bossId)?.emoji}{' '}
                {BOSSES.find((b) => b.id === bossId)?.name} — 已擊敗！
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.bossBtnEmoji}>
                {BOSSES.find((b) => b.id === bossId)?.emoji}
              </Text>
              <Text style={styles.bossBtnText}>
                ⚔️ 挑戰 {BOSSES.find((b) => b.id === bossId)?.name}！
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MapScreen({ navigation }: any) {
  const { unlockedLessons, wordProgress, isPremium, bossesDefeated } = useProgressStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 標題欄 + 家長入口 */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>🗺️ 學習地圖</Text>
          <Text style={styles.subtitle}>共 {ALL_WORDS.length} 個漢字 · 8 個級別</Text>
        </View>
        <TouchableOpacity
          style={styles.parentBtn}
          onPress={() => navigation.navigate('ParentLogin')}
          accessibilityLabel="進入家長控制台"
        >
          <Ionicons name="people" size={18} color={Colors.primary} />
          <Text style={styles.parentBtnText}>家長</Text>
        </TouchableOpacity>
      </View>

      {/* 免費版提示橫幅 */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeBanner}
          onPress={() => navigation.navigate('ParentLogin')}
          activeOpacity={0.8}
        >
          <Ionicons name="diamond" size={16} color={Colors.white} />
          <Text style={styles.upgradeBannerText}>
            升級解鎖全部 {ALL_WORDS.length} 個漢字 — 前 {FREE_LESSON_LIMIT} 課免費
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.white} />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {/* 幼苗級 */}
        <LevelSection
          label="🌱 幼苗級"
          words={SEEDLING_WORDS}
          lessonOffset={0}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          bossId="boss_seedling"
        />

        {/* 小樹級（全部需要 premium） */}
        <LevelSection
          label="🌳 小樹級"
          words={SAPLING_WORDS}
          lessonOffset={SEEDLING_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_sapling"
        />

        {/* 大樹級 */}
        <LevelSection
          label="🏆 大樹級"
          words={TREE_WORDS}
          lessonOffset={SEEDLING_WORDS.length + SAPLING_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_tree"
        />

        {/* 向日葵級 */}
        <LevelSection
          label="🌻 向日葵級"
          words={SUNFLOWER_WORDS}
          lessonOffset={SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_sunflower"
        />

        {/* 彩虹級 */}
        <LevelSection
          label="🌈 彩虹級"
          words={RAINBOW_WORDS}
          lessonOffset={SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_rainbow"
        />

        {/* 星河級 */}
        <LevelSection
          label="⭐ 星河級"
          words={GALAXY_WORDS}
          lessonOffset={SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length + RAINBOW_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_galaxy"
        />

        {/* 竹林級 */}
        <LevelSection
          label="🎋 竹林級"
          words={BAMBOO_WORDS}
          lessonOffset={SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length + RAINBOW_WORDS.length + GALAXY_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_bamboo"
        />

        {/* 玉龍級 */}
        <LevelSection
          label="💎 玉龍級"
          words={JADE_WORDS}
          lessonOffset={SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length + RAINBOW_WORDS.length + GALAXY_WORDS.length + BAMBOO_WORDS.length}
          isPremium={isPremium}
          unlockedLessons={unlockedLessons}
          wordProgress={wordProgress}
          bossesDefeated={bossesDefeated}
          navigation={navigation}
          forceAllPremium
          bossId="boss_jade"
        />

        {/* 底部說明 */}
        {!isPremium && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Ionicons name="diamond" size={14} color="#A78BFA" />
              <Text style={styles.legendText}>高級版課程（進入家長區升級）</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  parentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  parentBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cantonese,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 10,
  },
  upgradeBannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.white },
  container: { padding: 20, paddingBottom: 40 },
  levelSection: { gap: 12, marginBottom: 8 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: { fontSize: 16, fontWeight: '800', color: Colors.text },
  levelCount: { fontSize: 12, color: Colors.textMuted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  lessonNode: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  lessonNodeDone: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  lessonNodeLocked: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  lessonNodePremium: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  lessonChar: { fontSize: 26, fontWeight: '700', color: Colors.text },
  lessonNum: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  lessonNumPremium: { fontSize: 10, color: '#7C3AED', marginTop: 2 },
  legend: { marginTop: 24, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 12, color: Colors.textSecondary },

  // Boss 戰入口
  bossBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 4,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bossBtnDefeated: {
    backgroundColor: Colors.successLight,
    borderWidth: 2,
    borderColor: Colors.successBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  bossBtnEmoji: { fontSize: 22 },
  bossBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },
  bossBtnTextDefeated: { fontSize: 15, fontWeight: '700', color: Colors.success, flex: 1 },
});
