/**
 * OnboardingScreen — 首次使用引導（卡通角色版）
 *
 * 流程（4 個步驟）：
 * 0. 歡迎畫面 — 蘿蔔仔跳躍
 * 1. 功能介紹 — 蘿蔔仔教學
 * 2. 輸入名字 — 湯圓仔揮手
 * 3. 準備好了 — 蘿蔔仔拿獎盃
 *
 * 完成後設定 onboardingDone = true，不再顯示此頁。
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 4;

// ── Character images ────────────────────────────────────────────────
const CHARS = {
  carrotJump:    require('../../assets/characters/char_carrot_jump.png'),
  carrotTeach:   require('../../assets/characters/char_carrot_teach.png'),
  carrotTrophy:  require('../../assets/characters/char_carrot_trophy.png'),
  carrotIdea:    require('../../assets/characters/char_carrot_idea.png'),
  bunWave:       require('../../assets/characters/char_bun_wave.png'),
  bunDance:      require('../../assets/characters/char_bun_dance.png'),
};

// ── Step 0: Welcome ─────────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={s.step}>
      <View style={s.charBox}>
        <Image source={CHARS.carrotJump} style={s.charImg} resizeMode="contain" />
      </View>
      <View style={s.textBlock}>
        <AppText style={s.stepTitle}>歡迎來到{'\n'}CantoKids！</AppText>
        <AppText style={s.stepDesc}>
          一個為小朋友設計的{'\n'}廣東話 & 繁體字學習 App
        </AppText>
      </View>
      <TouchableOpacity style={s.nextBtn} onPress={onNext} activeOpacity={0.85}>
        <AppText style={s.nextBtnText}>開始探索</AppText>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Step 1: Features ─────────────────────────────────────────────────
function StepFeatures({ onNext }: { onNext: () => void }) {
  const features = [
    { icon: '✍️', label: '筆順動畫練習' },
    { icon: '🔊', label: '廣東話發音' },
    { icon: '🎮', label: '互動測驗 & 闖關' },
    { icon: '🏅', label: '徽章 & 獎勵系統' },
  ];
  return (
    <View style={s.step}>
      <View style={s.charBox}>
        <Image source={CHARS.carrotTeach} style={s.charImg} resizeMode="contain" />
      </View>
      <View style={s.textBlock}>
        <AppText style={s.stepTitle}>一起學廣東話！</AppText>
        <AppText style={s.stepDesc}>蘿蔔仔陪你從幼苗成長到傳說</AppText>
      </View>
      <View style={s.featureGrid}>
        {features.map((f) => (
          <View key={f.label} style={s.featureChip}>
            <AppText style={s.featureIcon}>{f.icon}</AppText>
            <AppText style={s.featureLabel}>{f.label}</AppText>
          </View>
        ))}
      </View>
      <TouchableOpacity style={s.nextBtn} onPress={onNext} activeOpacity={0.85}>
        <AppText style={s.nextBtnText}>下一步</AppText>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Step 2: Name input ───────────────────────────────────────────────
function StepName({
  onNext,
  childName,
  setChildName,
  nameError,
  setNameError,
  isCurrent,
}: {
  onNext: () => void;
  childName: string;
  setChildName: (v: string) => void;
  nameError: string;
  setNameError: (v: string) => void;
  isCurrent: boolean;
}) {
  const inputRef = useRef<TextInput>(null);

  // 只有真正滑到這一步才 focus，不會在 Step 0 就彈鍵盤
  useEffect(() => {
    if (isCurrent) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    } else {
      inputRef.current?.blur();
    }
  }, [isCurrent]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.step}>
        <View style={s.charBoxSmall}>
          <Image source={CHARS.bunWave} style={s.charImgSmall} resizeMode="contain" />
        </View>
        <View style={s.textBlock}>
          <AppText style={s.stepTitle}>你叫什麼名字？</AppText>
          <AppText style={s.stepDesc}>湯圓仔想認識你！{'\n'}輸入小朋友的名字吧</AppText>
        </View>
        <TextInput
          ref={inputRef}
          style={[s.nameInput, nameError ? s.nameInputError : null]}
          placeholder="例如：小明"
          placeholderTextColor={Colors.textMuted}
          value={childName}
          onChangeText={(v) => {
            setChildName(v);
            setNameError('');
          }}
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={onNext}
          accessibilityLabel="小朋友名字輸入"
        />
        {!!nameError && <AppText style={s.errorText}>{nameError}</AppText>}
        <AppText style={s.nameHint}>（稍後可在家長控制台更改）</AppText>
        <TouchableOpacity
          style={[s.nextBtn, !childName.trim() && s.nextBtnDisabled]}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <AppText style={s.nextBtnText}>下一步</AppText>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ── Step 3: Ready ────────────────────────────────────────────────────
function StepReady({ name, onFinish }: { name: string; onFinish: () => void }) {
  return (
    <View style={s.step}>
      <View style={s.charBox}>
        <Image source={CHARS.carrotTrophy} style={s.charImg} resizeMode="contain" />
      </View>
      <View style={s.textBlock}>
        <AppText style={s.stepTitle}>
          {name ? `${name}，\n` : ''}準備好了！🎉
        </AppText>
        <AppText style={s.stepDesc}>
          從幼苗開始，每天學幾個字，{'\n'}慢慢成長為廣東話高手！
        </AppText>
      </View>
      <View style={s.tipBox}>
        <AppText style={s.tipItem}>💡 長按字卡可聆聽廣東話發音</AppText>
        <AppText style={s.tipItem}>🔥 每日學習維持連勝火焰</AppText>
        <AppText style={s.tipItem}>👨‍👩‍👧 家長可進入控制台查看進度</AppText>
      </View>
      <TouchableOpacity style={s.startBtn} onPress={onFinish} activeOpacity={0.85}>
        <AppText style={s.startBtnText}>開始學習！</AppText>
        <Ionicons name="rocket" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState('');
  const [nameError, setNameError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { setUser, completeOnboarding, startHatchlingChallenge } = useProgressStore();

  const goNext = () => {
    // Step 2 (name) validation
    if (step === 2) {
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

    Animated.timing(slideAnim, {
      toValue: -(step + 1) * SCREEN_W,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setStep((s) => s + 1));
  };

  const handleFinish = () => {
    completeOnboarding();
    startHatchlingChallenge(); // 開始7天孵蛋挑戰
    navigation.replace('MainTabs');
  };

  const renderDots = () => (
    <View style={s.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[s.dot, i === step && s.dotActive]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {renderDots()}

        <Animated.View
          style={[
            s.slideContainer,
            { transform: [{ translateX: slideAnim }], width: SCREEN_W * TOTAL_STEPS },
          ]}
        >
          <View style={[s.page, { width: SCREEN_W }]}>
            <StepWelcome onNext={goNext} />
          </View>
          <View style={[s.page, { width: SCREEN_W }]}>
            <StepFeatures onNext={goNext} />
          </View>
          <View style={[s.page, { width: SCREEN_W }]}>
            <StepName
              onNext={goNext}
              childName={childName}
              setChildName={setChildName}
              nameError={nameError}
              setNameError={setNameError}
              isCurrent={step === 2}
            />
          </View>
          <View style={[s.page, { width: SCREEN_W }]}>
            <StepReady name={childName.trim()} onFinish={handleFinish} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primaryBg },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 4,
  },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  dotActive: { backgroundColor: Colors.primary, width: 22, borderRadius: 4 },

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
    paddingHorizontal: 28,
    gap: 18,
  },

  // Character images
  charBox: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charImg: {
    width: 220,
    height: 220,
  },
  charBoxSmall: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charImgSmall: {
    width: 160,
    height: 160,
  },

  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 35,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  stepDesc: {
    fontSize: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Feature grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  featureIcon:  { fontSize: 22 },
  featureLabel: { fontSize: 18, fontWeight: '600', color: Colors.text },

  // Name input
  nameInput: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(180,175,155,0.5)', borderLeftColor: 'rgba(180,175,155,0.5)',
    borderBottomColor: 'rgba(255,255,255,0.9)', borderRightColor: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  nameInputError: { borderColor: '#EF4444' },
  errorText:   { fontSize: 16, color: '#EF4444' },
  nameHint:    { fontSize: 15, color: Colors.textMuted },

  // Tips box
  tipBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 16,
    padding: 16,
    alignSelf: 'stretch',
    gap: 10,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  tipItem: { fontSize: 18, color: Colors.textSecondary, lineHeight: 20 },

  // Buttons
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#8B6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { fontSize: 21, fontWeight: '700', color: '#fff' },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#7a3d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  startBtnText: { fontSize: 24, fontWeight: '800', color: '#fff' },
});
