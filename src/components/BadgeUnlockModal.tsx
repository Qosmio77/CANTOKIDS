/**
 * BadgeUnlockModal — 徽章解鎖慶祝彈窗
 *
 * 當玩家新解鎖徽章時自動彈出：
 * - 彈簧縮放動畫進場
 * - 3 秒後自動關閉（或點擊關閉）
 * - 支援同時解鎖多個徽章（逐個顯示）
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AppText from './AppText';
import { Colors } from '../theme/colors';
import { Badge, getBadgeLocalized } from '../services/badgeService';
import { useTranslation } from '../hooks/useTranslation';
import { useProgressStore } from '../store/useProgressStore';
import { playSFX } from '../services/sfxService';

interface BadgeUnlockModalProps {
  badges: Badge[];          // 本次新解鎖的徽章列表
  visible: boolean;
  onClose: () => void;
}

export default function BadgeUnlockModal({
  badges,
  visible,
  onClose,
}: BadgeUnlockModalProps) {
  const { t } = useTranslation();
  const language = useProgressStore((s) => s.language);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnimIn = useCallback(() => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  useEffect(() => {
    if (visible && badges.length > 0) {
      playSFX('levelup');
      startAnimIn();
      autoCloseTimer.current = setTimeout(onClose, 3500);
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [visible, badges.length, startAnimIn, onClose]);

  if (!visible || badges.length === 0) return null;

  // 只顯示第一個（若同時解鎖多個，關閉後父元件應繼續顯示下一個）
  const badge = badges[0];
  const { name, description } = getBadgeLocalized(badge, language);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel={t('badgeModalA11yClose')}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 光暈裝飾 */}
          <View style={styles.glow} />

          {/* 標題 */}
          <AppText style={styles.headline}>{t('badgeUnlockHeadline')}</AppText>

          {/* 徽章主體 */}
          <View style={styles.badgeCircle}>
            <AppText style={styles.badgeEmoji}>{badge.emoji}</AppText>
          </View>

          <AppText style={styles.badgeName}>{name}</AppText>
          <AppText style={styles.badgeDesc}>{description}</AppText>

          {/* 多個徽章時顯示計數 */}
          {badges.length > 1 && (
            <AppText style={styles.moreHint}>
              {t('badgeMoreHint').replace('{n}', String(badges.length - 1))}
            </AppText>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel={t('confirm')}
          >
            <AppText style={styles.closeBtnText}>{t('badgeModalClose')}</AppText>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
  },
  headline: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  badgeCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    marginVertical: 4,
  },
  badgeEmoji: { fontSize: 56 },
  badgeName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  moreHint: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
});
