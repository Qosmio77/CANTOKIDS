/**
 * PracticeSheetScreen.web.tsx — Web stub
 * 練習紙模式需要 WebView（原生）列印功能，Web 平台暫不支援。
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppText from '../components/AppText';

export default function PracticeSheetScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <AppText style={styles.emoji}>🖨️</AppText>
      <AppText style={styles.title}>練習紙</AppText>
      <AppText style={styles.desc}>練習紙列印功能在手機 App 上可用。{'\n'}請下載 iOS / Android App 使用此功能。</AppText>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <AppText style={styles.btnText}>返回</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbf9f1', padding: 32, gap: 16 },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '700', color: '#1b1c17' },
  desc: { fontSize: 15, color: '#4d4732', textAlign: 'center', lineHeight: 24 },
  btn: { marginTop: 8, backgroundColor: '#E8A000', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
