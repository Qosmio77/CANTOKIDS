/**
 * PracticeSheetScreen — 練習紙模式
 *
 * 流程：
 *   ① 選字畫面  — 多選已學字詞（全選 / 全不選）
 *   ② 預覽畫面  — WebView 渲染 A4 HTML 練習紙
 *                  頁面內「🖨️ 列印 / 儲存 PDF」按鈕呼叫 window.print()
 *                  iOS：原生列印對話框（支援「儲存為 PDF」）
 *
 * 練習紙格式：
 *   每行：字資訊（字、粵拼、意思）+ 1 個臨摹格（字淺灰）+ 6 個空格
 *   格式：田字格（橫縱虛線 + 外框實線）
 *   A4：210mm × 297mm，頁邊距 15mm
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '../store/useProgressStore';
import { ALL_WORDS } from '../data/allWords';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import type { Word } from '../types/word';

const { width: SW } = Dimensions.get('window');
const TILE = (SW - 48 - 24) / 4;

type ScreenState = 'select' | 'preview';

// ── HTML 生成 ──────────────────────────────────────────────────────────────
function buildSheetHTML(words: Word[], lang: string): string {
  const title    = lang === 'en' ? 'CantoKids Practice Sheet' : 'CantoKids 練習紙';
  const nameLbl  = lang === 'en' ? 'Name:' : '姓名：';
  const dateLbl  = lang === 'en' ? 'Date:' : '日期：';
  const printLbl = lang === 'en' ? '🖨️ Print / Save as PDF' : '🖨️ 列印 / 儲存 PDF';
  const traceLbl = lang === 'en' ? 'Trace' : '臨摹';

  const rows = words.map(w => {
    const meaning = lang === 'en' ? w.meaning_en : w.meaning_zh;
    // For multi-char words, show component chars in boxes
    const chars = w.character.length === 1
      ? [w.character]
      : w.character.split('');

    const charRows = chars.map(ch => `
      <div class="char-row">
        <div class="char-info">
          <div class="char-main">${w.character}</div>
          <div class="char-sub">${w.jyutping}</div>
          <div class="char-sub meaning">${meaning}</div>
        </div>
        <div class="boxes">
          <div class="box trace-box">
            <div class="tian-h"></div>
            <div class="tian-v"></div>
            <span class="trace-char">${ch}</span>
            <div class="trace-label">${traceLbl}</div>
          </div>
          ${[...Array(6)].map(() => `
            <div class="box">
              <div class="tian-h"></div>
              <div class="tian-v"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    return charRows;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'PingFang TC', 'Heiti TC', 'Microsoft JhengHei',
                 'Noto Sans TC', Arial, sans-serif;
    background: #f5f5f0;
    padding: 12px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    background: white;
    margin: 0 auto;
    padding: 14mm 15mm 18mm;
    box-shadow: 0 2px 16px rgba(0,0,0,0.12);
    border-radius: 4px;
  }

  /* ── Header ── */
  .sheet-header { text-align: center; margin-bottom: 6mm; }
  .sheet-title  {
    font-size: 20pt; font-weight: 900;
    color: #1b1c17; letter-spacing: 1px;
  }
  .sheet-meta {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 4mm; padding-top: 3mm;
    border-top: 1.5px solid #E8A000;
  }
  .sheet-field {
    font-size: 9pt; color: #555;
    display: flex; align-items: center; gap: 2mm;
  }
  .sheet-line {
    display: inline-block;
    width: 40mm; height: 0;
    border-bottom: 1px solid #999;
    margin-left: 1mm;
  }

  /* ── Character rows ── */
  .char-row {
    display: flex;
    align-items: center;
    margin-bottom: 3.5mm;
    page-break-inside: avoid;
  }

  .char-info {
    width: 24mm;
    padding-right: 3mm;
    flex-shrink: 0;
  }
  .char-main    { font-size: 20pt; font-weight: 900; color: #1b1c17; line-height: 1.1; }
  .char-sub     { font-size: 6.5pt; color: #777; margin-top: 0.8mm; line-height: 1.3; }
  .meaning      { color: #555; }

  .boxes { display: flex; gap: 1.8mm; flex-wrap: nowrap; }

  /* 田字格 */
  .box {
    width: 20mm; height: 20mm;
    border: 1.5px solid #aaa;
    border-radius: 2px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    background: white;
  }

  .tian-h {
    position: absolute;
    top: 50%; left: 0; right: 0;
    border-top: 1px dashed #ccc;
    transform: translateY(-0.5px);
  }
  .tian-v {
    position: absolute;
    left: 50%; top: 0; bottom: 0;
    border-left: 1px dashed #ccc;
    transform: translateX(-0.5px);
  }

  /* 臨摹格 */
  .trace-box { background: #fffdf7; border-color: #E8A000; }

  .trace-char {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 44pt;
    color: rgba(0, 0, 0, 0.09);
    line-height: 1;
    pointer-events: none;
    user-select: none;
    font-family: 'PingFang TC', 'Heiti TC', serif;
  }
  .trace-label {
    position: absolute;
    bottom: 1mm; right: 1.5mm;
    font-size: 5pt;
    color: #E8A000;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  /* ── Print button (hidden on print) ── */
  .print-fab {
    position: fixed;
    bottom: 28px; right: 24px;
    background: #E8A000;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 15px 28px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(232,160,0,0.45);
    z-index: 9999;
    font-family: inherit;
    letter-spacing: 0.3px;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .print-fab:active {
    transform: scale(0.96);
    box-shadow: 0 2px 10px rgba(232,160,0,0.35);
  }

  @media print {
    body       { background: white; padding: 0; }
    .page      { box-shadow: none; border-radius: 0; margin: 0; }
    .print-fab { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="sheet-header">
    <div class="sheet-title">✏️ ${title}</div>
    <div class="sheet-meta">
      <div class="sheet-field">
        ${nameLbl}<span class="sheet-line"></span>
      </div>
      <div class="sheet-field">
        ${dateLbl}<span class="sheet-line"></span>
      </div>
    </div>
  </div>

  ${rows}
</div>

<button class="print-fab" onclick="window.print()">
  ${printLbl}
</button>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PracticeSheetScreen({ navigation }: any) {
  const { t }        = useTranslation();
  const language     = useProgressStore(s => s.language);
  const wordProgress = useProgressStore(s => s.wordProgress);

  const learnedWords = ALL_WORDS.filter(w => wordProgress[w.id]?.learned);

  const [screen, setScreen]     = useState<ScreenState>('select');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const webViewRef = useRef<WebView>(null);

  // ── 多選 ────────────────────────────────────────────────────
  const toggleWord = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll  = () => setSelected(new Set(learnedWords.map(w => w.id)));
  const selectNone = () => setSelected(new Set());

  // ── 生成練習紙 ───────────────────────────────────────────────
  const handleGenerate = () => {
    if (selected.size === 0) return;
    setScreen('preview');
  };

  const selectedWords = learnedWords.filter(w => selected.has(w.id));
  const html = screen === 'preview'
    ? buildSheetHTML(selectedWords, language)
    : '';

  // ── 列印（從 header 按鈕）────────────────────────────────────
  const handlePrint = () => {
    webViewRef.current?.injectJavaScript('window.print(); true;');
  };

  // ════════════════════════════════════════════════════════════
  // ① 空字庫
  // ════════════════════════════════════════════════════════════
  if (learnedWords.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <Header
          title={t('sheetMode')}
          onBack={() => navigation.goBack()}
        />
        <View style={s.emptyBox}>
          <AppText style={s.emptyEmoji}>📄</AppText>
          <AppText style={s.emptyText}>{t('sheetNoWords')}</AppText>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()}>
            <AppText style={s.primaryBtnText}>{t('back')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════
  // ③ 預覽畫面
  // ════════════════════════════════════════════════════════════
  if (screen === 'preview') {
    return (
      <SafeAreaView style={s.safe}>
        <Header
          title={t('sheetPreviewTitle')}
          onBack={() => setScreen('select')}
          right={
            <TouchableOpacity style={s.printBtn} onPress={handlePrint}>
              <Ionicons name="print-outline" size={18} color="#fff" />
              <AppText style={s.printBtnText}>
                {language === 'en' ? 'Print' : '列印'}
              </AppText>
            </TouchableOpacity>
          }
        />
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={{ flex: 1 }}
          javaScriptEnabled
          scalesPageToFit={false}
          scrollEnabled
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════
  // ② 選字畫面
  // ════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.safe}>
      <Header
        title={t('sheetMode')}
        onBack={() => navigation.goBack()}
      />

      {/* 工具列 */}
      <View style={s.toolbar}>
        <AppText style={s.toolbarLabel}>
          {t('sheetSelected').replace('{n}', String(selected.size))}
        </AppText>
        <View style={s.toolbarBtns}>
          <TouchableOpacity style={s.toolBtn} onPress={selectAll}>
            <AppText style={s.toolBtnText}>{t('sheetSelectAll')}</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolBtn} onPress={selectNone}>
            <AppText style={s.toolBtnText}>{t('sheetSelectNone')}</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 字詞 Grid */}
      <FlatList
        data={learnedWords}
        keyExtractor={w => String(w.id)}
        numColumns={4}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.gridRow}
        renderItem={({ item }) => {
          const active = selected.has(item.id);
          return (
            <TouchableOpacity
              style={[s.tile, active && s.tileActive]}
              onPress={() => toggleWord(item.id)}
              activeOpacity={0.72}
            >
              {active && (
                <View style={s.checkBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
              <AppText style={[s.tileChar, active && s.tileCharActive]}>
                {item.character}
              </AppText>
              <AppText style={s.tileJyut} numberOfLines={1}>
                {item.jyutping}
              </AppText>
            </TouchableOpacity>
          );
        }}
      />

      {/* 底部生成按鈕 */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.generateBtn, selected.size === 0 && s.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={selected.size === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <AppText style={s.generateBtnText}>
            {t('sheetGenerate')}
            {selected.size > 0 ? `  (${selected.size})` : ''}
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── 共用 Header ──────────────────────────────────────────────
function Header({
  title, onBack, right,
}: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={22} color={Colors.text} />
      </TouchableOpacity>
      <AppText style={s.headerTitle}>{title}</AppText>
      <View style={{ minWidth: 72, alignItems: 'flex-end' }}>
        {right ?? null}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5,  borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700', color: Colors.text,
  },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  printBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── 空字庫 ──
  emptyBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyText:  { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },

  // ── 工具列 ──
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  toolbarLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  toolbarBtns:  { flexDirection: 'row', gap: 8 },
  toolBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.45, shadowRadius: 6, elevation: 4,
    borderTopWidth: 1, borderLeftWidth: 1,
    borderBottomWidth: 1, borderRightWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  toolBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  // ── Grid ──
  grid:    { padding: 12, paddingBottom: 16, gap: 8 },
  gridRow: { gap: 8 },
  tile: {
    width: TILE, height: TILE + 12,
    borderRadius: 14, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center', gap: 2,
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 5,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
    position: 'relative',
  },
  tileActive: {
    backgroundColor: Colors.primaryMuted,
    borderTopColor: Colors.primary, borderLeftColor: Colors.primary,
    borderBottomColor: Colors.primary, borderRightColor: Colors.primary,
  },
  checkBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  tileChar:       { fontSize: 26, fontWeight: '700', color: Colors.text },
  tileCharActive: { color: Colors.primary },
  tileJyut:       { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  // ── 底部 ──
  bottomBar: {
    padding: 16, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    backgroundColor: Colors.primaryBg,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 15, borderRadius: 16,
    shadowColor: Colors.primary, shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  generateBtnDisabled: { backgroundColor: Colors.textMuted, shadowOpacity: 0 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // ── 共用 ──
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
