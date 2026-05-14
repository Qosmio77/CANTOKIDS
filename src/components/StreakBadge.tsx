/**
 * StreakBadge — 連勝火焰脈動徽章 (Phase 5)
 *
 * 將連勝徽章獨立成元件有兩個好處：
 *   1. 動畫狀態（flameScale）封裝在此，不污染 HomeScreen 的 state
 *   2. Animated.loop 的 cleanup（stop）在 useEffect return 中自動執行，
 *      避免元件卸載後仍在背景跑動畫的記憶體洩漏
 *
 * 動畫邏輯：
 *   Animated.loop( sequence([
 *     timing scale 1.0 → 1.22  (700ms, easeIn),   ← 火焰「膨脹」
 *     timing scale 1.22 → 1.0  (700ms, easeOut),  ← 火焰「收縮」
 *   ]))
 *
 *   • useNativeDriver: true → 整條動畫在 GPU / UI thread，不佔 JS thread
 *   • streakDays <= 0 時直接返回 null，動畫不啟動
 *   • 週期 ~1.4s — 與正常呼吸頻率接近，視覺上舒適而不焦慮
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface StreakBadgeProps {
  /** 連勝天數；0 或負數時元件不渲染 */
  streakDays: number;
}

export default function StreakBadge({ streakDays }: StreakBadgeProps) {
  // Native driver 動畫值：只控制 transform.scale，符合 useNativeDriver 限制
  const flameScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streakDays <= 0) return;

    // ── 連續呼吸脈動 ──────────────────────────────────────────────
    // sequence 確保放大與縮小依序進行；loop 讓動畫無限重複
    const pulse = Animated.loop(
      Animated.sequence([
        // 膨脹：scale 1.0 → 1.22，稍快上升（火焰感）
        Animated.timing(flameScale, {
          toValue: 1.22,
          duration: 700,
          useNativeDriver: true,
        }),
        // 收縮：scale 1.22 → 1.0，稍慢下降（呼吸感）
        Animated.timing(flameScale, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    // 元件卸載時停止，防止動畫洩漏
    return () => pulse.stop();
  }, [streakDays, flameScale]);

  if (streakDays <= 0) return null;

  return (
    // 以 Animated.View 包裝整個徽章，讓脈動效果包含圖示 + 數字
    <Animated.View
      style={[
        styles.badge,
        { transform: [{ scale: flameScale }] },
      ]}
    >
      <Ionicons name="flame" size={16} color={Colors.streak} />
      <Text style={styles.count}>{streakDays}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    // 柔和粉紅背景（Phase 5: soft pastel）
    backgroundColor: Colors.streakBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.streak,
  },
});
