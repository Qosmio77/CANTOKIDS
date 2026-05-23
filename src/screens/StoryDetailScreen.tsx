/**
 * StoryDetailScreen — 互動繪本閱讀器
 *
 * 功能：
 *   • 封面 / 故事簡介 / 生詞列表
 *   • 繪本模式：全屏翻頁，每段有場景插畫（emoji）+ 文字
 *   • 廣東話 TTS 朗讀（expo-speech，lang: yue-HK / zh-HK）
 *   • 每個漢字可單獨點擊播放發音（useAudio）
 *   • 粵拼顯示切換
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated, Dimensions, Modal,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { getStoryById } from '../data/stories';
import { useAudio } from '../hooks/useAudio';
import * as Speech from 'expo-speech';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width: SW, height: SH } = Dimensions.get('window');

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'StoryDetail'>;
};

// Scene emoji per-paragraph (derived from common characters in the text)
function sceneEmoji(zh: string, fallback: string): string {
  if (/月|夜|星|燈籠/.test(zh)) return '🌕';
  if (/書包|學校|課|老師/.test(zh)) return '🎒';
  if (/媽媽|爸爸|家人/.test(zh)) return '👨‍👩‍👧';
  if (/月餅|食/.test(zh)) return '🥮';
  if (/花園|草/.test(zh)) return '🌸';
  if (/小熊貓|熊/.test(zh)) return '🐼';
  if (/朋友|同學/.test(zh)) return '🤝';
  if (/開心|笑/.test(zh)) return '😊';
  if (/睡|覺/.test(zh)) return '😴';
  if (/雨|天氣/.test(zh)) return '🌧️';
  if (/太陽|日/.test(zh)) return '☀️';
  return fallback;
}

// ── Tappable char ─────────────────────────────────────────────────────────────
function TappableChar({
  char, onTap, highlight,
}: { char: string; onTap: (c: string) => void; highlight: boolean }) {
  const isCJK = /[一-鿿㐀-䶿]/.test(char);
  if (!isCJK) {
    return <AppText style={br.charPlain}>{char}</AppText>;
  }
  return (
    <TouchableOpacity onPress={() => onTap(char)} activeOpacity={0.6}>
      <AppText style={[br.charTap, highlight && br.charHighlight]}>{char}</AppText>
    </TouchableOpacity>
  );
}

// ── BookReader (full-screen modal) ────────────────────────────────────────────
interface BookReaderProps {
  story: NonNullable<ReturnType<typeof getStoryById>>;
  language: string;
  onClose: () => void;
}

function BookReader({ story, language, onClose }: BookReaderProps) {
  const { playWord } = useAudio();
  const [pageIdx, setPageIdx]         = useState(0);
  const [showJyut, setShowJyut]       = useState(true);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [tappedChar, setTappedChar]   = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const total = story.paragraphs.length;
  const para  = story.paragraphs[pageIdx];
  const isEn  = language === 'en';

  // Cleanup speech on unmount
  useEffect(() => () => { Speech.stop(); }, []);

  const fadeTo = useCallback((next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setPageIdx(next);
      setTappedChar(null);
      Speech.stop();
      setIsSpeaking(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const handleSpeech = useCallback(() => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(para.zh, {
      language: 'zh-HK',
      rate: 0.85,
      onDone:  () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [isSpeaking, para.zh]);

  const handleTap = useCallback((char: string) => {
    setTappedChar(char);
    playWord(char, 'cantonese');
    setTimeout(() => setTappedChar(null), 800);
  }, [playWord]);

  const scene = sceneEmoji(para.zh, story.cover_emoji);

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <SafeAreaView style={br.safe}>
        {/* Top bar */}
        <View style={br.topBar}>
          <TouchableOpacity style={br.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <AppText style={br.pageCounter}>{pageIdx + 1} / {total}</AppText>
          <TouchableOpacity
            style={[br.jyutBtn, showJyut && br.jyutBtnOn]}
            onPress={() => setShowJyut(v => !v)}
          >
            <AppText style={[br.jyutBtnText, showJyut && br.jyutBtnTextOn]}>拼</AppText>
          </TouchableOpacity>
        </View>

        {/* Progress strip */}
        <View style={br.progressStrip}>
          <View style={[br.progressFill, { width: `${((pageIdx + 1) / total) * 100}%` as any }]} />
        </View>

        {/* Page content */}
        <Animated.View style={[br.pageContent, { opacity: fadeAnim }]}>
          {/* Scene illustration */}
          <View style={[br.scene, { backgroundColor: story.cover_bg + '33' }]}>
            <AppText style={br.sceneEmoji}>{scene}</AppText>
          </View>

          {/* Text — tappable characters */}
          <View style={br.textCard}>
            <View style={br.charsRow}>
              {para.zh.split('').map((char, i) => (
                <TappableChar
                  key={i}
                  char={char}
                  onTap={handleTap}
                  highlight={char === tappedChar}
                />
              ))}
            </View>
            {showJyut && (
              <AppText style={br.jyutText}>{para.jyutping}</AppText>
            )}
          </View>
        </Animated.View>

        {/* Bottom controls */}
        <View style={br.bottomBar}>
          <TouchableOpacity
            style={[br.navBtn, pageIdx === 0 && br.navBtnDisabled]}
            onPress={() => pageIdx > 0 && fadeTo(pageIdx - 1)}
            disabled={pageIdx === 0}
          >
            <Ionicons name="chevron-back" size={22} color={pageIdx === 0 ? Colors.textMuted : Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={[br.speakBtn, isSpeaking && br.speakBtnActive]} onPress={handleSpeech}>
            <Ionicons name={isSpeaking ? 'stop' : 'volume-high'} size={24} color="#fff" />
            <AppText style={br.speakBtnText}>
              {isSpeaking ? (isEn ? 'Stop' : '停止') : (isEn ? 'Listen' : '聆聽')}
            </AppText>
          </TouchableOpacity>

          {pageIdx < total - 1 ? (
            <TouchableOpacity style={br.navBtn} onPress={() => fadeTo(pageIdx + 1)}>
              <Ionicons name="chevron-forward" size={22} color={Colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[br.navBtn, br.doneBtn]} onPress={onClose}>
              <Ionicons name="checkmark" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Hint */}
        <AppText style={br.hint}>
          {isEn ? '💡 Tap any character to hear it' : '💡 點擊漢字可聆聽發音'}
        </AppText>
      </SafeAreaView>
    </Modal>
  );
}

// ── StoryDetailScreen ─────────────────────────────────────────────────────────
export default function StoryDetailScreen({ navigation, route }: Props) {
  const { storyId } = route.params;
  const language = useProgressStore(s => s.language);
  const [showReader, setShowReader] = useState(false);

  const story = getStoryById(storyId);
  if (!story) return null;

  const isEn = language === 'en';

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <AppText style={s.headerTitle}>{isEn ? 'Story' : '故事繪本'}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Cover */}
        <View style={[s.cover, { backgroundColor: story.cover_bg }]}>
          <AppText style={s.coverEmoji}>{story.cover_emoji}</AppText>
          <View style={s.coverOverlay}>
            <AppText style={s.coverTitle}>
              {isEn ? story.title_en : story.title_zh}
            </AppText>
          </View>
          <View style={s.coverMeta}>
            <View style={s.metaChip}>
              <AppText style={s.metaChipText}>
                {isEn ? story.level_en : story.level}
              </AppText>
            </View>
            <AppText style={s.metaDur}>⏱ {story.duration_min} {isEn ? 'min' : '分鐘'}</AppText>
          </View>
        </View>

        {/* Description */}
        <View style={s.section}>
          <AppText style={s.sectionTitle}>{isEn ? 'About this story' : '故事簡介'}</AppText>
          <AppText style={s.descText}>{story.description_zh}</AppText>
        </View>

        {/* Vocab words */}
        <View style={s.section}>
          <AppText style={s.sectionTitle}>{isEn ? 'Words in this story' : '故事詞語'}</AppText>
          <View style={s.vocabRow}>
            {story.vocab_zh.map(word => (
              <View key={word} style={s.vocabChip}>
                <AppText style={s.vocabText}>{word}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Preview paragraphs */}
        <View style={s.section}>
          <AppText style={s.sectionTitle}>{isEn ? 'Story preview' : '故事預覽'}</AppText>
          {story.paragraphs.slice(0, 2).map((para, i) => (
            <View key={i} style={s.previewPara}>
              <AppText style={s.previewEmoji}>{sceneEmoji(para.zh, story.cover_emoji)}</AppText>
              <View style={{ flex: 1 }}>
                <AppText style={s.previewZh}>{para.zh}</AppText>
                <AppText style={s.previewJyut}>{para.jyutping}</AppText>
              </View>
            </View>
          ))}
          {story.paragraphs.length > 2 && (
            <AppText style={s.moreHint}>
              {isEn ? `+ ${story.paragraphs.length - 2} more pages…` : `還有 ${story.paragraphs.length - 2} 頁…`}
            </AppText>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={s.ctaBar}>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => setShowReader(true)}
          activeOpacity={0.88}
        >
          <Ionicons name="book" size={20} color="#fff" />
          <AppText style={s.ctaBtnText}>
            {isEn ? 'Read Story' : '開始閱讀'}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Book reader modal */}
      {showReader && (
        <BookReader
          story={story}
          language={language}
          onClose={() => setShowReader(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primaryBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { paddingBottom: 120 },
  cover: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 22,
    height: 220, justifyContent: 'flex-end', overflow: 'hidden', alignItems: 'center',
  },
  coverEmoji:   { fontSize: 90, position: 'absolute', top: 20 },
  coverOverlay: { width: '100%', padding: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
  coverTitle:   { fontSize: 20, fontWeight: '800', color: '#fff' },
  coverMeta:    { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip:     { backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metaChipText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  metaDur:      { fontSize: 11, color: '#fff', fontWeight: '600' },
  section:      { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  descText:     { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  vocabRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vocabChip:    {
    backgroundColor: Colors.primaryMuted, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: Colors.borderLight,
  },
  vocabText:   { fontSize: 15, fontWeight: '600', color: Colors.text },
  previewPara: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  previewEmoji: { fontSize: 30, width: 40 },
  previewZh:   { fontSize: 16, color: Colors.text, lineHeight: 24, fontWeight: '500' },
  previewJyut: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  moreHint:    { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    backgroundColor: Colors.primaryBg,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#3730A3',
    borderRadius: 16, paddingVertical: 16,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});

// Book reader styles
const br = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#1a1a2e' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  pageCounter: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  jyutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  jyutBtnOn:     { backgroundColor: Colors.primary },
  jyutBtnText:   { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  jyutBtnTextOn: { color: '#fff' },
  progressStrip: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill:  { height: 3, backgroundColor: Colors.primary },
  pageContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, gap: 24,
  },
  scene: {
    width: SW - 48, height: (SW - 48) * 0.45,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  sceneEmoji: { fontSize: 96 },
  textCard: {
    alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, padding: 20, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  charsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 2,
  },
  charTap:  {
    fontSize: 32, color: '#fff', fontWeight: '700',
    paddingHorizontal: 3, paddingVertical: 2,
  },
  charHighlight: {
    color: Colors.primary, backgroundColor: 'rgba(232,160,0,0.25)', borderRadius: 6,
  },
  charPlain: { fontSize: 32, color: 'rgba(255,255,255,0.5)' },
  jyutText:  { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingBottom: 12, paddingTop: 6,
  },
  navBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  doneBtn: { backgroundColor: 'rgba(232,160,0,0.25)' },
  speakBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3730A3', borderRadius: 28,
    paddingVertical: 12, paddingHorizontal: 28,
    shadowColor: '#3730A3', shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  speakBtnActive: { backgroundColor: '#EF4444' },
  speakBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  hint: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', paddingBottom: 16,
  },
});
