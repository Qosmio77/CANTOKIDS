/**
 * BossBattleScreen — 打 Boss 關卡
 *
 * 玩法：
 * - 每關 Boss 有 10 滴血 (HP)
 * - 題目：看漢字 → 選正確中文意思（4 選 1）
 * - 答對：Boss HP -1（愛心漸減）
 * - 答錯：玩家體力 -1（愛心漸減）
 * - 體力歸零 → 失敗畫面
 * - Boss HP 歸零 → 勝利畫面 + 100 XP + defeatBoss
 *
 * 導航參數：{ bossId: string }
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import {
  BOSSES,
  BossDef,
  useProgressStore,
  getRankByXP,
  getBossName,
  XP_PER_BOSS_DEFEATED,
} from '../store/useProgressStore';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS,
  BAMBOO_WORDS, JADE_WORDS,
} from '../data/allWords';
import { Word } from '../types/word';
import LevelUpModal from '../components/LevelUpModal';
import TreasureDropModal from '../components/TreasureDropModal';
import { rollLoot } from '../services/lootService';
import { playSFX } from '../services/sfxService';
import { Treasure } from '../data/treasures';
import { Colors, CHAR_FONT } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';

// ── 取得對應 level 的單字陣列 ──────────────────────────────────────
function getWordsForBoss(boss: BossDef): Word[] {
  switch (boss.levelKey) {
    case 'seedling':  return SEEDLING_WORDS;
    case 'sapling':   return SAPLING_WORDS;
    case 'tree':      return TREE_WORDS;
    case 'sunflower': return SUNFLOWER_WORDS;
    case 'rainbow':   return RAINBOW_WORDS;
    case 'galaxy':    return GALAXY_WORDS;
    case 'bamboo':    return BAMBOO_WORDS;
    case 'jade':      return JADE_WORDS;
  }
}

// ── Fisher-Yates 洗牌 ──────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 題目結構 ───────────────────────────────────────────────────────
interface Question {
  word: Word;           // 顯示這個字
  options: string[];    // 4 個意思選項（中文）
  correct: string;      // 正確答案
}

// ── 產生 N 道題目（不重複）────────────────────────────────────────
function buildQuestions(words: Word[], count: number): Question[] {
  const pool = shuffle(words).slice(0, Math.min(words.length, count));
  return pool.map((word) => {
    const correct = word.meaning_zh;
    // 從其他字挑 3 個作為干擾
    const others = shuffle(words.filter((w) => w.id !== word.id))
      .slice(0, 3)
      .map((w) => w.meaning_zh);
    const options = shuffle([correct, ...others]);
    return { word, options, correct };
  });
}

// ────────────────────────────────────────────────────────────────────

type Phase = 'battle' | 'win';

const BOSS_MAX_HP = 10;

export default function BossBattleScreen({ route, navigation }: any) {
  const { bossId } = route.params as { bossId: string };

  const boss = useMemo(() => BOSSES.find((b) => b.id === bossId)!, [bossId]);
  const words = useMemo(() => getWordsForBoss(boss), [boss]);
  const questions = useMemo(() => buildQuestions(words, BOSS_MAX_HP), [words]);

  const {
    playerXP,
    addXP,
    defeatBoss,
    addTreasures,
    bossesDefeated,
    language,
    unlockCreature,
  } = useProgressStore();

  // Boss → creature mapping
  const BOSS_TO_CREATURE: Record<string, string> = {
    boss_seedling:  'fox',
    boss_sapling:   'tiger',
    boss_tree:      'phoenix',
    boss_sunflower: 'qilin',
    boss_rainbow:   'dragon',
    boss_galaxy:    'pixiu',
    boss_bamboo:    'xuanwu',
  };

  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('battle');
  const [qIndex, setQIndex] = useState(0);
  const [bossHP, setBossHP] = useState(BOSS_MAX_HP);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRank, setNewRank] = useState(getRankByXP(playerXP));
  const [droppedTreasures, setDroppedTreasures] = useState<Treasure[]>([]);
  const [showTreasureModal, setShowTreasureModal] = useState(false);

  // Boss 抖動動畫（受傷）
  const bossShake = useRef(new Animated.Value(0)).current;
  // Boss 閃爍動畫（玩家受傷）
  const bossOpacity = useRef(new Animated.Value(1)).current;

  const currentQ = questions[qIndex];

  // Boss 受傷抖動
  const animateBossHurt = useCallback(() => {
    bossShake.setValue(0);
    Animated.sequence([
      Animated.timing(bossShake, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(bossShake, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(bossShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(bossShake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(bossShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [bossShake]);

  // 玩家受傷閃爍
  const animatePlayerHurt = useCallback(() => {
    bossOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(bossOpacity, { toValue: 0.2, duration: 100, useNativeDriver: true }),
      Animated.timing(bossOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(bossOpacity, { toValue: 0.2, duration: 100, useNativeDriver: true }),
      Animated.timing(bossOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [bossOpacity]);

  const handleSelect = useCallback(
    (option: string) => {
      if (selectedOption !== null) return; // 防止重複點選
      setSelectedOption(option);

      const correct = option === currentQ.correct;
      setIsCorrect(correct);

      if (correct) {
        playSFX('correct');
        // Boss 受傷
        animateBossHurt();
        const newHP = bossHP - 1;
        setBossHP(newHP);

        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
          if (newHP <= 0) {
            // 勝利！
            const leveledUp = addXP(XP_PER_BOSS_DEFEATED);
            defeatBoss(bossId);
            // 解鎖對應神獸
            const creatureId = BOSS_TO_CREATURE[bossId];
            if (creatureId) unlockCreature(creatureId);
            if (leveledUp) {
              // 使用 store 最新 XP（addXP 已更新），避免閉包舊值
              const freshXP = useProgressStore.getState().playerXP;
              const rank = getRankByXP(freshXP);
              setNewRank(rank);
              setShowLevelUp(true);
            }
            // 寶物掉落
            const loot = rollLoot(boss.levelKey);
            if (loot.length > 0) {
              addTreasures(loot);
              setDroppedTreasures(loot);
              setShowTreasureModal(true);
            }
            setPhase('win');
          } else {
            setQIndex((prev) => prev + 1);
          }
        }, 700);
      } else {
        playSFX('wrong');
        // 玩家受傷
        animatePlayerHurt();

        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
          // 繼續同一題（讓玩家再試）
          // 也可前進 → 這裡選前進（更友善）
          if (qIndex < questions.length - 1) {
            setQIndex((prev) => prev + 1);
          } else {
            setQIndex(0); // 循環
          }
        }, 700);
      }
    },
    [selectedOption, currentQ, bossHP, qIndex, questions]
  );

  // ── HP 愛心列 ──────────────────────────────────────────────────────
  const HPBar = ({ current, max, color }: { current: number; max: number; color: string }) => (
    <View style={styles.hpRow}>
      {Array.from({ length: max }).map((_, i) => (
        <AppText key={i} style={styles.hpHeart}>
          {i < current ? '❤️' : '🖤'}
        </AppText>
      ))}
    </View>
  );

  // ────────────────────────────────────────────────────────────────────
  if (phase === 'win') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: boss.bgColor }]}>
        <View style={styles.endContainer}>
          <AppText style={styles.endEmoji}>{boss.emoji}</AppText>
          <AppText style={styles.endTitle}>{t('bossVictoryTitle')}</AppText>
          <AppText style={styles.endSubtitle}>
            {t('bossVictoryDesc').replace('{name}', getBossName(boss, language)).replace('{xp}', String(XP_PER_BOSS_DEFEATED))}
          </AppText>
          <TouchableOpacity
            style={[styles.endBtn, { backgroundColor: boss.color }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('bossBackToMap')}
          >
            <AppText style={styles.endBtnText}>{t('bossBackToMap')}</AppText>
          </TouchableOpacity>
        </View>
        <LevelUpModal
          visible={showLevelUp}
          newRank={newRank}
          onClose={() => setShowLevelUp(false)}
        />
        <TreasureDropModal
          visible={showTreasureModal}
          treasures={droppedTreasures}
          onClose={() => setShowTreasureModal(false)}
        />
      </SafeAreaView>
    );
  }

  // ── 戰鬥畫面 ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: boss.bgColor }]}>
      {/* 頂部欄 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={boss.color} />
        </TouchableOpacity>
        <AppText style={[styles.topTitle, { color: boss.color }]}>{t('bossBattleTitle')}</AppText>
      </View>

      {/* Boss 區塊 */}
      <View style={styles.bossSection}>
        {/* Boss 名稱 */}
        <AppText style={[styles.bossName, { color: boss.color }]}>{getBossName(boss, language)}</AppText>

        {/* Boss HP */}
        <HPBar current={bossHP} max={BOSS_MAX_HP} color={boss.color} />

        {/* Boss 角色 */}
        <Animated.View
          style={[
            styles.bossEmojiWrapper,
            {
              transform: [{ translateX: bossShake }],
              opacity: bossOpacity,
              backgroundColor: boss.color + '22',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 7,
            },
          ]}
        >
          <AppText style={styles.bossEmoji}>{boss.emoji}</AppText>
        </Animated.View>

        {/* 進度 */}
        <AppText style={[styles.progressLabel, { color: boss.color }]}>
          {t('bossProgressLabel')
            .replace('{current}', String(qIndex + 1))
            .replace('{total}', String(questions.length))}
        </AppText>
      </View>

      {/* 題目區塊 */}
      {currentQ && (
        <View style={styles.questionSection}>
          {/* 顯示漢字 */}
          <View style={styles.charBox}>
            <AppText style={styles.charText}>{currentQ.word.character}</AppText>
            <AppText style={styles.charPinyin}>{currentQ.word.jyutping}</AppText>
          </View>

          {/* 選項 */}
          <View style={styles.optionsGrid}>
            {currentQ.options.map((opt) => {
              const sel = selectedOption === opt;
              const isRight = sel && isCorrect;
              const isWrong = sel && !isCorrect;
              const isReveal = selectedOption !== null && opt === currentQ.correct && !isCorrect;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionBtn,
                    isRight && styles.optionCorrect,
                    isWrong && styles.optionWrong,
                    isReveal && styles.optionReveal,
                  ]}
                  onPress={() => handleSelect(opt)}
                  disabled={selectedOption !== null}
                  accessibilityLabel={opt}
                >
                  <AppText
                    style={[
                      styles.optionText,
                      (isRight || isReveal) && styles.optionTextCorrect,
                      isWrong && styles.optionTextWrong,
                    ]}
                  >
                    {opt}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topTitle: { fontSize: 17, fontWeight: '800' },

  bossSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 6,
  },
  bossName: { fontSize: 20, fontWeight: '800' },
  hpRow: {
    flexDirection: 'row',
    gap: 3,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hpHeart: { fontSize: 18 },
  bossEmojiWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  bossEmoji: { fontSize: 60 },
  progressLabel: { fontSize: 13, fontWeight: '600' },

  questionSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  charBox: {
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: '#C4BFA8',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)',
    borderRightColor: 'rgba(180,175,155,0.4)',
  },
  charText: { fontSize: 64, fontFamily: CHAR_FONT, fontWeight: '400', color: '#1F2937', lineHeight: 72 },
  charPinyin: { fontSize: 16, color: '#9CA3AF', fontWeight: '600', marginTop: 4 },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionBtn: {
    width: '46%',
    backgroundColor: Colors.primaryBg,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#C4BFA8',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(180,175,155,0.4)',
    borderRightColor: 'rgba(180,175,155,0.4)',
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderTopColor: '#10B981',
    borderLeftColor: '#10B981',
    borderBottomColor: '#10B981',
    borderRightColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: '#FEF2F2',
    borderTopColor: '#EF4444',
    borderLeftColor: '#EF4444',
    borderBottomColor: '#EF4444',
    borderRightColor: '#EF4444',
  },
  optionReveal: {
    backgroundColor: '#ECFDF5',
    borderTopColor: '#10B981',
    borderLeftColor: '#10B981',
    borderBottomColor: '#10B981',
    borderRightColor: '#10B981',
  },
  optionText:     { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  optionTextCorrect: { color: '#065F46' },
  optionTextWrong:   { color: '#991B1B' },

  // 結束畫面
  endContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  endEmoji: { fontSize: 80 },
  endTitle: { fontSize: 32, fontWeight: '900', color: '#1F2937', textAlign: 'center' },
  endSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  endBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  endBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
});
