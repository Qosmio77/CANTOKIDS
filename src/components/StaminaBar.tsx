/**
 * StaminaBar — 體力顯示元件
 *
 * 以愛心表情符號顯示目前體力值。
 * 已滿 = ❤️，已耗盡 = 🖤
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppText from './AppText';
interface StaminaBarProps {
  stamina: number;
  maxStamina?: number;
  /** 'sm' = 16pt (用於 header)，'md' = 22pt（預設），'lg' = 28pt */
  size?: 'sm' | 'md' | 'lg';
}

export default function StaminaBar({
  stamina,
  maxStamina = 5,
  size = 'md',
}: StaminaBarProps) {
  const fontSize = size === 'sm' ? 15 : size === 'lg' ? 28 : 22;

  return (
    <View style={styles.row}>
      {Array.from({ length: maxStamina }).map((_, i) => (
        <AppText key={i} style={{ fontSize, lineHeight: fontSize + 4 }}>
          {i < stamina ? '❤️' : '🖤'}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
