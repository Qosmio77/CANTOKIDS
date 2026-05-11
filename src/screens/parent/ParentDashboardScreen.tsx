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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useProgressStore } from '../../store/useProgressStore';
import { useParentAuth } from '../../contexts/ParentAuthContext';
import { fetchProducts, IAPProduct, FREE_LESSON_LIMIT, purchasePremium, restorePurchases, IAPProductId } from '../../services/iap/iapService';
import { ALL_WORDS } from '../../data/allWords';

const WORDS = ALL_WORDS;

export default function ParentDashboardScreen({ navigation }: any) {
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
      '重設學習進度',
      '這將清除所有星星、已學漢字及測驗記錄，無法復原。確定嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定重設',
          style: 'destructive',
          onPress: () => {
            resetProgress();
            Alert.alert('完成', '學習進度已重設。');
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
      Alert.alert('🎉 升級成功', '已解鎖全部課程！感謝支持 CantoKids。');
    } else {
      Alert.alert('購買失敗', '請稍後再試，或聯繫客服。');
    }
  };

  const handleRestore = async () => {
    setLoadingIAP(true);
    const ok = await restorePurchases();
    setLoadingIAP(false);
    if (ok) {
      setPremium(true);
      Alert.alert('恢復成功', '已恢復您的訂閱。');
    } else {
      Alert.alert('找不到購買記錄', '如有疑問請聯繫 App Store / Google Play 客服。');
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
        <Text style={styles.topTitle}>家長控制台</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 孩子名稱 */}
        <Text style={styles.childName}>👧 {displayName} 的學習報告</Text>

        {/* 學習概覽卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 學習概覽</Text>
          <View style={styles.statsGrid}>
            <StatBox icon="star" color={Colors.primary} label="累積星星" value={String(totalStars)} />
            <StatBox icon="flame" color="#EF4444" label="連續天數" value={`${streakDays} 天`} />
            <StatBox icon="book" color={Colors.cantonese} label="已學漢字" value={`${learnedCount} / ${WORDS.length}`} />
            <StatBox icon="trophy" color="#F59E0B" label="完美測驗" value={`${perfectQuizzes} 次`} />
          </View>
        </View>

        {/* 答題成績 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 答題成績</Text>
          <View style={styles.accuracyRow}>
            <View style={styles.accuracyBar}>
              <View style={[styles.accuracyFill, { width: `${accuracyPct}%` }]} />
            </View>
            <Text style={styles.accuracyPct}>{accuracyPct}%</Text>
          </View>
          <Text style={styles.accuracyDetail}>
            共答題 {totalAnswers} 次，答對 {totalCorrect} 次
          </Text>
        </View>

        {/* 需加強字詞 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ 需要加強</Text>
          {weakWords.length === 0 ? (
            <Text style={styles.emptyText}>太棒了！沒有需要特別加強的字詞 🎉</Text>
          ) : (
            <View style={styles.weakWordList}>
              {weakWords.map((w) => (
                <View key={w.id} style={styles.weakWordRow}>
                  <Text style={styles.weakChar}>{w.character}</Text>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakMeaning}>{w.meaning_zh}</Text>
                    <Text style={styles.weakJyutping}>{w.jyutping}</Text>
                  </View>
                  <View style={styles.wrongBadge}>
                    <Text style={styles.wrongBadgeText}>
                      ✗ {wordProgress[w.id]?.wrongCount ?? 0}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 訂閱管理 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💎 訂閱方案</Text>

          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.premiumText}>已訂閱高級版 — 全部課程已解鎖</Text>
            </View>
          ) : (
            <>
              <Text style={styles.freeNote}>
                目前免費版：前 {FREE_LESSON_LIMIT} 課免費，升級解鎖全部 {WORDS.length} 個漢字
              </Text>

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
                        <Text style={styles.purchaseBtnTitle}>{p.title}</Text>
                        <Text style={styles.purchaseBtnDesc}>{p.description}</Text>
                      </View>
                      <Text style={styles.purchasePrice}>{p.price}</Text>
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
                  <Text style={styles.restoreBtnText}>恢復已購買項目</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 危險區 */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.cardTitle}>⚙️ 進階設定</Text>

          {/* 修復 H-3: 提供更改 PIN 的方式，避免逼用戶刪除 App */}
          <TouchableOpacity
            style={styles.changePinBtn}
            onPress={() =>
              Alert.alert(
                '更改 PIN 碼',
                '確定要重設家長 PIN 碼嗎？系統會要求重新設定新 PIN。',
                [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '確定更改',
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
            <Text style={styles.changePinBtnText}>更改家長 PIN 碼</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetProgress}>
            <Ionicons name="refresh" size={18} color={Colors.error} />
            <Text style={styles.dangerBtnText}>重設學習進度</Text>
          </TouchableOpacity>
          <Text style={styles.dangerNote}>重設進度會清除學習記錄，但保留家長設定與訂閱狀態。</Text>
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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
