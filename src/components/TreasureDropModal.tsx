/**
 * TreasureDropModal — 寶物掉落動畫彈窗
 *
 * 每件寶物卡片以 Animated.spring 逐一彈入（間距 200 ms）
 * 傳說 / 史詩等級有光暈邊框
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import AppText from './AppText';
import { Treasure, RARITY_CONFIG, getTreasureLocalized } from '../data/treasures';
import { useTranslation } from '../hooks/useTranslation';
import { useProgressStore } from '../store/useProgressStore';

interface TreasureDropModalProps {
  visible: boolean;
  treasures: Treasure[];
  onClose: () => void;
}

// ── 單張寶物卡片 ──────────────────────────────────────────────────────
interface CardProps {
  treasure: Treasure;
  delay: number;
  visible: boolean;
  rarityLabel: string;
  localizedName: string;
  localizedDesc: string;
}

function TreasureCard({ treasure, delay, visible, rarityLabel, localizedName, localizedDesc }: CardProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const config = RARITY_CONFIG[treasure.rarity];
  const hasGlow = treasure.rarity === 'legendary' || treasure.rarity === 'epic';

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      const timeout = setTimeout(() => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }).start();
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      scale.setValue(0);
    }
  }, [visible, delay]);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: config.bgColor, transform: [{ scale }] },
        hasGlow && {
          borderColor: config.glowColor,
          borderWidth: 2.5,
          shadowColor: config.glowColor,
          shadowOpacity: 0.55,
          shadowRadius: 10,
          elevation: 8,
        },
      ]}
    >
      <AppText style={styles.cardEmoji}>{treasure.emoji}</AppText>
      <View style={[styles.rarityBadge, { backgroundColor: config.color }]}>
        <AppText style={styles.rarityLabel}>{rarityLabel}</AppText>
      </View>
      <AppText style={[styles.cardName, { color: config.color }]}>{localizedName}</AppText>
      <AppText style={styles.cardDesc}>{localizedDesc}</AppText>
    </Animated.View>
  );
}

// ── 主彈窗 ────────────────────────────────────────────────────────────
export default function TreasureDropModal({
  visible,
  treasures,
  onClose,
}: TreasureDropModalProps) {
  const { t } = useTranslation();
  const language = useProgressStore((s) => s.language);

  // 標題淡入
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      titleOpacity.setValue(0);
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 標題 */}
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            {t('treasureDropTitle')}
          </Animated.Text>

          {/* 寶物卡片列表 */}
          <ScrollView
            contentContainerStyle={styles.cardsContainer}
            showsVerticalScrollIndicator={false}
          >
            {treasures.map((item, index) => {
              const { name: localizedName, description: localizedDesc } =
                getTreasureLocalized(item, language);
              const rarityLabel =
                item.rarity === 'common'    ? t('rarityCommon') :
                item.rarity === 'rare'      ? t('rarityRare') :
                item.rarity === 'epic'      ? t('rarityEpic') :
                t('rarityLegendary');
              return (
                <TreasureCard
                  key={item.id}
                  treasure={item}
                  delay={index * 200}
                  visible={visible}
                  rarityLabel={rarityLabel}
                  localizedName={localizedName}
                  localizedDesc={localizedDesc}
                />
              );
            })}
          </ScrollView>

          {/* 收集按鈕 */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel={t('treasureCollectA11y')}
          >
            <AppText style={styles.closeBtnText}>{t('treasureCollectBtn')}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1C1C2E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F59E0B',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  cardsContainer: {
    gap: 14,
    paddingBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  cardEmoji: {
    fontSize: 60,
    lineHeight: 72,
  },
  rarityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rarityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 52,
    paddingVertical: 16,
    borderRadius: 18,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
