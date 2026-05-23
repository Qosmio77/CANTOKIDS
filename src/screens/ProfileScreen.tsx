/**
 * ProfileScreen — 「我的」Tab
 *
 * 顯示：用戶資料、學習統計、徽章入口、設定入口、家長控制台
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Image,
} from 'react-native';
import AppText from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore, getRankByXP, getRankName } from '../store/useProgressStore';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: StackNavigationProp<RootStackParamList> };

export default function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const childName  = useProgressStore(s => s.displayName);
  const totalStars = useProgressStore(s => s.totalStars);
  const streakDays = useProgressStore(s => s.streakDays);
  const playerXP   = useProgressStore(s => s.playerXP);
  const wordProgress = useProgressStore(s => s.wordProgress);
  const language   = useProgressStore(s => s.language);

  const [stars, setStars] = useState(totalStars);

  useFocusEffect(useCallback(() => {
    const st = useProgressStore.getState();
    setStars(st.totalStars);
  }, []));

  const rank = getRankByXP(playerXP);
  const rankName = getRankName(rank, language);
  const learnedCount = Object.values(wordProgress).filter(p => p?.learned).length;
  const displayName = childName || (language === 'en' ? 'Friend' : '小朋友');

  const MENU_ITEMS = [
    {
      iconPng: require('../../assets/icons/icon_trophy.png'),
      label: language === 'en' ? 'My Badges' : '我的徽章',
      onPress: () => navigation.navigate('Badges'),
    },
    {
      iconPng: require('../../assets/icons/icon_star.png'),
      label: language === 'en' ? 'Treasure Box' : '寶物庫',
      onPress: () => navigation.navigate('Treasure'),
    },
    {
      iconPng: require('../../assets/icons/icon_settings.png'),
      label: language === 'en' ? 'Settings' : '設定',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      iconPng: require('../../assets/icons/icon_chart.png'),
      label: language === 'en' ? 'Parent Dashboard' : '家長控制台',
      onPress: () => navigation.navigate('ParentLogin'),
    },
    {
      iconPng: require('../../assets/icons/icon_home.png'),
      label: language === 'en' ? 'Preview Intro' : '預覽介紹頁面',
      onPress: () => navigation.navigate('Onboarding'),
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Image
              source={require('../../assets/icons/icon_panda.png')}
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
            />
          </View>
          <AppText style={s.name}>{displayName}</AppText>
          <View style={s.rankBadge}>
            <AppText style={s.rankText}>{rankName}</AppText>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="star" size={22} color="#F59E0B" />
            <AppText style={s.statNum}>{stars}</AppText>
            <AppText style={s.statLabel}>{language === 'en' ? 'Stars' : '星星'}</AppText>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Ionicons name="flame" size={22} color="#F97316" />
            <AppText style={s.statNum}>{streakDays}</AppText>
            <AppText style={s.statLabel}>{language === 'en' ? 'Streak' : '連勝'}</AppText>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Ionicons name="book" size={22} color={Colors.primary} />
            <AppText style={s.statNum}>{learnedCount}</AppText>
            <AppText style={s.statLabel}>{language === 'en' ? 'Learned' : '已學'}</AppText>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Ionicons name="trending-up" size={22} color="#6366F1" />
            <AppText style={s.statNum}>{playerXP}</AppText>
            <AppText style={s.statLabel}>XP</AppText>
          </View>
        </View>

        {/* Menu items */}
        <View style={s.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuItem, idx < MENU_ITEMS.length - 1 && s.menuItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Image source={item.iconPng} style={s.menuIcon} resizeMode="contain" />
              <AppText style={s.menuLabel}>{item.label}</AppText>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.primaryBg },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  avatarEmoji: { fontSize: 50 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  rankBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12,
    shadowColor: '#8B6000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  rankText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.primaryBg,
    borderRadius: 18, padding: 16, marginBottom: 20,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  statBox:     { flex: 1, alignItems: 'center', gap: 4 },
  statNum:     { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel:   { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },

  menuCard: {
    backgroundColor: Colors.primaryBg, borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingVertical: 20,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
  menuIcon:  { width: 52, height: 52 },
});
