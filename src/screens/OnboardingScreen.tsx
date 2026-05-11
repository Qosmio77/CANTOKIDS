/**
 * OnboardingScreen — 首次使用引導
 *
 * 流程（3 個步驟）：
 * 1. 歡迎畫面 + App 介紹
 * 2. 輸入孩子名字
 * 3. 準備好了！
 *
 * 完成後設定 onboardingDone = true，不再顯示此頁。
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 3;

interface StepProps {
  onNext: () => void;
}

// 步驟 1: 歡迎
function StepWelcome({ onNext }: StepProps) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🎉</Text>
      <Text style={styles.stepTitle}>歡迎來到 CantoKids！</Text>
      <Text style={styles.stepDesc}>
        一個為小朋友設計的廣東話 & 繁體字學習應用程式。{'\n\n'}
        透過筆順練習、聆聽、測驗{'\n'}
        讓學習漢字變得有趣！
      </Text>
      <View style={styles.featureList}>
        {['✍️  筆順動畫練習', '🔊  廣東話發音', '🎮  互動測驗', '🏅  徽章獎勵'].map((f) => (
          <Text key={f} style={styles.featureItem}>{f}</Text>
        ))}
      </View>
      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>開始設定</Text>
        <Ionicons name="arrow-forward" size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// 步驟 3: 完成（修復 F-5: 移除死碼 StepName 組件）
function StepReady({ name, onFinish }: { name: string; onFinish: () => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🌟</Text>
      <Text style={styles.stepTitle}>
        {name ? `${name}，` : ''}準備好了！
      </Text>
      <Text style={styles.stepDesc}>
        從幼苗級開始，{'\n'}每天學幾個漢字，{'\n'}慢慢成長為廣東話高手！
      </Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 使用貼士</Text>
        <Text style={styles.tipItem}>• 長按字卡可聆聽廣東話發音</Text>
        <Text style={styles.tipItem}>• 每日學習維持連勝火焰 🔥</Text>
        <Text style={styles.tipItem}>• 家長可進入控制台查看進度</Text>
      </View>
      <TouchableOpacity style={styles.nextBtn} onPress={onFinish}>
        <Text style={styles.nextBtnText}>開始學習！</Text>
        <Ionicons name="rocket" size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState('');
  const [nameError, setNameError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { setUser, completeOnboarding } = useProgressStore();

  const goNext = () => {
    // 步驟 1 → 2 驗證名字
    if (step === 1) {
      const trimmed = childName.trim();
      if (!trimmed) {
        setNameError('請輸入小朋友的名字');
        return;
      }
      if (trimmed.length > 10) {
        setNameError('名字最多 10 個字');
        return;
      }
      setUser('local-user', trimmed);
    }

    // 動畫切換
    Animated.timing(slideAnim, {
      toValue: -(step + 1) * SCREEN_W,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setStep((s) => s + 1);
    });
  };

  const handleFinish = () => {
    completeOnboarding();
    navigation.replace('MainTabs');
  };

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderDots()}

      {/* 滑動容器 */}
      <Animated.View
        style={[
          styles.slideContainer,
          { transform: [{ translateX: slideAnim }], width: SCREEN_W * TOTAL_STEPS },
        ]}
      >
        {/* Step 0: 歡迎 */}
        <View style={[styles.page, { width: SCREEN_W }]}>
          <StepWelcome onNext={goNext} />
        </View>

        {/* Step 1: 輸入名字 */}
        <View style={[styles.page, { width: SCREEN_W }]}>
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>👧</Text>
            <Text style={styles.stepTitle}>你叫什麼名字？</Text>
            <Text style={styles.stepDesc}>輸入小朋友的名字，{'\n'}讓 App 更個人化！</Text>
            <TextInput
              style={[styles.nameInput, nameError ? styles.nameInputError : null]}
              placeholder="例如：小明"
              placeholderTextColor={Colors.textMuted}
              value={childName}
              onChangeText={(t) => {
                setChildName(t);
                setNameError('');
              }}
              maxLength={10}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={goNext}
              accessibilityLabel="小朋友名字輸入"
            />
            {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
            <Text style={styles.nameHint}>（稍後可在家長控制台更改）</Text>
            <TouchableOpacity
              style={[styles.nextBtn, !childName.trim() && styles.nextBtnDisabled]}
              onPress={goNext}
            >
              <Text style={styles.nextBtnText}>下一步</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2: 完成 */}
        <View style={[styles.page, { width: SCREEN_W }]}>
          <StepReady name={childName.trim()} onFinish={handleFinish} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryLight,
  },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  slideContainer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  page: { flex: 1, justifyContent: 'center' },
  step: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  stepEmoji: { fontSize: 72 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  stepDesc: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  featureList: { gap: 10, alignSelf: 'stretch', paddingLeft: 16 },
  featureItem: { fontSize: 16, color: Colors.text },
  tipBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignSelf: 'stretch',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  tipItem: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  nameInput: {
    alignSelf: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    textAlign: 'center',
  },
  nameInputError: { borderColor: Colors.error },
  errorText: { fontSize: 13, color: Colors.error },
  nameHint: { fontSize: 12, color: Colors.textMuted },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: Colors.white },
});
