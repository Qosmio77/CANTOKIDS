/**
 * ParentDashboardScreen — 家長控制台
 *
 * 功能：
 * 1. 學習概覽：總星星、連續天數、已學漢字數
 * 2. 本週測驗成績：答對率
 * 3. 需加強字詞：答錯次數 ≥ 2 的漢字
 * 4. 訂閱管理：免費 / 付費方案狀態 + 升級入口
 * 5. 重設進度按鈕（需再次確認）
 * 6. 登出家長區
 *
 * COPPA 合規：本頁不顯示任何兒童個人資料，不收集廣告追蹤資料
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AppText from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useProgressStore } from '../../store/useProgressStore';
import { useParentAuth } from '../../contexts/ParentAuthContext';
import { fetchProducts, IAPProduct, FREE_LESSON_LIMIT, purchasePremium, restorePurchases, IAPProductId } from '../../services/iap/iapService';
import { ALL_WORDS } from '../../data/allWords';
import { useTranslation } from '../../hooks/useTranslation';

const WORDS = ALL_WORDS;

export default function ParentDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const {
    totalStars, wordProgress, streakDays, perfectQuizzes,
    isPremium, setPremium, resetProgress, displayName,
    totalCorrect, totalAnswers,
  } = useProgressStore();
  const { logout } = useParentAuth();

  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loadingIAP, setLoadingIAP] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  // 計算已學字數
  const learnedCount = useMemo(
    () => Object.values(wordProgress).filter((p) => p.learned).length,
    [wordProgress]
  );

  const accuracyPct = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

  // 需加強字詞（答錯 ≥ 2 次）
  const weakWords = useMemo(
    () =>
      WORDS.filter((w) => (wordProgress[w.id]?.wrongCount ?? 0) >= 2).sort(
        (a, b) => (wordProgress[b.id]?.wrongCount ?? 0) - (wordProgress[a.id]?.wrongCount ?? 0)
      ),
    [wordProgress]
  );

  const handleResetProgress = () => {
    Alert.alert(
      t('resetProgressTitle'),
      t('resetProgressMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('resetProgressConfirm'),
          style: 'destructive',
          onPress: () => {
            resetProgress();
            Alert.alert(t('resetDoneTitle'), t('resetDoneMsg'));
          },
        },
      ]
    );
  };

  // 修復 F-6: 使用正確型別
  const handlePurchase = async (productId: IAPProductId) => {
    setPurchasing(true);
    const ok = await purchasePremium(productId);
    setPurchasing(false);
    if (ok) {
      setPremium(true);
      Alert.alert(t('purchaseSuccess'), t('purchaseSuccessMsg'));
    } else {
      Alert.alert(t('purchaseFail'), t('purchaseFailMsg'));
    }
  };

  const handleRestore = async () => {
    setLoadingIAP(true);
    const ok = await restorePurchases();
    setLoadingIAP(false);
    if (ok) {
      setPremium(true);
      Alert.alert(t('restoreSuccess'), t('restoreSuccessMsg'));
    } else {
      Alert.alert(t('restoreFail'), t('restoreFailMsg'));
    }
  };

  const handleLogout = () => {
    logout();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 頂部欄 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <AppText style={styles.topTitle}>{t('parentTitle')}</AppText>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 孩子名稱 */}
        <AppText style={styles.childName}>{t('childReport').replace('{name}', displayName)}</AppText>

        {/* 學習概覽卡片 */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>{t('overviewTitle')}</AppText>
          <View style={styles.statsGrid}>
            <StatBox icon="star" color={Colors.primary} label={t('parentStatStars')} value={String(totalStars)} />
            <StatBox icon="flame" color="#EF4444" label={t('parentStatStreak')} value={`${streakDays}`} />
            <StatBox icon="book" color={Colors.cantonese} label={t('parentStatLearned')} value={`${learnedCount} / ${WORDS.length}`} />
            <StatBox icon="trophy" color="#F59E0B" label={t('parentStatPerfect')} value={`${perfectQuizzes}`} />
          </View>
        </View>

        {/* 答題成績 */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>{t('quizScoreTitle')}</AppText>
          <View style={styles.accuracyRow}>
            <View style={styles.accuracyBar}>
              <View style={[styles.accuracyFill, { width: `${accuracyPct}%` }]} />
            </View>
            <AppText style={styles.accuracyPct}>{accuracyPct}%</AppText>
          </View>
          <AppText style={styles.accuracyDetail}>
            {t('accuracyDetail').replace('{total}', String(totalAnswers)).replace('{correct}', String(totalCorrect))}
          </AppText>
        </View>

        {/* 需加強字詞 */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>{t('weakWordsTitle')}</AppText>
          {weakWords.length === 0 ? (
            <AppText style={styles.emptyText}>{t('weakWordsEmpty')}</AppText>
          ) : (
            <View style={styles.weakWordList}>
              {weakWords.map((w) => (
                <View key={w.id} style={styles.weakWordRow}>
                  <AppText style={styles.weakChar}>{w.character}</AppText>
                  <View style={styles.weakInfo}>
                    <AppText style={styles.weakMeaning}>{w.meaning_zh}</AppText>
                    <AppText style={styles.weakJyutping}>{w.jyutping}</AppText>
                  </View>
                  <View style={styles.wrongBadge}>
                    <AppText style={styles.wrongBadgeText}>
                      ✗ {wordProgress[w.id]?.wrongCount ?? 0}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 訂閱管理 */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>{t('subscriptionTitle')}</AppText>

          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <AppText style={styles.premiumText}>{t('premiumActive')}</AppText>
            </View>
          ) : (
            <>
              <AppText style={styles.freeNote}>
                {t('freeNote').replace('{free}', String(FREE_LESSON_LIMIT)).replace('{total}', String(WORDS.length))}
              </AppText>

              {products.map((p) => (
                <TouchableOpacity
                  key={p.productId}
                  style={styles.purchaseBtn}
                  onPress={() => handlePurchase(p.productId)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <View>
                        <AppText style={styles.purchaseBtnTitle}>{p.title}</AppText>
                        <AppText style={styles.purchaseBtnDesc}>{p.description}</AppText>
                      </View>
                      <AppText style={styles.purchasePrice}>{p.price}</AppText>
                    </>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={handleRestore}
                disabled={loadingIAP}
              >
                {loadingIAP ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <AppText style={styles.restoreBtnText}>{t('restoreBtn')}</AppText>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 危險區 */}
        <View style={[styles.card, styles.dangerCard]}>
          <AppText style={styles.cardTitle}>{t('advancedTitle')}</AppText>

          {/* 修復 H-3: 提供更改 PIN 的方式，避免逼用戶刪除 App */}
          <TouchableOpacity
            style={styles.changePinBtn}
            onPress={() =>
              Alert.alert(
                t('changePinTitle'),
                t('changePinMsg'),
                [
                  { text: t('cancel'), style: 'cancel' },
                  {
                    text: t('changePinConfirm'),
                    onPress: () => {
                      useProgressStore.getState().setParentPin('');
                      logout();
                      navigation.replace('ParentLogin');
                    },
                  },
                ]
              )
            }
          >
            <Ionicons name="key-outline" size={18} color={Colors.primary} />
            <AppText style={styles.changePinBtnText}>{t('changePinBtn')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetProgress}>
            <Ionicons name="refresh" size={18} color={Colors.error} />
            <AppText style={styles.dangerBtnText}>{t('resetProgressBtn')}</AppText>
          </TouchableOpacity>
          <AppText style={styles.dangerNote}>{t('dangerNote')}</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 小統計格子組件
function StatBox({
  icon, color, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={22} color={color} />
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  childName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  statBox: {
    width: '46%',
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  accuracyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accuracyBar: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  accuracyFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 5 },
  accuracyPct: { fontSize: 18, fontWeight: '700', color: Colors.text, width: 44, textAlign: 'right' },
  accuracyDetail: { fontSize: 12, color: Colors.textSecondary },

  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
  weakWordList: { gap: 8 },
  weakWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: 10,
    padding: 10,
    gap: 12,
  },
  weakChar: { fontSize: 32, fontWeight: '700', color: Colors.text, width: 44, textAlign: 'center' },
  weakInfo: { flex: 1 },
  weakMeaning: { fontSize: 14, fontWeight: '600', color: Colors.text },
  weakJyutping: { fontSize: 12, color: Colors.cantonese },
  wrongBadge: { backgroundColor: Colors.errorLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  wrongBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.error },

  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumText: { fontSize: 14, color: Colors.success, fontWeight: '600' },
  freeNote: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  purchaseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  purchaseBtnDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  purchasePrice: { fontSize: 18, fontWeight: '800', color: Colors.white },
  restoreBtn: { alignItems: 'center', paddingVertical: 6 },
  restoreBtnText: { fontSize: 13, color: Colors.textMuted, textDecorationLine: 'underline' },

  dangerCard: { borderWidth: 1, borderColor: Colors.errorLight },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600', color: Colors.error },
  dangerNote: { fontSize: 12, color: Colors.textMuted },
  changePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 10,
    padding: 12,
  },
  changePinBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
