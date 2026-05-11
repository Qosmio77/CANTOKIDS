/**
 * WebQRLoginScreen — 網頁版登入頁
 *
 * 1. 生成唯一 sessionId → Firebase
 * 2. 以 QRCode 顯示 sessionId（react-native-qrcode-svg）
 * 3. 監聽 Firebase → 狀態轉為 'authenticated' 後呼叫 onLogin(userData)
 * 4. 5 分鐘倒計時，過期自動刷新 QR
 *
 * 需要安裝：npm install react-native-qrcode-svg react-native-svg
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../theme/colors';
import {
  generateSessionId,
  createSession,
  listenToSession,
  deleteSession,
  encodeQRPayload,
  isSessionExpired,
  SESSION_TTL_MS,
  QRSession,
  QRUserData,
} from '../../services/qrAuthService';

interface Props {
  onLogin: (userData: QRUserData) => void;
}

type WebPhase = 'creating' | 'waiting' | 'scanned' | 'error';

const REFRESH_INTERVAL = SESSION_TTL_MS; // 5 分鐘刷新一次

export default function WebQRLoginScreen({ onLogin }: Props) {
  const [phase, setPhase]         = useState<WebPhase>('creating');
  const [sessionId, setSessionId] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(300); // 5min
  const [errorMsg, setErrorMsg]   = useState('');

  const unsubRef    = useRef<(() => void) | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef  = useRef<string>('');

  // ── 清除 ─────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    if (timerRef.current)  clearInterval(timerRef.current);
    if (refreshRef.current) clearTimeout(refreshRef.current);
    if (sessionRef.current) deleteSession(sessionRef.current).catch(() => {});
  }, []);

  // ── 初始化 Session ───────────────────────────────────────────────
  const initSession = useCallback(async () => {
    setPhase('creating');
    setSecondsLeft(300);

    const id = generateSessionId();
    sessionRef.current = id;
    setSessionId(id);
    setQrPayload(encodeQRPayload(id));

    try {
      await createSession(id);
    } catch {
      setErrorMsg('無法連接至伺服器，請檢查網路。');
      setPhase('error');
      return;
    }

    setPhase('waiting');

    // 監聽 Firebase 狀態變更
    unsubRef.current = listenToSession(id, (session: QRSession | null) => {
      if (!session) return;

      if (isSessionExpired(session)) {
        initSession(); // 過期 → 自動刷新
        return;
      }

      if (session.status === 'scanned') {
        setPhase('scanned');
      }

      if (session.status === 'authenticated' && session.userData) {
        cleanup();
        onLogin(session.userData);
      }

      if (session.status === 'rejected') {
        cleanup();
        initSession(); // 被拒絕 → 重新生成
      }
    });

    // 倒計時
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          initSession();
          return 300;
        }
        return s - 1;
      });
    }, 1000);

    // 5 分鐘後強制刷新
    refreshRef.current = setTimeout(() => {
      unsubRef.current?.();
      initSession();
    }, REFRESH_INTERVAL);
  }, [onLogin]);

  useEffect(() => {
    initSession();
    return cleanup;
  }, []);

  // ── 格式化倒計時 ─────────────────────────────────────────────────
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── UI ──────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={initSession}>
          <Text style={styles.retryBtnText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <View style={styles.header}>
        <Text style={styles.appName}>CantoKids</Text>
        <Text style={styles.subtitle}>網頁學習版</Text>
      </View>

      {/* QR 卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {phase === 'scanned' ? '📱 手機已掃描，等待確認…' : '📱 用手機 App 掃描登入'}
        </Text>

        {phase === 'creating' ? (
          <View style={styles.qrPlaceholder}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={[styles.qrWrapper, phase === 'scanned' && styles.qrWrapperScanned]}>
            <QRCode
              value={qrPayload}
              size={220}
              color="#1F2937"
              backgroundColor="#FFFFFF"
              logo={undefined}
            />
            {phase === 'scanned' && (
              <View style={styles.qrOverlay}>
                <Text style={styles.qrOverlayText}>✅</Text>
              </View>
            )}
          </View>
        )}

        {/* 倒計時 */}
        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>QR Code 有效時間</Text>
          <Text style={[styles.timerValue, secondsLeft < 60 && styles.timerValueUrgent]}>
            {formatTime(secondsLeft)}
          </Text>
        </View>

        {/* 刷新 */}
        <TouchableOpacity style={styles.refreshBtn} onPress={initSession}>
          <Text style={styles.refreshBtnText}>🔄 重新產生</Text>
        </TouchableOpacity>
      </View>

      {/* 步驟說明 */}
      <View style={styles.steps}>
        <StepItem step="1" text="打開手機 CantoKids App" />
        <StepItem step="2" text="進入「設定」→「掃描登入網頁版」" />
        <StepItem step="3" text="對準此 QR Code 掃描" />
        <StepItem step="4" text="手機確認後即可在此學習" />
      </View>
    </View>
  );
}

function StepItem({ step, text }: { step: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{step}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    gap: 24,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.primaryBg,
  },
  header: { alignItems: 'center', gap: 4 },
  appName: { fontSize: 36, fontWeight: '900', color: Colors.primary },
  subtitle: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    width: '100%',
    maxWidth: 360,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    position: 'relative',
  },
  qrWrapperScanned: {
    borderColor: Colors.success,
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  qrOverlayText: { fontSize: 72 },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerLabel: { fontSize: 13, color: Colors.textMuted },
  timerValue: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  timerValueUrgent: { color: Colors.error },

  refreshBtn: { paddingVertical: 6 },
  refreshBtnText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  // 步驟說明
  steps: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  stepText: { fontSize: 14, color: Colors.text, flex: 1 },

  // 錯誤
  errorEmoji: { fontSize: 56 },
  errorTitle: { fontSize: 16, color: Colors.error, textAlign: 'center', fontWeight: '600' },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
