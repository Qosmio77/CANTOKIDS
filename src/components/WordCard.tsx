/**
 * WordCard — 會呼吸的字卡 (Phase 2) + 感官回饋 (Phase 4)
 *
 * 視覺層次（由上至下）：
 *   ① Emoji 圖示    — 認知橋樑，兒童立即聯想
 *   ② 大漢字        — 核心學習目標，最突出
 *   ③ Jyutping      — 粵語拼音，次要
 *   ④ English       — 英文解釋，底部
 *
 * Phase 2 — 會呼吸動畫：
 *   - onPressIn  → Spring 放大至 1.07（Native Driver，GPU 渲染）
 *   - onPressOut → Spring 彈回 1.0
 *
 * Phase 4 — 感官回饋：
 *   - 點按時觸發 expo-haptics Light impact（原生震動）
 *   - 點按時播放漣漪（Ripple）動畫：擴散圓形 + 淡出
 *   - 左上角 🔊 喇叭按鈕：點按播放粵語發音
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import AppText from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Word } from '../types/word';

interface WordCardProps {
  word: Word;
  isLearned: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** 點按喇叭圖示時播放發音 */
  onAudioPress?: () => void;
}

export default function WordCard({
  word, isLearned, onPress, onLongPress, onAudioPress,
}: WordCardProps) {
  const scale          = useRef(new Animated.Value(1)).current;
  const rippleScale    = useRef(new Animated.Value(0)).current;
  const rippleOpacity  = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  // ── 漣漪動畫 ─────────────────────────────────────────────────────
  const triggerRipple = useCallback(() => {
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.28);
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [rippleScale, rippleOpacity]);

  // ── Press-in: 放大 + 震動 + 漣漪 ────────────────────────────────
  const handlePressIn = useCallback(() => {
    setPressed(true);

    // 輕微震動（iOS / Android，Web 靜默忽略）
    // 使用 RN 內建 Vibration（無需額外套件），30ms 模擬 Light Impact
    if (Platform.OS !== 'web') {
      Vibration.vibrate(30);
    }

    triggerRipple();

    Animated.spring(scale, {
      toValue: 1.07,
      friction: 3,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [scale, triggerRipple]);

  // ── Press-out: 彈回 ──────────────────────────────────────────────
  const handlePressOut = useCallback(() => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1.0,
      friction: 5,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  // ── 英文意思：只取 "/" 前的主要單詞，首字母大寫 ─────────────────
  const primaryMeaning = word.meaning_en.split('/')[0].trim();
  const displayEnglish =
    primaryMeaning.charAt(0).toUpperCase() + primaryMeaning.slice(1);

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={
        `${word.character}, ${displayEnglish}. Tap speaker to hear pronunciation.`
      }
    >
      <Animated.View
        style={[
          styles.card,
          isLearned  && styles.cardLearned,
          pressed    && styles.cardPressed,
          { transform: [{ scale }] },
        ]}
      >
        {/* 漣漪疊加層 — pointerEvents none，不攔截觸控 */}
        <Animated.View
          style={[
            styles.ripple,
            {
              opacity:   rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
          pointerEvents="none"
        />

        {/* ① Emoji */}
        {word.emoji ? (
          <AppText style={styles.emoji}>{word.emoji}</AppText>
        ) : (
          <View style={styles.emojiPlaceholder} />
        )}

        {/* ② 大漢字 */}
        <AppText style={[styles.character, isLearned && styles.characterLearned]}>
          {word.character}
        </AppText>

        {/* ③ Jyutping */}
        <AppText style={styles.jyutping}>{word.jyutping}</AppText>

        {/* ④ English */}
        <AppText style={styles.english} numberOfLines={1}>
          {displayEnglish}
        </AppText>

        {/* 🔊 喇叭按鈕 — 左上角，點按播放粵語發音 */}
        {onAudioPress && (
          <TouchableOpacity
            style={styles.speakerBtn}
            onPress={onAudioPress}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel={`Play ${word.character} in Cantonese`}
          >
            <Ionicons name="volume-medium" size={13} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* 學完 ✓ 徽章 — 右上角 */}
        {isLearned && (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={Colors.success}
            style={styles.checkmark}
          />
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    // 必須 overflow:hidden 才能讓漣漪圓形裁切在卡片內
    overflow: 'hidden',
  },

  cardPressed: {
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  cardLearned: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },

  // ── Phase 4: 漣漪 ───────────────────────────────────────────────
  ripple: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,   // 靛藍色漣漪
    alignSelf: 'center',
    top: '20%',
    opacity: 0,
  },

  // ── Phase 4: 喇叭按鈕 ───────────────────────────────────────────
  speakerBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 8,
    padding: 3,
  },

  emoji: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  emojiPlaceholder: {
    height: 32,
  },

  character: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 36,
  },
  characterLearned: {
    color: '#065F46',
  },

  jyutping: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },

  english: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.3,
  },

  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
