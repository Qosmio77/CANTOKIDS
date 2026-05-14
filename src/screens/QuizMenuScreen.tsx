/**
 * QuizMenuScreen — 測驗模式 + 詞庫級別選擇
 *
 * Phase 4 更新：
 * - 新增詞庫級別選擇器（幼苗 / 小樹 / 大樹 / 全部混合）
 * - 選好後傳入 QuizScreen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { useTranslation } from '../hooks/useTranslation';

export type QuizLevel = 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy' | 'vocab' | 'idiom' | 'all';
export type QuizType = 'listenPick' | 'readPick' | 'findWrong';

interface QuizMode {
  type: QuizType;
  emoji: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface LevelOption {
  level: QuizLevel;
  emoji: string;
  label: string;
  requiresPremium: boolean;
}

export default function QuizMenuScreen({ navigation }: any) {
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>('seedling');
  const { isPremium } = useProgressStore();
  const { t } = useTranslation();

  const QUIZ_MODES: QuizMode[] = [
    {
      type: 'listenPick',
      emoji: '👂',
      title: t('quizListen'),
      description: t('quizListenDesc'),
      color: Colors.cantonese,
      bgColor: Colors.cantoneseBg,
    },
    {
      type: 'readPick',
      emoji: '👀',
      title: t('quizRead'),
      description: t('quizReadDesc'),
      color: Colors.mandarin,
      bgColor: Colors.mandarinLight,
    },
    {
      type: 'findWrong',
      emoji: '🔍',
      title: t('quizOddOne'),
      description: t('quizOddOneDesc'),
      color: Colors.quiz,
      bgColor: Colors.quizLight,
    },
  ];

  const LEVEL_OPTIONS: LevelOption[] = [
    { level: 'seedling',  emoji: '🌱', label: t('quizTabSeedling'),  requiresPremium: false },
    { level: 'sapling',   emoji: '🌳', label: t('quizTabSapling'),   requiresPremium: true  },
    { level: 'tree',      emoji: '🏆', label: t('quizTabTree'),      requiresPremium: true  },
    { level: 'sunflower', emoji: '🌻', label: t('quizTabSunflower'), requiresPremium: true  },
    { level: 'rainbow',   emoji: '🌈', label: t('quizTabRainbow'),   requiresPremium: true  },
    { level: 'galaxy',    emoji: '⭐', label: t('quizTabGalaxy'),    requiresPremium: true  },
    { level: 'vocab',     emoji: '📝', label: t('quizTabVocab'),     requiresPremium: true  },
    { level: 'idiom',     emoji: '🏮', label: t('quizTabIdiom'),     requiresPremium: true  },
    { level: 'all',       emoji: '🌍', label: t('quizTabAll'),       requiresPremium: true  },
  ];

  const LEVEL_INFO: Partial<Record<QuizLevel, string>> = {
    seedling:  t('quizInfoSeedling'),
    sapling:   t('quizInfoSapling'),
    tree:      t('quizInfoTree'),
    sunflower: t('quizInfoSunflower'),
    rainbow:   t('quizInfoRainbow'),
    galaxy:    t('quizInfoGalaxy'),
    all:       t('quizInfoAll'),
  };

  const handleLevelSelect = (opt: LevelOption) => {
    if (opt.requiresPremium && !isPremium) {
      navigation.navigate('ParentLogin');
      return;
    }
    setSelectedLevel(opt.level);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('interactiveTest')}</Text>
        <Text style={styles.subtitle}>{t('quizSelectMode')}</Text>

        {/* 詞庫級別選擇器 */}
        <View style={styles.levelRow}>
          {LEVEL_OPTIONS.map((opt) => {
            const locked = opt.requiresPremium && !isPremium;
            const active = selectedLevel === opt.level;
            return (
              <TouchableOpacity
                key={opt.level}
                style={[
                  styles.levelTab,
                  active && styles.levelTabActive,
                  locked && styles.levelTabLocked,
                ]}
                onPress={() => handleLevelSelect(opt)}
                accessibilityLabel={`${opt.label}${locked ? t('quizLevelUpgrade') : ''}`}
              >
                <Text style={styles.levelTabEmoji}>{locked ? '🔒' : opt.emoji}</Text>
                <Text style={[styles.levelTabLabel, active && styles.levelTabLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 目前選中的級別說明 */}
        <View style={styles.levelInfo}>
          <Text style={styles.levelInfoText}>
            {LEVEL_INFO[selectedLevel] ?? ''}
          </Text>
        </View>

        {/* 測驗模式 */}
        {QUIZ_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.type}
            style={[styles.modeCard, { backgroundColor: mode.bgColor, borderColor: mode.color }]}
            onPress={() =>
              navigation.navigate('Quiz', { quizType: mode.type, quizLevel: selectedLevel })
            }
            accessibilityLabel={`${mode.title}，${mode.description}`}
          >
            <Text style={styles.modeEmoji}>{mode.emoji}</Text>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeTitle, { color: mode.color }]}>{mode.title}</Text>
              <Text style={styles.modeDesc}>{mode.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={mode.color} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },

  levelRow: { flexDirection: 'row', gap: 8 },
  levelTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 2,
  },
  levelTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  levelTabLocked: { opacity: 0.55 },
  levelTabEmoji: { fontSize: 18 },
  levelTabLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  levelTabLabelActive: { color: Colors.primary },

  levelInfo: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  levelInfoText: { fontSize: 13, color: Colors.textSecondary },

  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  modeEmoji: { fontSize: 36 },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modeDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
