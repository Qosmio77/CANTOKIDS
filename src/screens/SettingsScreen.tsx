/**
 * SettingsScreen — 個人設定
 *
 * 功能：
 * - 更改小朋友顯示名稱
 * - 查看 App 版本
 * - 重新播放引導（Onboarding）
 * - 聯絡支援（佔位）
 *
 * Phase 4: 從 HomeScreen 右上角齒輪按鈕進入
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }: any) {
  const { displayName, setUser, userId } = useProgressStore();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [nameError, setNameError] = useState('');

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError('名字不能為空'); return; }
    if (trimmed.length > 10) { setNameError('名字最多 10 個字'); return; }
    setUser(userId ?? 'local-user', trimmed);
    setEditingName(false);
    setNameError('');
  };

  const handleReplayOnboarding = () => {
    Alert.alert(
      '重播引導',
      '確定要重新觀看首次使用引導？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            // 清除 onboardingDone，下次重啟會重播
            useProgressStore.setState({ onboardingDone: false });
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 頂部欄 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>設定</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 個人資料 */}
        <SectionHeader title="👧 個人資料" />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>小朋友名稱</Text>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.nameInput, nameError ? styles.nameInputError : null]}
                  value={nameInput}
                  onChangeText={(t) => { setNameInput(t); setNameError(''); }}
                  maxLength={10}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                  <Text style={styles.saveBtnText}>儲存</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setEditingName(false); setNameInput(displayName); setNameError(''); }}
                >
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editTrigger}
                onPress={() => { setEditingName(true); setNameInput(displayName); }}
              >
                <Text style={styles.rowValue}>{displayName}</Text>
                <Ionicons name="pencil" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>

        {/* 網頁版 */}
        <SectionHeader title="🌐 網頁版" />
        <View style={styles.card}>
          <SettingRow
            icon="qr-code-outline"
            label="掃描登入網頁版"
            onPress={() => navigation.navigate('QRScan')}
          />
          <Divider />
          <View style={styles.webHintRow}>
            <Text style={styles.webHintText}>
              在電腦瀏覽器開啟{' '}
              <Text style={styles.webHintUrl}>cantokids.app</Text>
              {'\n'}然後用手機掃描 QR Code 即可同步學習進度
            </Text>
          </View>
        </View>

        {/* 應用程式 */}
        <SectionHeader title="⚙️ 應用程式" />
        <View style={styles.card}>
          <SettingRow
            icon="refresh-circle-outline"
            label="重新播放引導教學"
            onPress={handleReplayOnboarding}
          />
          <Divider />
          <SettingRow
            icon="shield-checkmark-outline"
            label="私隱政策"
            onPress={() => Alert.alert('私隱政策', 'CantoKids 不收集任何兒童個人資料。\n學習進度僅儲存在本機裝置。\n\n符合 COPPA 規範。')}
          />
          <Divider />
          <SettingRow
            icon="mail-outline"
            label="聯絡支援"
            onPress={() => Alert.alert('聯絡支援', '請電郵至 support@cantokids.app\n\n我們會於 2 個工作天內回覆。')}
          />
        </View>

        {/* 版本資訊 */}
        <SectionHeader title="ℹ️ 關於" />
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>版本</Text>
            <Text style={styles.aboutValue}>{APP_VERSION}</Text>
          </View>
          <Divider />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>詞庫</Text>
            <Text style={styles.aboutValue}>60 個漢字 · 6 個級別</Text>
          </View>
          <Divider />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>製作</Text>
            <Text style={styles.aboutValue}>CantoKids Team 🌱</Text>
          </View>
        </View>

        {/* 家長入口 */}
        <TouchableOpacity
          style={styles.parentBtn}
          onPress={() => navigation.navigate('ParentLogin')}
        >
          <Ionicons name="people" size={20} color={Colors.white} />
          <Text style={styles.parentBtnText}>進入家長控制台</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function SettingRow({
  icon, label, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
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
  content: { padding: 20, gap: 8, paddingBottom: 48 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: Colors.text },
  rowValue: { fontSize: 15, color: Colors.primary, fontWeight: '600', marginRight: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  nameInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: Colors.text,
    minWidth: 100,
    textAlign: 'right',
  },
  nameInputError: { borderColor: Colors.error },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  cancelBtn: { padding: 4 },
  errorText: { fontSize: 12, color: Colors.error, paddingHorizontal: 16, paddingBottom: 10 },
  webHintRow: { paddingHorizontal: 16, paddingVertical: 12 },
  webHintText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  webHintUrl: { color: Colors.primary, fontWeight: '700' },
  editTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { flex: 1, fontSize: 15, color: Colors.text },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutLabel: { fontSize: 14, color: Colors.textSecondary },
  aboutValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  parentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  parentBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
