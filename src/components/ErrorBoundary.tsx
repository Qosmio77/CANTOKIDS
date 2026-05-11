/**
 * ErrorBoundary — 全域錯誤捕獲
 *
 * 包裹 App 根組件，防止未預期的 JS 錯誤導致白屏崩潰。
 * 顯示友善的錯誤畫面，並提供「重新載入」選項。
 *
 * Phase 4: 生產安全網
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: Phase 3 替換為 Sentry / Bugsnag 上報
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <Text style={styles.emoji}>😵</Text>
            <Text style={styles.title}>出了一點問題</Text>
            <Text style={styles.subtitle}>
              App 遇到了意外錯誤。{'\n'}你的學習進度已安全儲存。
            </Text>
            {__DEV__ && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} numberOfLines={4}>
                  {this.state.errorMessage}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
              <Text style={styles.btnText}>重新載入</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    alignSelf: 'stretch',
  },
  errorText: { fontSize: 11, color: Colors.error, fontFamily: 'monospace' },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
