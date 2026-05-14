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
import { useTranslation } from '../hooks/useTranslation';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }: any) {
  const { displayName, setUser, userId, language, setLanguage } = useProgressStore();
  const { t } = useTranslation();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [nameError, setNameError] = useState('');

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError(t('nameEmpty')); return; }
    if (trimmed.length > 10) { setNameError(t('nameTooLong')); return; }
    setUser(userId ?? 'local-user', trimmed);
    setEditingName(false);
    setNameError('');
  };

  const handleReplayOnboarding = () => {
    Alert.alert(
      t('replayConfirmTitle'),
      t('replayConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
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
        <Text style={styles.topTitle}>{t('settings')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 個人資料 */}
        <SectionHeader title={t('sectionProfile')} />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('childName')}</Text>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.nameInput, nameError ? styles.nameInputError : null]}
                  value={nameInput}
                  onChangeText={(v) => { setNameInput(v); setNameError(''); }}
                  maxLength={10}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
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

        {/* 介面語言 */}
        <SectionHeader title={t('sectionLanguage')} />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.langRow}
            onPress={() => setLanguage('zh')}
          >
            <Text style={styles.langLabel}>{t('languageZh')}</Text>
            {language === 'zh'
              ? <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              : <Ionicons name="ellipse-outline" size={22} color={Colors.textMuted} />
            }
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            style={styles.langRow}
            onPress={() => setLanguage('en')}
          >
            <Text style={styles.langLabel}>{t('languageEn')}</Text>
            {language === 'en'
              ? <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              : <Ionicons name="ellipse-outline" size={22} color={Colors.textMuted} />
            }
          </TouchableOpacity>
        </View>

        {/* 網頁版 */}
        <SectionHeader title={t('sectionWeb')} />
        <View style={styles.card}>
          <SettingRow
            icon="qr-code-outline"
            label={t('scanQrLogin')}
            onPress={() => navigation.navigate('QRScan')}
          />
          <Divider />
          <View style={styles.webHintRow}>
            <Text style={styles.webHintText}>
              {language === 'en'
                ? <>Open <Text style={styles.webHintUrl}>cantokids.app</Text>{'\n'}then scan the QR code to sync progress</>
                : <>在電腦瀏覽器開啟 <Text style={styles.webHintUrl}>cantokids.app</Text>{'\n'}然後用手機掃描 QR Code 即可同步學習進度</>
              }
            </Text>
          </View>
        </View>

        {/* 應用程式 */}
        <SectionHeader title={t('sectionApp')} />
        <View style={styles.card}>
          <SettingRow
            icon="refresh-circle-outline"
            label={t('replayTutorial')}
            onPress={handleReplayOnboarding}
          />
          <Divider />
          <SettingRow
            icon="shield-checkmark-outline"
            label={t('privacyPolicy')}
            onPress={() => Alert.alert(t('privacyPolicy'), t('privacyMsg'))}
          />
          <Divider />
          <SettingRow
            icon="mail-outline"
            label={t('contactSupport')}
            onPress={() => Alert.alert(t('contactSupport'), t('supportMsg'))}
          />
        </View>

        {/* 版本資訊 */}
        <SectionHeader title={t('sectionAbout')} />
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t('aboutVersion')}</Text>
            <Text style={styles.aboutValue}>{APP_VERSION}</Text>
          </View>
          <Divider />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t('aboutDictionary')}</Text>
            <Text style={styles.aboutValue}>{t('aboutDictionaryValue')}</Text>
          </View>
          <Divider />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t('aboutMadeBy')}</Text>
            <Text style={styles.aboutValue}>{t('aboutMadeByValue')}</Text>
          </View>
        </View>

        {/* 家長入口 */}
        <TouchableOpacity
          style={styles.parentBtn}
          onPress={() => navigation.navigate('ParentLogin')}
        >
          <Ionicons name="people" size={20} color={Colors.white} />
          <Text style={styles.parentBtnText}>{t('parentDashboard')}</Text>
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
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langLabel: { fontSize: 15, color: Colors.text },
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
