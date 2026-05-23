/**
 * PracticeScreen — 自由練習模式
 *
 * 流程：
 *   ① 選字畫面：已學字詞 Grid，點選進入
 *   ② 練習畫面：
 *       animating → 示範筆順（附數字徽章）
 *       ready     → [開始練習] 按鈕
 *       writing   → HanziWriter quiz，可隨時重播示範
 *       done      → 顯示結果，[再練] [換字]
 *
 * 字庫：只用 wordProgress[id].learned === true 的字
 * 無分數壓力，可無限重練
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import PronButton from '../components/PronButton';
import HanziWriterView, { HanziWriterHandle } from '../components/HanziWriterView';
import { useProgressStore } from '../store/useProgressStore';
import { useAudio } from '../hooks/useAudio';
import { ALL_WORDS } from '../data/allWords';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import { playSFX } from '../services/sfxService';
import type { Word } from '../types/word';

const { width: SW } = Dimensions.get('window');
const CANVAS_SIZE = SW;
const TILE_SIZE   = (SW - 48 - 24) / 4;   // 4 columns

type WritePhase = 'animating' | 'ready' | 'writing' | 'done';

export default function PracticeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const language    = useProgressStore(s => s.language);
  const wordProgress = useProgressStore(s => s.wordProgress);
  const { playWord } = useAudio();

  // ── 已學字庫 ───────────────────────────────────────────────
  const learnedWords = ALL_WORDS.filter(w => wordProgress[w.id]?.learned);

  // ── 狀態 ───────────────────────────────────────────────────
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [writePhase, setWritePhase]     = useState<WritePhase>('animating');
  const [mistakes, setMistakes]         = useState(0);
  const [writerKey, setWriterKey]       = useState(0);

  const writerRef = useRef<HanziWriterHandle>(null);

  // ── 選字 ────────────────────────────────────────────────────
  const handleSelectWord = useCallback((word: Word) => {
    setSelectedWord(word);
    setWritePhase('animating');
    setMistakes(0);
    setWriterKey(k => k + 1);
  }, []);

  // ── 動畫完成 → 顯示「開始練習」───────────────────────────────
  const handleAnimationComplete = useCallback(() => {
    setWritePhase('ready');
  }, []);

  // ── 開始練習（quiz mode）─────────────────────────────────────
  const handleStartWriting = useCallback(() => {
    setWritePhase('writing');
    writerRef.current?.startQuizNoNumbers();
  }, []);

  // ── 重播示範 ─────────────────────────────────────────────────
  const handleReplay = useCallback(() => {
    setWritePhase('animating');
    writerRef.current?.replay();
  }, []);

  // ── Quiz 完成 ────────────────────────────────────────────────
  const handleQuizComplete = useCallback((totalMistakes: number) => {
    setMistakes(totalMistakes);
    setWritePhase('done');
    playSFX(totalMistakes === 0 ? 'correct' : 'wrong');
  }, []);

  // ── 再練一次 ─────────────────────────────────────────────────
  const handleAgain = useCallback(() => {
    setWritePhase('animating');
    setMistakes(0);
    setWriterKey(k => k + 1);
  }, []);

  // ── 返回選字 ─────────────────────────────────────────────────
  const handleBackToPick = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const playCantonese = useCallback(() => {
    if (selectedWord) playWord(selectedWord.character, 'cantonese');
  }, [selectedWord, playWord]);

  const playMandarin = useCallback(() => {
    if (selectedWord) playWord(selectedWord.character, 'mandarin');
  }, [selectedWord, playWord]);

  // ═══════════════════════════════════════════════════════════
  // ① 空字庫
  // ═══════════════════════════════════════════════════════════
  if (learnedWords.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <Header title={t('practiceMode')} onBack={() => navigation.goBack()} />
        <View style={s.emptyBox}>
          <AppText style={s.emptyEmoji}>✏️</AppText>
          <AppText style={s.emptyText}>{t('practiceNoWords')}</AppText>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()}>
            <AppText style={s.primaryBtnText}>{t('back')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ② 選字畫面
  // ═══════════════════════════════════════════════════════════
  if (!selectedWord) {
    return (
      <SafeAreaView style={s.safe}>
        <Header title={t('practiceMode')} onBack={() => navigation.goBack()} />
        <AppText style={s.selectLabel}>{t('practiceSelectWord')}</AppText>
        <FlatList
          data={learnedWords}
          keyExtractor={w => String(w.id)}
          numColumns={4}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.tile}
              onPress={() => handleSelectWord(item)}
              activeOpacity={0.75}
            >
              <AppText style={s.tileChar}>{item.character}</AppText>
              <AppText style={s.tileJyut} numberOfLines={1}>{item.jyutping}</AppText>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ③ 練習畫面
  // ═══════════════════════════════════════════════════════════
  const meaning = language === 'en'
    ? selectedWord.meaning_en
    : selectedWord.meaning_zh;

  const practiceChar = selectedWord.character.length === 1
    ? selectedWord.character
    : selectedWord.character[0];

  return (
    <SafeAreaView style={s.safe}>
      <Header
        title={t('practiceMode')}
        onBack={handleBackToPick}
        right={
          <TouchableOpacity style={s.switchBtn} onPress={handleBackToPick}>
            <AppText style={s.switchBtnText}>{t('practiceSwitch')}</AppText>
          </TouchableOpacity>
        }
      />

      {/* 字資訊卡 */}
      <View style={s.infoCard}>
        <View style={s.infoLeft}>
          <AppText style={s.infoChar}>{selectedWord.character}</AppText>
          <AppText style={s.infoJyut}>{selectedWord.jyutping}</AppText>
          <AppText style={s.infoMeaning}>{meaning}</AppText>
        </View>
        <View style={s.pronCol}>
          <PronButton lang="cantonese" size="sm" onPress={playCantonese} />
          <PronButton lang="mandarin"  size="sm" onPress={playMandarin} />
        </View>
      </View>

      {/* HanziWriter 畫布 */}
      <View style={s.canvasWrap}>
        <HanziWriterView
          key={writerKey}
          ref={writerRef}
          character={practiceChar}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          showOutline={true}
          showCharacter={true}
          animateOnLoad={true}
          containerStyle={{ borderRadius: 0 }}
          onAnimationComplete={handleAnimationComplete}
          onQuizComplete={handleQuizComplete}
        />

        {/* 完成 overlay */}
        {writePhase === 'done' && (
          <View style={s.doneOverlay}>
            <View style={[s.doneBadge, { backgroundColor: mistakes === 0 ? '#DCFCE7' : '#FEF3C7' }]}>
              <AppText style={s.doneEmoji}>{mistakes === 0 ? '🎉' : '💪'}</AppText>
              <AppText style={[s.doneText, { color: mistakes === 0 ? '#16A34A' : '#B45309' }]}>
                {mistakes === 0
                  ? t('practicePerfect')
                  : t('practiceMistakes').replace('{n}', String(mistakes))}
              </AppText>
              <View style={s.doneActions}>
                <TouchableOpacity style={s.primaryBtn} onPress={handleAgain}>
                  <AppText style={s.primaryBtnText}>{t('practiceAgain')}</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={s.ghostBtn} onPress={handleBackToPick}>
                  <AppText style={s.ghostBtnText}>{t('practiceSwitch')}</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 底部操作列 */}
      <View style={s.bottomBar}>
        {writePhase === 'animating' && (
          <AppText style={s.watchingText}>{t('practiceWatch')}</AppText>
        )}

        {writePhase === 'ready' && (
          <TouchableOpacity style={[s.primaryBtn, s.fullBtn]} onPress={handleStartWriting}>
            <AppText style={s.primaryBtnText}>{t('practiceStart')}</AppText>
          </TouchableOpacity>
        )}

        {writePhase === 'writing' && (
          <TouchableOpacity style={s.replayBtn} onPress={handleReplay}>
            <Ionicons name="play-circle-outline" size={20} color={Colors.primary} />
            <AppText style={s.replayBtnText}>{t('practiceReplay')}</AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── 共用 Header 元件 ─────────────────────────────────────────
function Header({ title, onBack, right }: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={22} color={Colors.text} />
      </TouchableOpacity>
      <AppText style={s.headerTitle}>{title}</AppText>
      <View style={{ width: 80, alignItems: 'flex-end' }}>{right ?? null}</View>
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
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700', color: Colors.text,
  },
  switchBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
    borderTopWidth: 1, borderLeftWidth: 1,
    borderBottomWidth: 1, borderRightWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  switchBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // ── 空字庫 ──
  emptyBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyText:  { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },

  // ── 選字 Grid ──
  selectLabel: {
    fontSize: 15, fontWeight: '600', color: Colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  grid:    { paddingHorizontal: 12, paddingBottom: 32, gap: 10 },
  gridRow: { gap: 8 },
  tile: {
    width: TILE_SIZE, height: TILE_SIZE + 12,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center', gap: 2,
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.55, shadowRadius: 8, elevation: 5,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  tileChar: { fontSize: 26, fontWeight: '700', color: Colors.text },
  tileJyut: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  // ── 字資訊卡 ──
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 6,
    borderRadius: 16, padding: 16,
    backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  infoLeft:    { flex: 1, gap: 2 },
  infoChar:    { fontSize: 36, fontWeight: '800', color: Colors.text },
  infoJyut:    { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' },
  infoMeaning: { fontSize: 14, color: Colors.textMuted },
  pronCol:     { gap: 8, alignItems: 'flex-end' },

  // ── Canvas ──
  canvasWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative', alignSelf: 'stretch',
  },

  // ── 完成 overlay ──
  doneOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(251,249,241,0.88)',
  },
  doneBadge: {
    borderRadius: 24, paddingHorizontal: 32, paddingVertical: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
    minWidth: 240,
  },
  doneEmoji:   { fontSize: 48 },
  doneText:    { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  doneActions: { flexDirection: 'row', gap: 10, marginTop: 4 },

  // ── 底部 ──
  bottomBar: {
    minHeight: 72,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  watchingText: { fontSize: 15, color: Colors.textMuted, fontStyle: 'italic' },
  fullBtn: { alignSelf: 'stretch' },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, backgroundColor: Colors.primaryBg,
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  replayBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  // ── 共用按鈕 ──
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 14, alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  ghostBtn: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 14, alignItems: 'center',
    shadowColor: '#C4BFA8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)', borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)', borderRightColor: 'rgba(180,175,155,0.4)',
  },
  ghostBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
});
