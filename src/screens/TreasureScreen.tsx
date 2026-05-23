/**
 * TreasureScreen — 寶物庫（收藏目錄）
 *
 * 展示所有寶物的 2 欄格子：
 *  - 已擁有：全彩顯示 emoji、名稱、稀有度標籤、數量（>1 時）
 *  - 未擁有：灰階顯示「？？？」佔位
 * 頂部有稀有度篩選頁籤
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { TREASURES, RARITY_CONFIG, Rarity, getTreasureLocalized } from '../data/treasures';
import { useProgressStore } from '../store/useProgressStore';
import { useTranslation } from '../hooks/useTranslation';
import { Colors } from '../theme/colors';

type FilterTab = 'all' | Rarity;

export default function TreasureScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const treasures = useProgressStore((s) => s.treasures);
  const language  = useProgressStore((s) => s.language);
  const { t } = useTranslation();

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: t('treasureAll') },
    { key: 'common',    label: t('rarityCommon') },
    { key: 'rare',      label: t('rarityRare') },
    { key: 'epic',      label: t('rarityEpic') },
    { key: 'legendary', label: t('rarityLegendary') },
  ];

  const totalOwned = Object.values(treasures).filter((c) => c > 0).length;
  const totalTreasures = TREASURES.length;

  const filtered =
    activeTab === 'all'
      ? TREASURES
      : TREASURES.filter((t) => t.rarity === activeTab);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 標題列 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('back')}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{t('treasureVaultTitle')}</AppText>
        <View style={styles.headerRight} />
      </View>

      {/* 已收集計數 */}
      <AppText style={styles.collectedCount}>
        {t('treasureCollectedCount')
          .replace('{n}', String(totalOwned))
          .replace('{total}', String(totalTreasures))}
      </AppText>

      {/* 稀有度篩選頁籤 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const tabColor =
            tab.key === 'all'
              ? Colors.primary
              : RARITY_CONFIG[tab.key as Rarity].color;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && { backgroundColor: tabColor, borderColor: tabColor },
              ]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={t('treasureFilterA11y').replace('{label}', tab.label)}
            >
              <AppText
                style={[
                  styles.tabLabel,
                  { color: isActive ? '#fff' : Colors.textSecondary },
                ]}
              >
                {tab.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 寶物格子 */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <View style={styles.grid}>
          {filtered.map((treasure) => {
            const count = treasures[treasure.id] ?? 0;
            const owned = count > 0;
            const config = RARITY_CONFIG[treasure.rarity];
            const hasGlow =
              owned &&
              (treasure.rarity === 'legendary' || treasure.rarity === 'epic');
            const { name: treasureName } = getTreasureLocalized(treasure, language);
            const rarityLabel =
              treasure.rarity === 'common'    ? t('rarityCommon') :
              treasure.rarity === 'rare'      ? t('rarityRare') :
              treasure.rarity === 'epic'      ? t('rarityEpic') :
              t('rarityLegendary');

            return (
              <View
                key={treasure.id}
                style={[
                  styles.cell,
                  owned
                    ? { backgroundColor: config.bgColor }
                    : styles.cellUnowned,
                  hasGlow && {
                    borderColor: config.glowColor,
                    borderWidth: 2,
                    shadowColor: config.glowColor,
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                ]}
              >
                {/* 數量角標 */}
                {owned && count > 1 && (
                  <View style={styles.countBadge}>
                    <AppText style={styles.countBadgeText}>×{count}</AppText>
                  </View>
                )}

                {/* Emoji */}
                <AppText
                  style={[
                    styles.cellEmoji,
                    !owned && styles.cellEmojiUnowned,
                  ]}
                >
                  {treasure.emoji}
                </AppText>

                {/* 名稱 */}
                <AppText
                  style={[
                    styles.cellName,
                    owned
                      ? { color: config.color }
                      : styles.cellNameUnowned,
                  ]}
                  numberOfLines={1}
                >
                  {owned ? treasureName : t('treasureUnknown')}
                </AppText>

                {/* 稀有度標籤 */}
                {owned && (
                  <View
                    style={[
                      styles.rarityPill,
                      { backgroundColor: config.color },
                    ]}
                  >
                    <AppText style={styles.rarityPillText}>{rarityLabel}</AppText>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  headerRight: { width: 34 }, // 平衡返回按鈕

  collectedCount: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },

  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabLabel: { fontSize: 13, fontWeight: '700' },

  gridContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },

  cell: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  cellUnowned: { backgroundColor: '#F3F4F6' },

  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  cellEmoji: { fontSize: 40, lineHeight: 48 },
  cellEmojiUnowned: { opacity: 0.25 },

  cellName: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  cellNameUnowned: { color: Colors.textMuted, fontSize: 15, fontWeight: '700' },

  rarityPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rarityPillText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
