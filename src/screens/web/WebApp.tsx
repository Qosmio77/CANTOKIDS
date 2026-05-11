/**
 * WebApp — 網頁版根組件（Platform.OS === 'web' 時使用）
 *
 * 狀態機：
 *  login   → 顯示 QR Code 等待手機掃描
 *  dashboard → 顯示學習儀表板
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { QRUserData } from '../../services/qrAuthService';
import WebQRLoginScreen from './WebQRLoginScreen';
import WebDashboardScreen from './WebDashboardScreen';

type WebState = 'login' | 'dashboard';

export default function WebApp() {
  const [webState, setWebState] = useState<WebState>('login');
  const [userData, setUserData] = useState<QRUserData | null>(null);

  const handleLogin = (data: QRUserData) => {
    setUserData(data);
    setWebState('dashboard');
  };

  const handleLogout = () => {
    setUserData(null);
    setWebState('login');
  };

  return (
    <View style={styles.root}>
      {webState === 'login' && (
        <WebQRLoginScreen onLogin={handleLogin} />
      )}
      {webState === 'dashboard' && userData && (
        <WebDashboardScreen userData={userData} onLogout={handleLogout} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // 網頁版：使用全視窗高度
    ...(Platform.OS === 'web'
      ? { minHeight: '100vh' as any, backgroundColor: '#FFFBEB' }
      : {}),
  },
});
