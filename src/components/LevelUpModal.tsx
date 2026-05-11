/**
 * LevelUpModal — 升級慶祝彈窗
 *
 * 當 addXP() 回傳 true 時顯示。
 * 動畫：scale + opacity 彈跳入場，3 秒後自動關閉。
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PlayerRank } from '../store/useProgressStore';

interface LevelUpModalProps {
  visible: boolean;
  newRank: PlayerRank | null;
  onClose: () => void;
}

export default function LevelUpModal({ visible, newRank, onClose }: LevelUpModalProps) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && newRank) {
      // 入場動畫
      scale.setValue(0.4);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 3 秒後自動關閉
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, newRank]);

  if (!newRank) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          {/* 光芒背景文字 */}
          <Text style={styles.burst}>✨ 升級啦！✨</Text>

          {/* 新等級徽章 */}
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>{newRank.emoji}</Text>
          </View>

          <Text style={styles.levelText}>Lv.{newRank.level}</Text>
          <Text style={styles.rankName}>{newRank.name}</Text>
          <Text style={styles.subtitle}>恭喜晉升新等級！</Text>

          <TouchableOpacity style={styles.btn} onPress={onClose} accessibilityLabel="繼續">
            <Text style={styles.btnText}>繼續 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 300,
    backgroundColor: '#FFFBEB',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  burst: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  rankBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 3,
    borderColor: '#FDE68A',
  },
  rankEmoji: { fontSize: 52 },
  levelText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  rankName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
  },
  btn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
});
