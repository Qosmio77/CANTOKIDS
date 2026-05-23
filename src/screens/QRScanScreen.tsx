/**
 * QRScanScreen — 手機端掃描網頁 QR Code 登入
 *
 * 流程：
 * 1. 開啟相機，掃描網頁版顯示的 QR Code
 * 2. 解析出 sessionId
 * 3. 顯示確認對話框（是否允許此裝置登入）
 * 4. 確認 → 推送用戶資料到 Firebase → 網頁端自動登入
 * 5. 拒絕 → 寫入 rejected 狀態
 *
 * 需要安裝：npx expo install expo-camera
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CameraView, Camera } = require('expo-camera') as any;
type BarcodeScanningResult = { data: string };
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import {
  decodeQRPayload,
  markSessionScanned,
  approveSession,
  rejectSession,
  QRUserData,
} from '../services/qrAuthService';

type ScanPhase = 'scanning' | 'confirming' | 'approving' | 'done' | 'error';

export default function QRScanScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const scannedRef = useRef(false); // 防止重複觸發

  // 從 store 取出要同步的資料
  const store = useProgressStore();

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }: { status: string }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  // 組裝要推送的使用者資料快照
  const buildUserData = (): QRUserData => {
    const learnedWords: Record<string, { learned: boolean; correctCount: number; wrongCount: number }> = {};
    Object.entries(store.wordProgress).forEach(([id, p]) => {
      learnedWords[id] = {
        learned: p.learned,
        correctCount: p.correctCount,
        wrongCount: p.wrongCount,
      };
    });
    return {
      displayName:    store.displayName,
      playerXP:       store.playerXP,
      playerLevel:    store.playerLevel,
      totalStars:     store.totalStars,
      streakDays:     store.streakDays,
      perfectQuizzes: store.perfectQuizzes,
      totalCorrect:   store.totalCorrect,
      totalAnswers:   store.totalAnswers,
      bossesDefeated: store.bossesDefeated,
      wordProgress:   learnedWords,
      syncedAt:       Date.now(),
    };
  };

  const handleBarcode = async ({ data }: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const id = decodeQRPayload(data);
    if (!id) {
      setErrorMsg('無效的 QR Code，請確認是 CantoKids 網頁版產生的。');
      setPhase('error');
      return;
    }

    setSessionId(id);
    try {
      await markSessionScanned(id); // 讓網頁端知道已被掃描
    } catch {
      // 網路問題，繼續讓用戶確認
    }
    setPhase('confirming');
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    setPhase('approving');
    try {
      await approveSession(sessionId, buildUserData());
      setPhase('done');
    } catch (e) {
      setErrorMsg('網路錯誤，請稍後再試。');
      setPhase('error');
    }
  };

  const handleReject = async () => {
    if (sessionId) {
      await rejectSession(sessionId).catch(() => {});
    }
    navigation.goBack();
  };

  const handleRetry = () => {
    scannedRef.current = false;
    setPhase('scanning');
    setSessionId(null);
    setErrorMsg('');
  };

  // ── 等待相機授權 ─────────────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <AppText style={styles.hint}>正在請求相機權限…</AppText>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
        <AppText style={styles.errorText}>未授予相機權限</AppText>
        <AppText style={styles.hint}>請在系統設定中允許 CantoKids 使用相機</AppText>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <AppText style={styles.btnText}>返回</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── 完成畫面 ────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.center}>
        <AppText style={{ fontSize: 72 }}>✅</AppText>
        <AppText style={styles.doneTitle}>登入成功！</AppText>
        <AppText style={styles.hint}>網頁版現在顯示你的學習進度了 🎉</AppText>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <AppText style={styles.btnText}>關閉</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── 錯誤畫面 ────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <AppText style={styles.errorText}>{errorMsg}</AppText>
        <TouchableOpacity style={styles.btn} onPress={handleRetry}>
          <AppText style={styles.btnText}>重新掃描</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <AppText style={styles.cancelBtnText}>取消</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── 確認對話框 ──────────────────────────────────────────────────
  if (phase === 'confirming') {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: Colors.primaryBg }]}>
        <AppText style={{ fontSize: 64 }}>🔐</AppText>
        <AppText style={styles.confirmTitle}>允許登入網頁版？</AppText>
        <AppText style={styles.confirmSubtitle}>
          你的學習進度將同步至該瀏覽器，{'\n'}
          有效期 5 分鐘。
        </AppText>

        <View style={styles.userCard}>
          <AppText style={styles.userCardLabel}>同步帳號</AppText>
          <AppText style={styles.userCardName}>{store.displayName}</AppText>
          <AppText style={styles.userCardStats}>
            {Object.values(store.wordProgress).filter((p) => p.learned).length} 個字已學 ·{' '}
            {store.playerXP} XP · Lv.{store.playerLevel}
          </AppText>
        </View>

        <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <AppText style={styles.approveBtnText}>允許登入</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
          <AppText style={styles.rejectBtnText}>拒絕</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── 上傳中 ──────────────────────────────────────────────────────
  if (phase === 'approving') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <AppText style={styles.hint}>正在同步資料…</AppText>
      </SafeAreaView>
    );
  }

  // ── 掃描相機 ────────────────────────────────────────────────────
  return (
    <View style={styles.camera}>
      {/* 頂部返回按鈕（覆蓋在相機上） */}
      <SafeAreaView style={styles.cameraTopBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <AppText style={styles.cameraTitle}>掃描 QR Code</AppText>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* 掃描框 */}
      <View style={styles.scanFrame} pointerEvents="none">
        <View style={styles.scanCornerTL} />
        <View style={styles.scanCornerTR} />
        <View style={styles.scanCornerBL} />
        <View style={styles.scanCornerBR} />
      </View>

      <View style={styles.cameraBottomHint}>
        <AppText style={styles.cameraHintText}>
          將相機對準網頁版的 QR Code
        </AppText>
      </View>
    </View>
  );
}

const CORNER = 24;
const FRAME  = 220;
const BORDER = 4;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    padding: 32,
    gap: 16,
  },

  // 相機畫面
  camera: { flex: 1, backgroundColor: '#000' },
  cameraTopBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cameraTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  backBtn: { padding: 4 },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: FRAME,
    height: FRAME,
    marginTop: -FRAME / 2,
    marginLeft: -FRAME / 2,
  },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: Colors.primary, borderTopLeftRadius: 8 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: Colors.primary, borderTopRightRadius: 8 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: Colors.primary, borderBottomLeftRadius: 8 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: Colors.primary, borderBottomRightRadius: 8 },
  cameraBottomHint: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHintText: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // 確認畫面
  confirmTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  confirmSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  userCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  userCardName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  userCardStats: { fontSize: 13, color: Colors.textSecondary },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },
  approveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  rejectBtn: { paddingVertical: 12 },
  rejectBtnText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },

  // 一般
  hint: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorText: { fontSize: 17, fontWeight: '700', color: Colors.error, textAlign: 'center' },
  doneTitle: { fontSize: 28, fontWeight: '900', color: Colors.text },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
});
