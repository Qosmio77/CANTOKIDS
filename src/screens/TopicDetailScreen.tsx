/**
 * TopicDetailScreen — 主題詳情
 *
 * Tabs：詞語 | 句子 | 故事
 * 詞語：字卡格（emoji + 字 + 拼音 + 喇叭）
 * 句子：詞語的 example_sentence
 * 故事：此主題相關故事
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Dimensions, Image,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import PronButton from '../components/PronButton';
import { useProgressStore } from '../store/useProgressStore';
import { Colors } from '../theme/colors';
import { getTopicById } from '../data/topics';
import { getStoriesByTopic } from '../data/stories';
import { useAudio } from '../hooks/useAudio';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width: SW } = Dimensions.get('window');
const WORD_CARD_W = (SW - 48 - 12) / 2;

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'TopicDetail'>;
};

type TabKey = 'words' | 'sentences' | 'stories';

export default function TopicDetailScreen({ navigation, route }: Props) {
  const { topicId } = route.params;
  const language = useProgressStore(s => s.language);
  const { playWord } = useAudio();
  const [activeTab, setActiveTab] = useState<TabKey>('words');

  const topic = getTopicById(topicId);
  if (!topic) return null;

  const stories = getStoriesByTopic(topicId);

  const topicTitle = language === 'en' ? topic.title_en :
                     language === 'sc' ? topic.title_sc : topic.title_zh;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'words',     label: language === 'en' ? 'Words'    : '詞語' },
    { key: 'sentences', label: language === 'en' ? 'Sentences': '句子' },
    { key: 'stories',   label: language === 'en' ? 'Stories'  : '故事' },
  ];

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Image source={topic.iconPng} style={s.headerIcon} resizeMode="contain" />
          <AppText style={s.headerTitle}>{topicTitle}</AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <AppText style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>
              {tab.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── 詞語 Tab ── */}
        {activeTab === 'words' && (
          <View style={s.wordGrid}>
            {topic.words.map(word => (
              <TouchableOpacity
                key={word.id}
                style={s.wordCard}
                onPress={() => navigation.navigate('Lesson', {
                  wordId: word.id, lessonId: word.id,
                })}
                activeOpacity={0.82}
              >
                {(word as any).emoji ? (
                  <AppText style={s.wordEmoji}>{(word as any).emoji}</AppText>
                ) : (
                  <View style={s.wordCharBox}>
                    <AppText style={s.wordChar}>{word.character}</AppText>
                  </View>
                )}
                <AppText style={s.wordText}>{word.character}</AppText>
                <AppText style={s.wordJyut}>{word.jyutping}</AppText>
                <View style={s.pronRow}>
                  <PronButton
                    lang="cantonese"
                    size="sm"
                    onPress={() => playWord(word.character, 'cantonese')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  />
                  <PronButton
                    lang="mandarin"
                    size="sm"
                    onPress={() => playWord(word.character, 'mandarin')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 句子 Tab ── */}
        {activeTab === 'sentences' && (
          <View style={s.sentenceList}>
            {topic.words
              .filter(w => w.example_sentence)
              .map(word => (
                <View key={word.id} style={s.sentenceCard}>
                  <View style={s.sentenceLeft}>
                    <AppText style={s.sentenceChar}>{word.character}</AppText>
                  </View>
                  <View style={s.sentenceRight}>
                    <AppText style={s.sentenceText}>{word.example_sentence}</AppText>
                    <AppText style={s.sentenceJyut}>{word.jyutping}</AppText>
                  </View>
                  <View style={s.pronRow}>
                    <PronButton
                      lang="cantonese"
                      size="md"
                      onPress={() => playWord(word.character, 'cantonese')}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    />
                    <PronButton
                      lang="mandarin"
                      size="md"
                      onPress={() => playWord(word.character, 'mandarin')}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    />
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* ── 故事 Tab ── */}
        {activeTab === 'stories' && (
          <View style={s.storyList}>
            {stories.length === 0 ? (
              <View style={s.emptyBox}>
                <Image
                  source={require('../../assets/icons/icon_books.png')}
                  style={s.emptyIcon}
                  resizeMode="contain"
                />
                <AppText style={s.emptyText}>
                  {language === 'en' ? 'Stories coming soon!' : '故事即將推出！'}
                </AppText>
              </View>
            ) : (
              stories.map(story => (
                <TouchableOpacity
                  key={story.id}
                  style={s.storyCard}
                  onPress={() => (navigation as any).navigate('StoryDetail', { storyId: story.id })}
                  activeOpacity={0.85}
                >
                  <View style={[s.storyCover, { backgroundColor: story.cover_bg }]}>
                    <AppText style={s.storyCoverEmoji}>{story.cover_emoji}</AppText>
                  </View>
                  <View style={s.storyInfo}>
                    <AppText style={s.storyTitle}>{story.title_zh}</AppText>
                    <AppText style={s.storyDesc} numberOfLines={2}>{story.description_zh}</AppText>
                    <View style={s.storyMeta}>
                      <View style={s.levelBadge}>
                        <AppText style={s.levelText}>{story.level}</AppText>
                      </View>
                      <AppText style={s.durationText}>⏱ {story.duration_min} 分鐘</AppText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* Start learning CTA */}
      {activeTab === 'words' && (
        <View style={s.ctaBar}>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => {
              const first = topic.words[0];
              if (first) navigation.navigate('Lesson', { wordId: first.id, lessonId: first.id });
            }}
            activeOpacity={0.88}
          >
            <AppText style={s.ctaBtnText}>
              {language === 'en' ? 'Start Learning' : '開始學習'}
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.primaryBg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  headerCenter: {
    flex: 1, alignItems: 'center', gap: 4,
  },
  headerIcon: { width: 64, height: 64 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },

  tabBar: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8,
    backgroundColor: Colors.primaryBg,
  },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.white },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  /* Word grid */
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 4 },
  wordCard: {
    width: WORD_CARD_W, borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    paddingTop: 18, paddingBottom: 12, paddingHorizontal: 10,
    alignItems: 'center', gap: 4,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  wordEmoji:   { fontSize: 64 },
  wordCharBox: {
    width: WORD_CARD_W - 20, height: WORD_CARD_W - 20, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  wordChar:    { fontSize: 52, fontWeight: '800', color: Colors.text },
  wordText:    { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 4 },
  wordJyut:    { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.3 },
  speakerBtn:  { marginTop: 0 },
  pronRow:     { flexDirection: 'row', gap: 8, marginTop: 4 },

  /* Sentence list */
  sentenceList: { gap: 12, paddingTop: 4 },
  sentenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryBg, borderRadius: 14, padding: 14,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  sentenceLeft: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  sentenceChar:  { fontSize: 22, fontWeight: '700', color: Colors.primary },
  sentenceRight: { flex: 1 },
  sentenceText:  { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  sentenceJyut:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  /* Story list */
  storyList: { gap: 14, paddingTop: 4 },
  storyCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  storyCover: {
    width: 90, alignItems: 'center', justifyContent: 'center', padding: 10,
  },
  storyCoverEmoji: { fontSize: 44 },
  storyInfo: { flex: 1, padding: 14 },
  storyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  storyDesc:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  storyMeta:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  levelBadge: {
    backgroundColor: Colors.primaryBg, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.borderLight,
  },
  levelText:    { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  durationText: { fontSize: 11, color: Colors.textMuted },

  emptyBox:  { alignItems: 'center', paddingVertical: 48, gap: 16 },
  emptyIcon: { width: 120, height: 120 },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },

  /* CTA */
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    backgroundColor: Colors.primaryBg,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  ctaBtn: {
    backgroundColor: '#3730A3', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#1e1b5a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
