/**
 * HanziChar — 靜態顯示漢字，使用與 HanziWriter 完全相同的 SVG 路徑數據
 *
 * 字形 100% 與寫字練習一致（同一份筆畫數據）
 * 完全離線可用，無需 WebView
 *
 * 使用方式：
 *   <HanziChar character="山" size={120} color="#1E40AF" />
 */

import React from 'react';
import { View, Platform } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import hanziData from '../data/hanziData.json';

interface HanziCharProps {
  character: string;
  size?: number;
  color?: string;
  outlineColor?: string;
  showOutline?: boolean;
  backgroundColor?: string;
}

// HanziWriter 使用 1024×1024 grid，Y 軸反轉
const HANZI_GRID = 1024;

export default function HanziChar({
  character,
  size = 120,
  color = '#1E40AF',
  outlineColor = '#BFDBFE',
  showOutline = false,
  backgroundColor,
}: HanziCharProps) {
  const data = (hanziData as Record<string, { strokes: string[]; medians: any[] }>)[character];

  if (!data || !data.strokes?.length) {
    // Fallback: 用 NotoSerifTC 字型（應該唔會觸發，因為數據已預載）
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        {/* empty fallback */}
      </View>
    );
  }

  // 加 padding 令字居中，與 HanziWriter 自身的 padding 一致（約 8%）
  const padding = Math.round(size * 0.08);
  const drawSize = size - 2 * padding;
  const scale = drawSize / HANZI_GRID;

  return (
    <View style={{ width: size, height: size, backgroundColor }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* HanziWriter 坐標系：原點在左下角，Y 向上。SVG 原點在左上角，Y 向下。
            Transform: translate to (padding, size-padding)，加 padding 令字四邊留空 */}
        <G transform={`translate(${padding}, ${size - padding}) scale(${scale}, -${scale})`}>
          {/* 輪廓層（可選） */}
          {showOutline && data.strokes.map((d, i) => (
            <Path
              key={`outline-${i}`}
              d={d}
              fill={outlineColor}
            />
          ))}
          {/* 字色層 */}
          {data.strokes.map((d, i) => (
            <Path
              key={`stroke-${i}`}
              d={d}
              fill={color}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
