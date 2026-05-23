/**
 * LearnScreen — 學習主題瀏覽（學習 Tab）
 *
 * 顯示所有主題卡，點入 TopicDetailScreen
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Dimensions, Image,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '../store/useProgressStore';
import { Colors } from '../theme/colors';
import { TOPICS } from '../data/topics';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48 - 12) / 2;

type Props = { navigation: StackNavigationProp<RootStackParamList> };

export default function LearnScreen({ navigation }: Props) {
  const language = useProgressStore(s => s.language);

  const title = language === 'en' ? 'Learning Topics' :
                language === 'sc' ? '学习主题' : '學習主題';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <AppText style={s.pageTitle}>{title}</AppText>

        {/* Topic grid */}
        <View style={s.grid}>
          {TOPICS.map(topic => {
            const wordCount = topic.words.length;
            return (
              <TouchableOpacity
                key={topic.id}
                style={[s.card, { backgroundColor: topic.bgColor }]}
                onPress={() => (navigation as any).navigate('TopicDetail', { topicId: topic.id })}
                activeOpacity={0.82}
              >
                <Image source={topic.iconPng} style={s.topicIcon} resizeMode="contain" />
                <AppText style={s.cardName} numberOfLines={1}>
                  {language === 'en' ? topic.title_en :
                   language === 'sc' ? topic.title_sc : topic.title_zh}
                </AppText>
                <AppText style={s.cardCount}>
                  {wordCount} {language === 'en' ? 'words' : '個詞'}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Level map shortcut */}
        <TouchableOpacity
          style={s.mapBtn}
          onPress={() => (navigation as any).navigate('Map')}
          activeOpacity={0.85}
        >
          <Ionicons name="map" size={20} color={Colors.primary} />
          <AppText style={s.mapBtnText}>
            {language === 'en' ? 'Learning Map →' : '學習地圖 →'}
          </AppText>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.primaryBg },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  card: {
    width: CARD_W, borderRadius: 22,
    paddingVertical: 20, paddingHorizontal: 10,
    alignItems: 'center', gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.75)', borderLeftColor: 'rgba(255,255,255,0.75)',
    borderBottomColor: 'rgba(0,0,0,0.06)', borderRightColor: 'rgba(0,0,0,0.06)',
  },
  emoji:     { fontSize: 42 },
  topicIcon: { width: CARD_W - 20, height: CARD_W - 20 },
  cardName:  { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  cardCount: { fontSize: 12, color: Colors.textMuted },

  mapBtn: {
    marginTop: 28, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primaryBg, borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  mapBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
