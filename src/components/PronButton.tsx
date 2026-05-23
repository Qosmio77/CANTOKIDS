/**
 * PronButton — 發音按鈕
 *
 * 自動根據 app 語言顯示：
 *   繁體：粵 / 普
 *   簡體：粤 / 普
 *   English：Canto / Mand.
 *
 * 右邊固定顯示音量符號 🔊
 * 單字 → 圓形；多字 → 膠囊形（自動判斷）
 * size: 'sm' (字卡) | 'md' (句子) | 'lg' (課室)
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { useTranslation } from '../hooks/useTranslation';

type Lang = 'cantonese' | 'mandarin';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  lang: Lang;
  onPress: () => void;
  size?: Size;
  style?: ViewStyle;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

const COLOR: Record<Lang, { bg: string; color: string }> = {
  cantonese: { bg: '#DBEAFE', color: '#1D4ED8' },
  mandarin:  { bg: '#EDE9FE', color: '#7C3AED' },
};

const HEIGHT:      Record<Size, number> = { sm: 42, md: 52, lg: 64 };
const FONT_SINGLE: Record<Size, number> = { sm: 20, md: 26, lg: 32 };
const FONT_MULTI:  Record<Size, number> = { sm: 12, md: 14, lg: 17 };
const ICON_SIZE:   Record<Size, number> = { sm: 11, md: 14, lg: 17 };
// 膠囊的左右 padding
const PAD_MULTI:   Record<Size, number> = { sm: 10, md: 14, lg: 18 };
// 單字圓形的左右 padding（為 icon 留空間）
const PAD_SINGLE:  Record<Size, number> = { sm: 6,  md: 8,  lg: 10 };
// 字 與 icon 的間距
const GAP:         Record<Size, number> = { sm: 2,  md: 3,  lg: 4  };

export default function PronButton({ lang, onPress, size = 'md', style, hitSlop }: Props) {
  const { t } = useTranslation();
  const label    = lang === 'cantonese' ? t('lessonCantonese') : t('lessonMandarin');
  const { bg, color } = COLOR[lang];

  const h        = HEIGHT[size];
  const isMulti  = label.length > 1;
  const fontSize = isMulti ? FONT_MULTI[size] : FONT_SINGLE[size];
  const iconSize = ICON_SIZE[size];
  const px       = isMulti ? PAD_MULTI[size] : PAD_SINGLE[size];
  const gap      = GAP[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      hitSlop={hitSlop}
      style={[
        s.base,
        {
          height: h,
          minWidth: h,
          paddingHorizontal: px,
          backgroundColor: bg,
          gap,
        },
        style,
      ]}
    >
      <AppText style={[s.label, { color, fontSize }]}>
        {label}
      </AppText>
      <Ionicons name="volume-medium" size={iconSize} color={color} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    letterSpacing: -0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
