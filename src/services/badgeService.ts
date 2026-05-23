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
  name: string;       // 繁中
  name_en: string;    // English
  name_sc: string;    // 簡中
  emoji: string;
  description: string;    // 繁中
  description_en: string; // English
  description_sc: string; // 簡中
  condition: (stats: BadgeStats) => boolean;
}

/** 根據語言取得徽章名稱及說明 */
export function getBadgeLocalized(
  badge: Badge,
  language: 'zh' | 'en' | 'sc',
): { name: string; description: string } {
  if (language === 'en') return { name: badge.name_en, description: badge.description_en };
  if (language === 'sc') return { name: badge.name_sc, description: badge.description_sc };
  return { name: badge.name, description: badge.description };
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
    name: '初學者',         name_en: 'Beginner',          name_sc: '初学者',
    emoji: '🌱',
    description:    '完成第一個漢字練習',
    description_en: 'Complete your first character',
    description_sc: '完成第一个汉字练习',
    condition: (s) => s.learnedCount >= 1,
  },
  {
    id: 'five_words',
    name: '小小學者',       name_en: 'Little Scholar',    name_sc: '小小学者',
    emoji: '📚',
    description:    '學會 5 個漢字',
    description_en: 'Learn 5 characters',
    description_sc: '学会 5 个汉字',
    condition: (s) => s.learnedCount >= 5,
  },
  {
    id: 'word_30',
    name: '漢字達人',       name_en: 'Character Expert',  name_sc: '汉字达人',
    emoji: '🥈',
    description:    '學會 30 個漢字',
    description_en: 'Learn 30 characters',
    description_sc: '学会 30 个汉字',
    condition: (s) => s.learnedCount >= 30,
  },
  // ── 級別完成 ──
  {
    id: 'all_seedling',
    name: '幼苗畢業生',     name_en: 'Seedling Graduate', name_sc: '幼苗毕业生',
    emoji: '🎓',
    description:    '完成全部幼苗級漢字（10 個）',
    description_en: 'Complete all Seedling level characters (10)',
    description_sc: '完成全部幼苗级汉字（10 个）',
    condition: (s) => s.seedlingLearned >= LEVEL_COUNTS.seedling,
  },
  {
    id: 'all_sapling',
    name: '小樹達人',       name_en: 'Sapling Expert',    name_sc: '小树达人',
    emoji: '🌳',
    description:    '完成全部小樹級漢字（10 個）',
    description_en: 'Complete all Sapling level characters (10)',
    description_sc: '完成全部小树级汉字（10 个）',
    condition: (s) => s.saplingLearned >= LEVEL_COUNTS.sapling,
  },
  {
    id: 'all_tree',
    name: '大樹英雄',       name_en: 'Tree Hero',         name_sc: '大树英雄',
    emoji: '🏆',
    description:    '完成全部大樹級漢字（10 個）',
    description_en: 'Complete all Tree level characters (10)',
    description_sc: '完成全部大树级汉字（10 个）',
    condition: (s) => s.treeLearned >= LEVEL_COUNTS.tree,
  },
  {
    id: 'all_sunflower',
    name: '數字小天才',     name_en: 'Number Genius',     name_sc: '数字小天才',
    emoji: '🌻',
    description:    '完成全部向日葵級（數字 10 個）',
    description_en: 'Complete all Sunflower level (10 numbers)',
    description_sc: '完成全部向日葵级（数字 10 个）',
    condition: (s) => s.sunflowerLearned >= LEVEL_COUNTS.sunflower,
  },
  {
    id: 'all_rainbow',
    name: '色彩魔法師',     name_en: 'Colour Magician',   name_sc: '色彩魔法师',
    emoji: '🌈',
    description:    '完成全部彩虹級（顏色 + 身體 10 個）',
    description_en: 'Complete all Rainbow level (colours & body, 10)',
    description_sc: '完成全部彩虹级（颜色 + 身体 10 个）',
    condition: (s) => s.rainbowLearned >= LEVEL_COUNTS.rainbow,
  },
  {
    id: 'all_galaxy',
    name: '家庭守護者',     name_en: 'Family Guardian',   name_sc: '家庭守护者',
    emoji: '⭐',
    description:    '完成全部星河級（家庭 10 個）',
    description_en: 'Complete all Galaxy level (family, 10)',
    description_sc: '完成全部星河级（家庭 10 个）',
    condition: (s) => s.galaxyLearned >= LEVEL_COUNTS.galaxy,
  },
  // ── 星星 ──
  {
    id: 'star_10',
    name: '星星收集者',     name_en: 'Star Collector',    name_sc: '星星收集者',
    emoji: '✨',
    description:    '累積 10 顆星',
    description_en: 'Earn 10 stars',
    description_sc: '累积 10 颗星',
    condition: (s) => s.totalStars >= 10,
  },
  {
    id: 'star_50',
    name: '閃亮之星',       name_en: 'Shining Star',      name_sc: '闪亮之星',
    emoji: '🌟',
    description:    '累積 50 顆星',
    description_en: 'Earn 50 stars',
    description_sc: '累积 50 颗星',
    condition: (s) => s.totalStars >= 50,
  },
  // ── 測驗 ──
  {
    id: 'perfect_3',
    name: '完美主義者',     name_en: 'Perfectionist',     name_sc: '完美主义者',
    emoji: '💎',
    description:    '3 次零錯誤完成測驗',
    description_en: 'Complete 3 quizzes without any mistakes',
    description_sc: '3 次零错误完成测验',
    condition: (s) => s.perfectQuizzes >= 3,
  },
  // ── 連勝 ──
  {
    id: 'streak_7',
    name: '堅持不懈',       name_en: 'Perseverance',      name_sc: '坚持不懈',
    emoji: '🔥',
    description:    '連續學習 7 天',
    description_en: 'Learn for 7 days in a row',
    description_sc: '连续学习 7 天',
    condition: (s) => s.streakDays >= 7,
  },
  // ── 級別完成（竹林、玉龍）──
  {
    id: 'all_bamboo',
    name: '書生',           name_en: 'Scholar',           name_sc: '书生',
    emoji: '🎋',
    description:    '完成所有竹林級漢字',
    description_en: 'Complete all Bamboo level characters',
    description_sc: '完成所有竹林级汉字',
    condition: (s) => s.bambooLearned >= LEVEL_COUNTS.bamboo,
  },
  {
    id: 'all_jade',
    name: '聖賢',           name_en: 'Sage',              name_sc: '圣贤',
    emoji: '💎',
    description:    '完成所有玉龍級漢字',
    description_en: 'Complete all Jade level characters',
    description_sc: '完成所有玉龙级汉字',
    condition: (s) => s.jadeLearned >= LEVEL_COUNTS.jade,
  },
  // ── 總字數 ──
  {
    id: 'word_master',
    name: '漢字大師',       name_en: 'Character Master',  name_sc: '汉字大师',
    emoji: '👑',
    description:    `學會全部 ${TOTAL_WORDS} 個漢字`,
    description_en: `Learn all ${TOTAL_WORDS} characters`,
    description_sc: `学会全部 ${TOTAL_WORDS} 个汉字`,
    condition: (s) => s.totalWords > 0 && s.learnedCount >= s.totalWords,
  },
  {
    id: 'word_master_100',
    name: '百字宗師',       name_en: 'Century Master',    name_sc: '百字宗师',
    emoji: '🏆',
    description:    '學會全部 100 個漢字',
    description_en: 'Learn all 100 characters',
    description_sc: '学会全部 100 个汉字',
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
