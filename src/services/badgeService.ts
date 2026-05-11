/**
 * badgeService — 徽章定義與解鎖邏輯
 *
 * Phase 4 更新：
 * - 新增 small_tree（小樹級完成）、big_tree（大樹級完成）徽章
 * - 新增 word_master（累積 30 字）徽章
 * - all_seedling 條件修正：只計算幼苗級漢字數（10 個）
 */

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalStars: number;
  learnedCount: number;
  totalWords: number;
  perfectQuizzes: number;
  streakDays: number;
  seedlingLearned: number;
  saplingLearned: number;
  treeLearned: number;
  sunflowerLearned: number;  // 🌻 向日葵級（數字）
  rainbowLearned: number;    // 🌈 彩虹級（顏色 + 身體）
  galaxyLearned: number;     // ⭐ 星河級（家庭）
  bambooLearned: number;     // 🎋 竹林級（動詞 + 校園）
  jadeLearned: number;       // 💎 玉龍級（抽象 + 美德）
}

/** 每個級別的漢字數量 */
export const LEVEL_COUNTS = {
  seedling:  10,
  sapling:   10,
  tree:      10,
  sunflower: 10,
  rainbow:   10,
  galaxy:    10,
  bamboo:    20,
  jade:      20,
} as const;

export const TOTAL_WORDS = Object.values(LEVEL_COUNTS).reduce((a, b) => a + b, 0); // 100

/**
 * 徽章定義列表（共 14 個）
 */
export const BADGES: Badge[] = [
  // ── 入門 ──
  {
    id: 'first_word',
    name: '初學者',
    emoji: '🌱',
    description: '完成第一個漢字練習',
    condition: (s) => s.learnedCount >= 1,
  },
  {
    id: 'five_words',
    name: '小小學者',
    emoji: '📚',
    description: '學會 5 個漢字',
    condition: (s) => s.learnedCount >= 5,
  },
  {
    id: 'word_30',
    name: '漢字達人',
    emoji: '🥈',
    description: '學會 30 個漢字',
    condition: (s) => s.learnedCount >= 30,
  },
  // ── 級別完成 ──
  {
    id: 'all_seedling',
    name: '幼苗畢業生',
    emoji: '🎓',
    description: '完成全部幼苗級漢字（10 個）',
    condition: (s) => s.seedlingLearned >= LEVEL_COUNTS.seedling,
  },
  {
    id: 'all_sapling',
    name: '小樹達人',
    emoji: '🌳',
    description: '完成全部小樹級漢字（10 個）',
    condition: (s) => s.saplingLearned >= LEVEL_COUNTS.sapling,
  },
  {
    id: 'all_tree',
    name: '大樹英雄',
    emoji: '🏆',
    description: '完成全部大樹級漢字（10 個）',
    condition: (s) => s.treeLearned >= LEVEL_COUNTS.tree,
  },
  {
    id: 'all_sunflower',
    name: '數字小天才',
    emoji: '🌻',
    description: '完成全部向日葵級（數字 10 個）',
    condition: (s) => s.sunflowerLearned >= LEVEL_COUNTS.sunflower,
  },
  {
    id: 'all_rainbow',
    name: '色彩魔法師',
    emoji: '🌈',
    description: '完成全部彩虹級（顏色 + 身體 10 個）',
    condition: (s) => s.rainbowLearned >= LEVEL_COUNTS.rainbow,
  },
  {
    id: 'all_galaxy',
    name: '家庭守護者',
    emoji: '⭐',
    description: '完成全部星河級（家庭 10 個）',
    condition: (s) => s.galaxyLearned >= LEVEL_COUNTS.galaxy,
  },
  // ── 星星 ──
  {
    id: 'star_10',
    name: '星星收集者',
    emoji: '✨',
    description: '累積 10 顆星',
    condition: (s) => s.totalStars >= 10,
  },
  {
    id: 'star_50',
    name: '閃亮之星',
    emoji: '🌟',
    description: '累積 50 顆星',
    condition: (s) => s.totalStars >= 50,
  },
  // ── 測驗 ──
  {
    id: 'perfect_3',
    name: '完美主義者',
    emoji: '💎',
    description: '3 次零錯誤完成測驗',
    condition: (s) => s.perfectQuizzes >= 3,
  },
  // ── 連勝 ──
  {
    id: 'streak_7',
    name: '堅持不懈',
    emoji: '🔥',
    description: '連續學習 7 天',
    condition: (s) => s.streakDays >= 7,
  },
  // ── 級別完成（竹林、玉龍）──
  {
    id: 'all_bamboo',
    name: '書生',
    emoji: '🎋',
    description: '完成所有竹林級漢字',
    condition: (s) => s.bambooLearned >= LEVEL_COUNTS.bamboo,
  },
  {
    id: 'all_jade',
    name: '聖賢',
    emoji: '💎',
    description: '完成所有玉龍級漢字',
    condition: (s) => s.jadeLearned >= LEVEL_COUNTS.jade,
  },
  // ── 總字數 ──
  {
    id: 'word_master',
    name: '漢字大師',
    emoji: '👑',
    description: `學會全部 ${TOTAL_WORDS} 個漢字`,
    condition: (s) => s.totalWords > 0 && s.learnedCount >= s.totalWords,
  },
  {
    id: 'word_master_100',
    name: '百字宗師',
    emoji: '🏆',
    description: '學會全部 100 個漢字',
    condition: (s) => s.learnedCount >= 100,
  },
];

/**
 * 計算已解鎖的徽章
 */
export function getUnlockedBadges(stats: BadgeStats): Badge[] {
  return BADGES.filter((badge) => badge.condition(stats));
}

/**
 * 計算新解鎖的徽章（與舊狀態比較）
 */
export function getNewlyUnlockedBadges(
  oldStats: BadgeStats,
  newStats: BadgeStats
): Badge[] {
  const wasUnlocked = new Set(getUnlockedBadges(oldStats).map((b) => b.id));
  return getUnlockedBadges(newStats).filter((b) => !wasUnlocked.has(b.id));
}

/**
 * 從 wordProgress 和詞庫資料計算完整 BadgeStats
 * 使用此 helper 確保各畫面數據一致
 */
export function buildBadgeStats(
  wordProgress: Record<number, { learned: boolean }>,
  totalStars: number,
  perfectQuizzes: number,
  streakDays: number,
  seedlingIds: number[],
  saplingIds: number[],
  treeIds: number[],
  sunflowerIds: number[] = [],
  rainbowIds: number[] = [],
  galaxyIds: number[] = [],
  bambooIds: number[] = [],
  jadeIds: number[] = [],
): BadgeStats {
  const seedlingLearned   = seedlingIds.filter((id)   => wordProgress[id]?.learned).length;
  const saplingLearned    = saplingIds.filter((id)    => wordProgress[id]?.learned).length;
  const treeLearned       = treeIds.filter((id)       => wordProgress[id]?.learned).length;
  const sunflowerLearned  = sunflowerIds.filter((id)  => wordProgress[id]?.learned).length;
  const rainbowLearned    = rainbowIds.filter((id)    => wordProgress[id]?.learned).length;
  const galaxyLearned     = galaxyIds.filter((id)     => wordProgress[id]?.learned).length;
  const bambooLearned     = bambooIds.filter((id)     => wordProgress[id]?.learned).length;
  const jadeLearned       = jadeIds.filter((id)       => wordProgress[id]?.learned).length;

  const learnedCount =
    seedlingLearned + saplingLearned + treeLearned +
    sunflowerLearned + rainbowLearned + galaxyLearned +
    bambooLearned + jadeLearned;
  const totalWords =
    seedlingIds.length + saplingIds.length + treeIds.length +
    sunflowerIds.length + rainbowIds.length + galaxyIds.length +
    bambooIds.length + jadeIds.length;

  return {
    totalStars, learnedCount, totalWords, perfectQuizzes, streakDays,
    seedlingLearned, saplingLearned, treeLearned,
    sunflowerLearned, rainbowLearned, galaxyLearned,
    bambooLearned, jadeLearned,
  };
}
