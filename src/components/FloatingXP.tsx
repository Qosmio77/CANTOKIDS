/**
 * FloatingXP — 浮動 XP 獎勵動畫
 *
 * 當使用者完成一張字卡/一課時，顯示「+10 XP ⚡」向上飄起再淡出。
 *
 * 用法：
 *   const [showXP, setShowXP] = useState(false);
 *   const [xpGained, setXpGained] = useState(0);
 *   ...
 *   <FloatingXP amount={xpGained} visible={showXP} onDone={() => setShowXP(false)} />
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';

interface FloatingXPProps {
  /** XP 數量，顯示為「+{amount} XP」 */
  amount: number;
  /** 為 true 時觸發動畫 */
  visible: boolean;
  /** 動畫結束後呼叫，用來重置 visible */
  onDone?: () => void;
}

export default function FloatingXP({ amount, visible, onDone }: FloatingXPProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;

    // 重置初始值
    translateY.setValue(0);
    opacity.setValue(0);
    scale.setValue(0.6);

    Animated.parallel([
      // 向上飄
      Animated.timing(translateY, {
        toValue: -72,
        duration: 1100,
        useNativeDriver: true,
      }),
      // 先彈出再淡出
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 250,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(scale, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        // 快速淡入
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        // 停留後淡出
        Animated.delay(600),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone?.());
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    // absoluteFillObject overlay：充滿父容器，居中顯示浮動 chip
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.chip,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Text style={styles.text}>+{amount} XP ⚡</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 覆蓋整個父容器，水平居中，垂直底部對齊（讓 chip 從底部向上飄）
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    zIndex: 999,
  },
  chip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    // 金色光暈
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
});
