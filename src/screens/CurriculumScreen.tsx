/**
 * CurriculumScreen — K1-K3 課程對齊總覽
 *
 * 功能：
 * - 三個年級 (K1 / K2 / K3) 分頁顯示
 * - 每個年級按主題分組顯示漢字
 * - 點擊漢字卡可進入該課室學習
 * - 顯示已完成 / 未完成狀態
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AppText from '../components/AppText';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProgressStore } from '../store/useProgressStore';
import { getWordById } from '../data/allWords';
import { GRADE_INFO, getThemesByGrade, Grade } from '../data/curriculum';
import { useTranslation } from '../hooks/useTranslation';

type NavProp = StackNavigationProp<RootStackParamList>;

const GRADES: Grade[] = ['K1', 'K2', 'K3'];

export default function CurriculumScreen() {
  const navigation = useNavigation<NavProp>();
  const { t, language } = useTranslation();
  const [activeGrade, setActiveGrade] = useState<Grade>('K1');

  const wordProgressRaw = useProgressStore(s => s.wordProgress);

  const themeGroups = useMemo(
    () => getThemesByGrade(activeGrade),
    [activeGrade],
  );

  const gradeInfo = GRADE_INFO[activeGrade];

  // Count mastered chars for active grade
  const { mastered, total } = useMemo(() => {
    const ids = Object.values(themeGroups).flat();
    const m = ids.filter(id => wordProgressRaw[id]?.learned === true).length;
    return { mastered: m, total: ids.length };
  }, [themeGroups, wordProgressRaw]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppText style={styles.backIcon}>←</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>
          {language === 'en' ? 'K1-K3 Curriculum' : 'K1-K3 課程對齊'}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      {/* Grade Tabs */}
      <View style={styles.tabRow}>
        {GRADES.map(grade => {
          const info = GRADE_INFO[grade];
          const isActive = grade === activeGrade;
          return (
            <TouchableOpacity
              key={grade}
              style={[
                styles.tab,
                isActive && { backgroundColor: info.color, borderColor: info.color },
              ]}
              onPress={() => setActiveGrade(grade)}
            >
              <AppText style={[styles.tabEmoji]}>{info.emoji}</AppText>
              <AppText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {language === 'en' ? grade : info.nameZh}
              </AppText>
              <AppText style={[styles.tabAge, isActive && styles.tabAgeActive]}>
                {info.ageRange}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressCard, { backgroundColor: gradeInfo.bgColor, borderColor: gradeInfo.color + '40' }]}>
        <View style={styles.progressRow}>
          <AppText style={[styles.progressTitle, { color: gradeInfo.color }]}>
            {gradeInfo.emoji} {language === 'en' ? gradeInfo.nameEn : gradeInfo.nameZh}
          </AppText>
          <AppText style={[styles.progressCount, { color: gradeInfo.color }]}>
            {mastered} / {total}
          </AppText>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${total > 0 ? (mastered / total) * 100 : 0}%`, backgroundColor: gradeInfo.color },
            ]}
          />
        </View>
        <AppText style={styles.progressHint}>
          {language === 'en'
            ? `${mastered} characters mastered · ${total - mastered} to go`
            : `已掌握 ${mastered} 個字・還有 ${total - mastered} 個`}
        </AppText>
      </View>

      {/* Theme groups */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Object.entries(themeGroups).map(([theme, ids]) => (
          <ThemeSection
            key={theme}
            theme={theme}
            themeEn={language === 'en' ? (ids.length > 0 ? '' : theme) : theme}
            wordIds={ids}
            wordProgress={wordProgressRaw}
            gradeColor={gradeInfo.color}
            navigation={navigation}
            language={language}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ThemeSection ─────────────────────────────────────────────────────────────

interface ThemeSectionProps {
  theme: string;
  themeEn: string;
  wordIds: number[];
  wordProgress: Record<number, { learned?: boolean; correctCount?: number }>;
  gradeColor: string;
  navigation: NavProp;
  language: string;
}

function ThemeSection({ theme, themeEn, wordIds, wordProgress, gradeColor, navigation, language }: ThemeSectionProps) {
  const done = wordIds.filter(id => wordProgress[id]?.learned === true).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText style={[styles.sectionTitle, { color: gradeColor }]}>
          {theme}
        </AppText>
        <AppText style={styles.sectionCount}>
          {done}/{wordIds.length}
        </AppText>
      </View>
      <View style={styles.charsGrid}>
        {wordIds.map(id => (
          <CharChip
            key={id}
            wordId={id}
            learned={wordProgress[id]?.learned === true}
            correctCount={wordProgress[id]?.correctCount ?? 0}
            gradeColor={gradeColor}
            onPress={() => {
              const word = getWordById(id);
              if (word) {
                navigation.navigate('Lesson', { wordId: id, lessonId: id });
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ── CharChip ──────────────────────────────────────────────────────────────────

interface CharChipProps {
  wordId: number;
  learned: boolean;
  correctCount: number;
  gradeColor: string;
  onPress: () => void;
}

function CharChip({ wordId, learned, correctCount, gradeColor, onPress }: CharChipProps) {
  const word = getWordById(wordId);
  if (!word) return null;

  const done = learned;
  const perfect = learned && correctCount >= 5;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        done && { borderColor: gradeColor, backgroundColor: gradeColor + '15' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppText style={[styles.chipChar, done && { color: gradeColor }]}>
        {word.character}
      </AppText>
      <AppText style={styles.chipJp}>{word.jyutping}</AppText>
      {perfect && <AppText style={styles.chipStar}>⭐</AppText>}
      {done && !perfect && <AppText style={styles.chipDone}>✓</AppText>}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fbf9f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e3d5',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#E8A000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1c17',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e8e3d5',
    backgroundColor: '#fff',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabAge: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  tabAgeActive: {
    color: '#ffffffcc',
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  charsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: 68,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  chipChar: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
  },
  chipJp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  chipStar: {
    position: 'absolute',
    top: -6,
    right: -6,
    fontSize: 12,
  },
  chipDone: {
    position: 'absolute',
    top: -4,
    right: 0,
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
});
