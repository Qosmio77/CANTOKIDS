/**
 * ParentLoginScreen — 家長 PIN 驗證 / 設定頁
 *
 * 流程：
 * 1. 首次進入（無 PIN）→ 要求設定 4 位數 PIN（輸入兩次確認）
 * 2. 已有 PIN → 驗證 PIN 後進入 ParentDashboard
 *
 * COPPA 合規：家長區僅限家長使用，透過 PIN 防止兒童進入設定
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import AppText from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useParentAuth } from '../../contexts/ParentAuthContext';
import { useTranslation } from '../../hooks/useTranslation';

const PIN_LENGTH = 4;

type Step = 'verify' | 'create' | 'confirm';

export default function ParentLoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { hasPin, setPin, verifyPin } = useParentAuth();

  // 首次設定或驗證
  const [step, setStep] = useState<Step>(hasPin ? 'verify' : 'create');
  const [firstPin, setFirstPin] = useState('');
  const [digits, setDigits] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 搖晃動畫（錯誤時）
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleDigit = (d: string) => {
    if (digits.length >= PIN_LENGTH) return;
    const next = digits + d;
    setDigits(next);
    setErrorMsg('');

    if (next.length === PIN_LENGTH) {
      // 短暫延遲讓最後一個點顯示
      setTimeout(() => processPin(next), 120);
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const processPin = (pin: string) => {
    if (step === 'verify') {
      if (verifyPin(pin)) {
        navigation.replace('ParentDashboard');
      } else {
        setDigits('');
        setErrorMsg(t('pinError'));
        triggerShake();
      }
    } else if (step === 'create') {
      setFirstPin(pin);
      setDigits('');
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === firstPin) {
        setPin(pin);
        navigation.replace('ParentDashboard');
      } else {
        setDigits('');
        setFirstPin('');
        setStep('create');
        setErrorMsg(t('pinMismatch'));
        triggerShake();
      }
    }
  };

  const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const titleText = () => {
    if (step === 'create') return t('pinTitleCreate');
    if (step === 'confirm') return t('pinTitleConfirm');
    return t('pinTitleVerify');
  };

  const subtitleText = () => {
    if (step === 'create') return t('pinSubCreate');
    if (step === 'confirm') return t('pinSubConfirm');
    return t('pinSubVerify');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 返回按鈕 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.container}>
        {/* 標題 */}
        <View style={styles.header}>
          <AppText style={styles.lockEmoji}>🔐</AppText>
          <AppText style={styles.title}>{titleText()}</AppText>
          <AppText style={styles.subtitle}>{subtitleText()}</AppText>
        </View>

        {/* PIN 點點顯示 */}
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < digits.length && styles.dotFilled,
                errorMsg ? styles.dotError : null,
              ]}
            />
          ))}
        </Animated.View>

        {/* 錯誤訊息 */}
        {!!errorMsg && <AppText style={styles.errorText}>{errorMsg}</AppText>}

        {/* 數字鍵盤 */}
        <View style={styles.keypad}>
          {KEYPAD.map((key, idx) => {
            if (key === '') return <View key={idx} style={styles.keyPlaceholder} />;
            if (key === 'del') {
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.keyBtn}
                  onPress={handleDelete}
                  accessibilityLabel={t('pinDeleteA11y')}
                >
                  <Ionicons name="backspace-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={idx}
                style={styles.keyBtn}
                onPress={() => handleDigit(key)}
                accessibilityLabel={t('pinNumA11y').replace('{n}', key)}
              >
                <AppText style={styles.keyText}>{key}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 忘記 PIN 提示 */}
        {step === 'verify' && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                t('pinForgotTitle'),
                t('pinForgotMsg'),
                [{ text: t('pinForgotBtn'), style: 'cancel' }]
              )
            }
          >
            <AppText style={styles.forgotPin}>{t('pinForgotLink')}</AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  backBtn: { padding: 16 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 24 },
  header: { alignItems: 'center', gap: 8 },
  lockEmoji: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 20, marginVertical: 8 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.primary },
  dotError: { borderColor: Colors.error },
  errorText: { fontSize: 13, color: Colors.error, textAlign: 'center' },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  keyPlaceholder: { width: 72, height: 72 },
  keyText: { fontSize: 26, fontWeight: '600', color: Colors.text },
  forgotPin: { fontSize: 13, color: Colors.textMuted, marginTop: 8, textDecorationLine: 'underline' },
});
