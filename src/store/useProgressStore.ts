import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Treasure } from '../data/treasures';

// ── 玩家等級定義 ────────────────────────────────────────────────────
export interface PlayerRank {
  level: number;
  name: string;      // 繁體中文名稱
  name_en: string;   // English name
  name_sc: string;   // 简体中文名称
  emoji: string;
  xpRequired: number;
}

export const PLAYER_RANKS: PlayerRank[] = [
  { level: 1, name: '蛋蛋', name_en: 'Egg',         name_sc: '蛋蛋', emoji: '🥚', xpRequired: 0    },
  { level: 2, name: '小雞', name_en: 'Chick',       name_sc: '小鸡', emoji: '🐣', xpRequired: 100  },
  { level: 3, name: '黃雀', name_en: 'Sparrow',     name_sc: '黄雀', emoji: '🐤', xpRequired: 250  },
  { level: 4, name: '小鷹', name_en: 'Eagle',       name_sc: '小鹰', emoji: '🦅', xpRequired: 500  },
  { level: 5, name: '幼獅', name_en: 'Lion Cub',    name_sc: '幼狮', emoji: '🦁', xpRequired: 800  },
  { level: 6, name: '小龍', name_en: 'Dragon',      name_sc: '小龙', emoji: '🐉', xpRequired: 1200 },
  { level: 7, name: '星靈', name_en: 'Star Spirit', name_sc: '星灵', emoji: '🌟', xpRequired: 1800 },
  { level: 8, name: '傳說', name_en: 'Legend',      name_sc: '传说', emoji: '👑', xpRequired: 2500 },
];

/** 根據語言回傳正確的等級名稱 */
export function getRankName(rank: PlayerRank, language: 'zh' | 'en' | 'sc'): string {
  if (language === 'en') return rank.name_en;
  if (language === 'sc') return rank.name_sc;
  return rank.name;
}

export const XP_PER_WORD_LEARNED  = 15;          // 學會新字
export const XP_PER_QUIZ_CORRECT  = 5;           // 測驗答對
export const XP_PER_PERFECT_QUIZ  = 25;          // 完美測驗額外獎勵
export const XP_PER_BOSS_DEFEATED = 100;         // 擊敗 Boss
export const XP_PER_DAILY_LOGIN   = 10;          // 每日登入

/** 根據累積 XP 回傳當前等級資料 */
export function getRankByXP(xp: number): PlayerRank {
  const ranks = [...PLAYER_RANKS].reverse();
  return ranks.find((r) => xp >= r.xpRequired) ?? PLAYER_RANKS[0];
}

/** 回傳下一個等級（若已滿等回傳 null） */
export function getNextRank(currentLevel: number): PlayerRank | null {
  return PLAYER_RANKS.find((r) => r.level === currentLevel + 1) ?? null;
}

// ── Boss 定義 ────────────────────────────────────────────────────────
export interface BossDef {
  id: string;
  levelKey: 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy' | 'bamboo' | 'jade';
  name: string;       // 繁體中文
  name_en: string;    // English
  name_sc: string;    // 简体中文
  emoji: string;
  hp: number;           // 需要答對幾題才能擊敗
  color: string;
  bgColor: string;
}

export function getBossName(boss: BossDef, language: string): string {
  if (language === 'en') return boss.name_en;
  if (language === 'sc') return boss.name_sc;
  return boss.name;
}

export const BOSSES: BossDef[] = [
  { id: 'boss_seedling',  levelKey: 'seedling',  name: '幼苗小龍',   name_en: 'Seedling Dragon', name_sc: '幼苗小龙',   emoji: '🐲', hp: 10, color: '#10B981', bgColor: '#ECFDF5' },
  { id: 'boss_sapling',   levelKey: 'sapling',   name: '森林狐狸',   name_en: 'Forest Fox',      name_sc: '森林狐狸',   emoji: '🦊', hp: 10, color: '#F59E0B', bgColor: '#FFFBEB' },
  { id: 'boss_tree',      levelKey: 'tree',      name: '大樹猛虎',   name_en: 'Tree Tiger',       name_sc: '大树猛虎',   emoji: '🐯', hp: 10, color: '#EF4444', bgColor: '#FEF2F2' },
  { id: 'boss_sunflower', levelKey: 'sunflower', name: '數字精靈',   name_en: 'Number Sprite',    name_sc: '数字精灵',   emoji: '🌻', hp: 10, color: '#F97316', bgColor: '#FFF7ED' },
  { id: 'boss_rainbow',   levelKey: 'rainbow',   name: '彩虹守護者', name_en: 'Rainbow Guardian', name_sc: '彩虹守护者', emoji: '🌈', hp: 10, color: '#8B5CF6', bgColor: '#F5F3FF' },
  { id: 'boss_galaxy',    levelKey: 'galaxy',    name: '星河神龍',   name_en: 'Galaxy Dragon',    name_sc: '星河神龙',   emoji: '🌟', hp: 10, color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'boss_bamboo',   levelKey: 'bamboo',   name: '竹林書生',   name_en: 'Bamboo Scholar',    name_sc: '竹林书生',   emoji: '🦉', hp: 10, color: '#059669', bgColor: '#ECFDF5' },
  { id: 'boss_jade',     levelKey: 'jade',     name: '玉龍聖賢',   name_en: 'Jade Sage',          name_sc: '玉龙圣贤',   emoji: '🐉', hp: 10, color: '#4F46E5', bgColor: '#EEF2FF' },
];

// ────────────────────────────────────────────────────────────────────

interface WordProgress {
  wordId: number;
  learned: boolean;
  correctCount: number;
  wrongCount: number;
  lastPracticed: string;
}

interface ProgressState {
  userId: string | null;
  displayName: string;

  wordProgress: Record<number, WordProgress>;
  totalStars: number;
  unlockedLessons: number[];

  perfectQuizzes: number;
  streakDays: number;
  lastStudyDate: string | null;

  // Phase 3
  parentPin: string | null;
  isPremium: boolean;

  // Phase 4
  onboardingDone: boolean;

  // Phase 5
  totalCorrect: number;
  totalAnswers: number;

  // Phase 6: RPG 系統
  playerXP: number;                 // 累積 XP
  playerLevel: number;              // 當前等級（1–8）
  bossesDefeated: string[];         // 已擊敗的 boss id 列表

  // Phase 7: 寶物系統
  treasures: Record<string, number>; // treasureId → 擁有數量

  // i18n
  language: 'zh' | 'en' | 'sc';

  // BGM
  bgmEnabled: boolean;

  // ── Creature System ──────────────────────────────────────
  /** creatureId → { stage, xp, unlockedAt, customName } */
  creatureProgress: Record<string, {
    stage: 0 | 1 | 2 | 3;
    xp: number;
    unlockedAt: number;
    customName?: string;
  }>;
  foodCount: number;

  // ── Daily Tasks ──────────────────────────────────────────
  /** 今天已完成的任務 id 列表（每天重置） */
  dailyTasksDone: string[];
  /** 最後一次任務日期 'YYYY-MM-DD' */
  dailyTasksDate: string;
  /** 今天已領取食物獎勵 */
  dailyFoodClaimed: boolean;

  // ── Hatchling Challenge ───────────────────────────────────
  hatchlingStartDate: string;      // '' = 未開始
  hatchlingDaysDone: number;       // 已完成天數 (0–7)
  hatchlingComplete: boolean;
  hatchlingLastAdvance: string;    // 最後推進日期 'YYYY-MM-DD'

  // Placement test
  placementDone: boolean;

  // ── Actions ──
  setUser: (id: string, name: string) => void;
  markWordLearned: (wordId: number) => void;
  recordAnswer: (wordId: number, isCorrect: boolean) => void;
  addStars: (count: number) => void;
  unlockLesson: (lessonId: number) => void;
  getWordProgress: (wordId: number) => WordProgress | undefined;
  incrementPerfectQuiz: () => void;
  checkAndUpdateStreak: () => void;
  resetProgress: () => void;
  setParentPin: (pin: string) => void;
  setPremium: (value: boolean) => void;
  completeOnboarding: () => void;
  incrementTotalAnswers: (correct: boolean) => void;

  // Phase 6 actions
  /** 增加 XP，自動更新 playerLevel，回傳是否剛升級 */
  addXP: (amount: number) => boolean;
  /** 記錄 Boss 擊敗 */
  defeatBoss: (bossId: string) => void;
  /** 新增寶物到庫存 */
  addTreasures: (newTreasures: Treasure[]) => void;
  /** 切換介面語言 */
  setLanguage: (lang: 'zh' | 'en' | 'sc') => void;
  /** 切換背景音樂 */
  toggleBGM: () => void;

  // Creature actions
  /** 解鎖生物（擊敗對應 Boss 時呼叫） */
  unlockCreature: (creatureId: string) => void;
  /** 餵食生物，回傳是否剛進化 */
  feedCreature: (creatureId: string, amount: number) => boolean;
  /** 幫生物命名 */
  nameCreature: (creatureId: string, name: string) => void;
  /** 增加食物 */
  addFood: (amount: number) => void;

  // Daily task actions
  /** 標記今日任務完成，回傳 { allDone, foodEarned } */
  completeDailyTask: (taskId: string) => { allDone: boolean; foodEarned: number };
  /** 領取今日全部完成食物獎勵 */
  claimDailyBonus: () => void;

  // Hatchling challenge
  startHatchlingChallenge: () => void;
  advanceHatchlingDay: () => void;

  // Placement test
  /** 程度測試完成 — 解鎖指定數量的課節並記錄完成 */
  completePlacement: (unlockedCount: number) => void;
}

// ── 時間工具 ─────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function dayDiff(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// ────────────────────────────────────────────────────────────────────
export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      userId: null,
      displayName: '小朋友',
      wordProgress: {},
      totalStars: 0,
      unlockedLessons: [1],
      perfectQuizzes: 0,
      streakDays: 0,
      lastStudyDate: null,
      parentPin: null,
      isPremium: false,
      onboardingDone: false,
      totalCorrect: 0,
      totalAnswers: 0,
      // Phase 6 初始值
      playerXP: 0,
      playerLevel: 1,
      bossesDefeated: [],
      // Phase 7 初始值
      treasures: {},
      // i18n 初始值
      language: 'zh' as const,
      // BGM 初始值
      bgmEnabled: true,
      // Creature system 初始值
      creatureProgress: {},
      foodCount: 0,
      // Daily tasks 初始值
      dailyTasksDone: [],
      dailyTasksDate: '',
      dailyFoodClaimed: false,
      // Hatchling challenge 初始值
      hatchlingStartDate: '',
      hatchlingDaysDone: 0,
      hatchlingComplete: false,
      hatchlingLastAdvance: '',
      // Placement test 初始值
      placementDone: false,

      setUser: (id, name) => set({ userId: id, displayName: name }),

      markWordLearned: (wordId) =>
        set((state) => ({
          wordProgress: {
            ...state.wordProgress,
            [wordId]: {
              wordId,
              learned: true,
              correctCount: state.wordProgress[wordId]?.correctCount ?? 0,
              wrongCount: state.wordProgress[wordId]?.wrongCount ?? 0,
              lastPracticed: new Date().toISOString(),
            },
          },
        })),

      recordAnswer: (wordId, isCorrect) =>
        set((state) => {
          const prev = state.wordProgress[wordId];
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: {
                wordId,
                learned: prev?.learned ?? false,
                correctCount: (prev?.correctCount ?? 0) + (isCorrect ? 1 : 0),
                wrongCount: (prev?.wrongCount ?? 0) + (isCorrect ? 0 : 1),
                lastPracticed: new Date().toISOString(),
              },
            },
          };
        }),

      addStars: (count) =>
        set((state) => ({ totalStars: state.totalStars + count })),

      unlockLesson: (lessonId) =>
        set((state) => ({
          unlockedLessons: state.unlockedLessons.includes(lessonId)
            ? state.unlockedLessons
            : [...state.unlockedLessons, lessonId],
        })),

      getWordProgress: (wordId) => get().wordProgress[wordId],

      incrementPerfectQuiz: () =>
        set((state) => ({ perfectQuizzes: state.perfectQuizzes + 1 })),

      checkAndUpdateStreak: () => {
        const today = todayStr();
        const { lastStudyDate, streakDays } = get();
        if (!lastStudyDate) {
          set({ streakDays: 1, lastStudyDate: today });
          return;
        }
        if (lastStudyDate === today) return;
        const diff = dayDiff(lastStudyDate, today);
        if (diff === 1) {
          set({ streakDays: streakDays + 1, lastStudyDate: today });
        } else {
          set({ streakDays: 1, lastStudyDate: today });
        }
      },

      resetProgress: () =>
        set({
          wordProgress: {},
          totalStars: 0,
          unlockedLessons: [1],
          perfectQuizzes: 0,
          streakDays: 0,
          lastStudyDate: null,
          totalCorrect: 0,
          totalAnswers: 0,
          playerXP: 0,
          playerLevel: 1,
          bossesDefeated: [],
          treasures: {},
        }),

      setParentPin: (pin) => set({ parentPin: pin }),
      setPremium: (value) => set({ isPremium: value }),
      completeOnboarding: () => set({ onboardingDone: true }),
      incrementTotalAnswers: (correct) =>
        set((state) => ({
          totalCorrect: state.totalCorrect + (correct ? 1 : 0),
          totalAnswers: state.totalAnswers + 1,
        })),

      // ── Phase 6 Actions ──────────────────────────────────────────

      addXP: (amount) => {
        const { playerXP, playerLevel } = get();
        const newXP = playerXP + amount;
        const newRank = getRankByXP(newXP);
        const leveledUp = newRank.level > playerLevel;
        set({ playerXP: newXP, playerLevel: newRank.level });
        return leveledUp;
      },

      defeatBoss: (bossId) =>
        set((state) => ({
          bossesDefeated: state.bossesDefeated.includes(bossId)
            ? state.bossesDefeated
            : [...state.bossesDefeated, bossId],
        })),

      addTreasures: (newTreasures) =>
        set((state) => {
          const updated = { ...state.treasures };
          for (const t of newTreasures) {
            updated[t.id] = (updated[t.id] ?? 0) + 1;
          }
          return { treasures: updated };
        }),

      setLanguage: (lang) => set({ language: lang }),
      toggleBGM: () => set((state) => ({ bgmEnabled: !state.bgmEnabled })),

      // ── Creature Actions ─────────────────────────────────────────
      unlockCreature: (creatureId) =>
        set((state) => {
          if (state.creatureProgress[creatureId]) return {};
          return {
            creatureProgress: {
              ...state.creatureProgress,
              [creatureId]: { stage: 0, xp: 0, unlockedAt: Date.now() },
            },
          };
        }),

      feedCreature: (creatureId, amount) => {
        const { creatureProgress, foodCount } = get();
        const cp = creatureProgress[creatureId];
        if (!cp || cp.stage >= 3 || foodCount < amount) return false;
        // Import XP thresholds from creature def
        const { CREATURES } = require('../data/creatures');
        const def = (CREATURES as import('../data/creatures').CreatureDef[]).find((c) => c.id === creatureId);
        if (!def) return false;

        const actualAmount = Math.min(amount, foodCount);
        const newXP  = cp.xp + actualAmount;
        const needed = def.xpToNext[cp.stage as 0|1|2];
        const evolved = newXP >= needed && cp.stage < 3;
        const newStage = evolved ? Math.min(cp.stage + 1, 3) as 0|1|2|3 : cp.stage;
        const leftoverXP = evolved ? newXP - needed : newXP;

        set((state) => ({
          foodCount: state.foodCount - actualAmount,
          creatureProgress: {
            ...state.creatureProgress,
            [creatureId]: {
              ...cp,
              stage: newStage,
              xp: evolved ? leftoverXP : newXP,
            },
          },
        }));
        return evolved;
      },

      nameCreature: (creatureId, name) =>
        set((state) => {
          const cp = state.creatureProgress[creatureId];
          if (!cp) return {};
          return {
            creatureProgress: {
              ...state.creatureProgress,
              [creatureId]: { ...cp, customName: name },
            },
          };
        }),

      addFood: (amount) =>
        set((state) => ({ foodCount: state.foodCount + amount })),

      // ── Daily Task Actions ───────────────────────────────────────
      completeDailyTask: (taskId) => {
        const today = todayStr();
        const state = get();

        // 若日期變了，重置
        const isDifferentDay = state.dailyTasksDate !== today;
        const currentDone    = isDifferentDay ? [] : state.dailyTasksDone;
        const alreadyDone    = currentDone.includes(taskId);

        if (alreadyDone) return { allDone: false, foodEarned: 0 };

        const newDone  = [...currentDone, taskId];
        const allDone  = newDone.length >= 3; // 3 tasks per day
        const foodEarned = 1; // 1 food per task

        // 孵蛋挑戰：全部任務完成 → 推進一天
        let hatchlingUpdates: Partial<ProgressState> = {};
        if (allDone &&
            state.hatchlingStartDate &&
            !state.hatchlingComplete &&
            state.hatchlingLastAdvance !== today) {
          const newDays = state.hatchlingDaysDone + 1;
          const nowComplete = newDays >= 7;
          hatchlingUpdates = {
            hatchlingDaysDone:   newDays,
            hatchlingLastAdvance: today,
            hatchlingComplete:   nowComplete,
          };
          // Day 7：自動解鎖九尾狐
          if (nowComplete && !state.creatureProgress['fox']) {
            hatchlingUpdates.creatureProgress = {
              ...state.creatureProgress,
              fox: { stage: 0, xp: 0, unlockedAt: Date.now() },
            };
          }
        }

        set({
          dailyTasksDone:   newDone,
          dailyTasksDate:   today,
          dailyFoodClaimed: isDifferentDay ? false : state.dailyFoodClaimed,
          foodCount:        state.foodCount + foodEarned,
          ...hatchlingUpdates,
        });

        return { allDone, foodEarned };
      },

      claimDailyBonus: () => {
        const state = get();
        if (state.dailyFoodClaimed) return;
        set({ dailyFoodClaimed: true, foodCount: state.foodCount + 2 }); // +2 bonus
      },

      // ── Hatchling Challenge ──────────────────────────────────────
      startHatchlingChallenge: () => {
        const { hatchlingStartDate } = get();
        if (hatchlingStartDate) return; // 已開始
        set({ hatchlingStartDate: todayStr(), hatchlingDaysDone: 0, hatchlingLastAdvance: '' });
      },

      advanceHatchlingDay: () => {
        const { hatchlingDaysDone, hatchlingComplete } = get();
        if (hatchlingComplete) return;
        const newDays = hatchlingDaysDone + 1;
        set({
          hatchlingDaysDone:  newDays,
          hatchlingComplete:  newDays >= 7,
        });
      },

      // ── Placement Test ───────────────────────────────────────────
      completePlacement: (unlockedCount) => {
        const { unlockedLessons } = get();
        // 解鎖 1..unlockedCount 的課節
        const toUnlock = Array.from({ length: unlockedCount }, (_, i) => i + 1);
        const merged   = Array.from(new Set([...unlockedLessons, ...toUnlock]));
        set({ placementDone: true, unlockedLessons: merged });
      },
    }),
    {
      name: 'cantokids-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        displayName: state.displayName,
        wordProgress: state.wordProgress,
        totalStars: state.totalStars,
        unlockedLessons: state.unlockedLessons,
        perfectQuizzes: state.perfectQuizzes,
        streakDays: state.streakDays,
        lastStudyDate: state.lastStudyDate,
        parentPin: state.parentPin,
        isPremium: state.isPremium,
        onboardingDone: state.onboardingDone,
        totalCorrect: state.totalCorrect,
        totalAnswers: state.totalAnswers,
        // Phase 6
        playerXP: state.playerXP,
        playerLevel: state.playerLevel,
        bossesDefeated: state.bossesDefeated,
        // Phase 7
        treasures: state.treasures,
        // i18n
        language: state.language,
        // Creature system
        creatureProgress: state.creatureProgress,
        foodCount: state.foodCount,
        // Daily tasks
        dailyTasksDone:   state.dailyTasksDone,
        dailyTasksDate:   state.dailyTasksDate,
        dailyFoodClaimed: state.dailyFoodClaimed,
        // Hatchling
        hatchlingStartDate:   state.hatchlingStartDate,
        hatchlingDaysDone:    state.hatchlingDaysDone,
        hatchlingComplete:    state.hatchlingComplete,
        hatchlingLastAdvance: state.hatchlingLastAdvance,
        placementDone:        state.placementDone,
      }),
    }
  )
);
