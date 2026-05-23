/**
 * treasures.ts — 寶物定義
 * 依 Boss 關卡分組，共 ~20 件寶物
 */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Treasure {
  id: string;
  name: string;         // 繁體中文名稱
  name_en: string;      // English name
  name_sc: string;      // 簡體中文名稱
  emoji: string;
  rarity: Rarity;
  description: string;    // 短描述（繁體中文）
  description_en: string; // Short description (English)
  description_sc: string; // 短描述（簡體中文）
  bossLevelKey: 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy' | 'bamboo' | 'jade';
}

/** 根據語言取得寶物名稱及說明 */
export function getTreasureLocalized(
  treasure: Treasure,
  language: 'zh' | 'en' | 'sc',
): { name: string; description: string } {
  if (language === 'en') return { name: treasure.name_en, description: treasure.description_en };
  if (language === 'sc') return { name: treasure.name_sc, description: treasure.description_sc };
  return { name: treasure.name, description: treasure.description };
}

export const RARITY_CONFIG: Record<
  Rarity,
  { color: string; bgColor: string; glowColor: string }
> = {
  common:    { color: '#6B7280', bgColor: '#F3F4F6', glowColor: '#9CA3AF' },
  rare:      { color: '#2563EB', bgColor: '#EFF6FF', glowColor: '#3B82F6' },
  epic:      { color: '#7C3AED', bgColor: '#F5F3FF', glowColor: '#8B5CF6' },
  legendary: { color: '#D97706', bgColor: '#FFFBEB', glowColor: '#F59E0B' },
};

export const TREASURES: Treasure[] = [
  // ── seedling ─────────────────────────────────────────────────────
  {
    id: 'seedling_common_1',
    name: '嫩芽石',       name_en: 'Sprout Stone',        name_sc: '嫩芽石',
    emoji: '🌱',
    rarity: 'common',
    description:    '散發幼苗氣息的普通石頭',
    description_en: 'An ordinary stone with a sprout-like aura',
    description_sc: '散发幼苗气息的普通石头',
    bossLevelKey: 'seedling',
  },
  {
    id: 'seedling_rare_1',
    name: '幸運草',       name_en: 'Lucky Clover',        name_sc: '幸运草',
    emoji: '🍀',
    rarity: 'rare',
    description:    '四葉幸運草，帶來好運',
    description_en: 'A four-leaf clover that brings good luck',
    description_sc: '四叶幸运草，带来好运',
    bossLevelKey: 'seedling',
  },
  {
    id: 'seedling_epic_1',
    name: '陽光寶珠',     name_en: 'Sunlight Orb',        name_sc: '阳光宝珠',
    emoji: '🌻',
    rarity: 'epic',
    description:    '凝聚陽光能量的神秘珠子',
    description_en: 'A mysterious orb brimming with sunlight energy',
    description_sc: '凝聚阳光能量的神秘珠子',
    bossLevelKey: 'seedling',
  },

  // ── sapling ──────────────────────────────────────────────────────
  {
    id: 'sapling_common_1',
    name: '學問卷軸',     name_en: 'Knowledge Scroll',    name_sc: '学问卷轴',
    emoji: '📜',
    rarity: 'common',
    description:    '記載著古老知識的舊卷軸',
    description_en: 'An ancient scroll filled with old wisdom',
    description_sc: '记载着古老知识的旧卷轴',
    bossLevelKey: 'sapling',
  },
  {
    id: 'sapling_rare_1',
    name: '智慧水晶',     name_en: 'Wisdom Crystal',      name_sc: '智慧水晶',
    emoji: '🔮',
    rarity: 'rare',
    description:    '閃爍藍光的智慧水晶球',
    description_en: 'A glowing blue crystal of wisdom',
    description_sc: '闪烁蓝光的智慧水晶球',
    bossLevelKey: 'sapling',
  },
  {
    id: 'sapling_epic_1',
    name: '彩蝶翼',       name_en: 'Rainbow Wing',        name_sc: '彩蝶翼',
    emoji: '🦋',
    rarity: 'epic',
    description:    '來自神秘森林的七彩蝴蝶翅膀',
    description_en: 'Iridescent butterfly wings from a mystical forest',
    description_sc: '来自神秘森林的七彩蝴蝶翅膀',
    bossLevelKey: 'sapling',
  },

  // ── tree ─────────────────────────────────────────────────────────
  {
    id: 'tree_common_1',
    name: '古老石',       name_en: 'Ancient Stone',       name_sc: '古老石',
    emoji: '🪨',
    rarity: 'common',
    description:    '歷史悠久的神秘古石',
    description_en: 'A mysterious stone with a long history',
    description_sc: '历史悠久的神秘古石',
    bossLevelKey: 'tree',
  },
  {
    id: 'tree_rare_1',
    name: '藍寶石',       name_en: 'Sapphire',            name_sc: '蓝宝石',
    emoji: '💎',
    rarity: 'rare',
    description:    '深海藍色的珍貴寶石',
    description_en: 'A precious deep-sea blue gemstone',
    description_sc: '深海蓝色的珍贵宝石',
    bossLevelKey: 'tree',
  },
  {
    id: 'tree_epic_1',
    name: '月光石',       name_en: 'Moonstone',           name_sc: '月光石',
    emoji: '🌙',
    rarity: 'epic',
    description:    '月亮賜予的銀色魔法石',
    description_en: 'A silver magic stone gifted by the moon',
    description_sc: '月亮赐予的银色魔法石',
    bossLevelKey: 'tree',
  },
  {
    id: 'tree_legendary_1',
    name: '星塵',         name_en: 'Stardust',            name_sc: '星尘',
    emoji: '⭐',
    rarity: 'legendary',
    description:    '從星空墜落的傳說星塵',
    description_en: 'Legendary stardust fallen from the sky',
    description_sc: '从星空坠落的传说星尘',
    bossLevelKey: 'tree',
  },

  // ── sunflower ────────────────────────────────────────────────────
  {
    id: 'sunflower_common_1',
    name: '古甕碎片',     name_en: 'Ancient Shard',       name_sc: '古瓮碎片',
    emoji: '🏺',
    rarity: 'common',
    description:    '遠古陶甕留下的碎片',
    description_en: 'A fragment from an ancient clay pot',
    description_sc: '远古陶瓮留下的碎片',
    bossLevelKey: 'sunflower',
  },
  {
    id: 'sunflower_rare_1',
    name: '火焰核心',     name_en: 'Flame Core',          name_sc: '火焰核心',
    emoji: '🔥',
    rarity: 'rare',
    description:    '熾熱燃燒的火元素核心',
    description_en: 'A blazing fire element core',
    description_sc: '炽热燃烧的火元素核心',
    bossLevelKey: 'sunflower',
  },
  {
    id: 'sunflower_epic_1',
    name: '彩虹晶片',     name_en: 'Rainbow Shard',       name_sc: '彩虹晶片',
    emoji: '🌈',
    rarity: 'epic',
    description:    '七色彩虹凝成的晶片',
    description_en: 'A crystal shard formed from a seven-colour rainbow',
    description_sc: '七色彩虹凝成的晶片',
    bossLevelKey: 'sunflower',
  },
  {
    id: 'sunflower_legendary_1',
    name: '鳳凰羽',       name_en: 'Phoenix Feather',     name_sc: '凤凰羽',
    emoji: '🦅',
    rarity: 'legendary',
    description:    '浴火重生的鳳凰珍貴羽毛',
    description_en: 'A precious feather from a phoenix reborn in fire',
    description_sc: '浴火重生的凤凰珍贵羽毛',
    bossLevelKey: 'sunflower',
  },

  // ── rainbow ──────────────────────────────────────────────────────
  {
    id: 'rainbow_rare_1',
    name: '海洋之心',     name_en: 'Heart of the Ocean',  name_sc: '海洋之心',
    emoji: '🌊',
    rarity: 'rare',
    description:    '深海中心凝聚的寶物',
    description_en: 'A treasure crystallised at the heart of the deep sea',
    description_sc: '深海中心凝聚的宝物',
    bossLevelKey: 'rainbow',
  },
  {
    id: 'rainbow_epic_1',
    name: '雷霆精華',     name_en: 'Thunder Essence',     name_sc: '雷霆精华',
    emoji: '⚡',
    rarity: 'epic',
    description:    '閃電精華凝結而成的寶石',
    description_en: 'A gemstone crystallised from the essence of lightning',
    description_sc: '闪电精华凝结而成的宝石',
    bossLevelKey: 'rainbow',
  },
  {
    id: 'rainbow_legendary_1',
    name: '龍鱗',         name_en: 'Dragon Scale',        name_sc: '龙鳞',
    emoji: '🐉',
    rarity: 'legendary',
    description:    '古龍身上脫落的神聖鱗片',
    description_en: 'A sacred scale shed from an ancient dragon',
    description_sc: '古龙身上脱落的神圣鳞片',
    bossLevelKey: 'rainbow',
  },

  // ── galaxy ───────────────────────────────────────────────────────
  {
    id: 'galaxy_epic_1',
    name: '星光精華',     name_en: 'Starlight Essence',   name_sc: '星光精华',
    emoji: '🌟',
    rarity: 'epic',
    description:    '匯聚無數星光的璀璨精華',
    description_en: 'Brilliant essence gathered from countless stars',
    description_sc: '汇聚无数星光的璀璨精华',
    bossLevelKey: 'galaxy',
  },
  {
    id: 'galaxy_epic_2',
    name: '宇宙塵',       name_en: 'Cosmic Dust',         name_sc: '宇宙尘',
    emoji: '💫',
    rarity: 'epic',
    description:    '宇宙誕生之初的神秘塵埃',
    description_en: 'Mysterious dust from the birth of the universe',
    description_sc: '宇宙诞生之初的神秘尘埃',
    bossLevelKey: 'galaxy',
  },
  {
    id: 'galaxy_legendary_1',
    name: '時光水晶',     name_en: 'Time Crystal',        name_sc: '时光水晶',
    emoji: '🔮',
    rarity: 'legendary',
    description:    '能看見過去與未來的水晶',
    description_en: 'A crystal that reveals the past and future',
    description_sc: '能看见过去与未来的水晶',
    bossLevelKey: 'galaxy',
  },
  {
    id: 'galaxy_legendary_2',
    name: '天龍冠',       name_en: 'Celestial Dragon Crown', name_sc: '天龙冠',
    emoji: '👑',
    rarity: 'legendary',
    description:    '天界神龍遺留的至尊王冠',
    description_en: 'The supreme crown left by a heavenly dragon',
    description_sc: '天界神龙遗留的至尊王冠',
    bossLevelKey: 'galaxy',
  },

  // ── bamboo ───────────────────────────────────────────────────────
  {
    id: 'bamboo_common_1',
    name: '竹簡',         name_en: 'Bamboo Scroll',       name_sc: '竹简',
    emoji: '📜',
    rarity: 'common',
    description:    '刻有古文的竹片書簡',
    description_en: 'Bamboo strips carved with ancient writings',
    description_sc: '刻有古文的竹片书简',
    bossLevelKey: 'bamboo',
  },
  {
    id: 'bamboo_rare_1',
    name: '文房四寶',     name_en: 'Four Treasures',      name_sc: '文房四宝',
    emoji: '🖌️',
    rarity: 'rare',
    description:    '筆墨紙硯，書生必備',
    description_en: 'Brush, ink, paper and inkstone — a scholar\'s essentials',
    description_sc: '笔墨纸砚，书生必备',
    bossLevelKey: 'bamboo',
  },
  {
    id: 'bamboo_epic_1',
    name: '靈竹笛',       name_en: 'Spirit Bamboo Flute', name_sc: '灵竹笛',
    emoji: '🎋',
    rarity: 'epic',
    description:    '竹林中的神奇魔法笛',
    description_en: 'A magical flute from the heart of the bamboo grove',
    description_sc: '竹林中的神奇魔法笛',
    bossLevelKey: 'bamboo',
  },
  {
    id: 'bamboo_legendary_1',
    name: '智慧書卷',     name_en: 'Tome of Wisdom',      name_sc: '智慧书卷',
    emoji: '📖',
    rarity: 'legendary',
    description:    '記載天下智慧的傳說書卷',
    description_en: 'A legendary tome containing the world\'s wisdom',
    description_sc: '记载天下智慧的传说书卷',
    bossLevelKey: 'bamboo',
  },

  // ── jade ─────────────────────────────────────────────────────────
  {
    id: 'jade_rare_1',
    name: '玉璧',         name_en: 'Jade Disc',           name_sc: '玉璧',
    emoji: '🔵',
    rarity: 'rare',
    description:    '古代帝王的珍貴玉器',
    description_en: 'A precious jade vessel of ancient emperors',
    description_sc: '古代帝王的珍贵玉器',
    bossLevelKey: 'jade',
  },
  {
    id: 'jade_epic_1',
    name: '龍紋玉佩',     name_en: 'Dragon Jade Pendant', name_sc: '龙纹玉佩',
    emoji: '💚',
    rarity: 'epic',
    description:    '雕有神龍的翡翠玉佩',
    description_en: 'A jade pendant carved with a divine dragon',
    description_sc: '雕有神龙的翡翠玉佩',
    bossLevelKey: 'jade',
  },
  {
    id: 'jade_legendary_1',
    name: '傳國玉璽',     name_en: 'Imperial Jade Seal',  name_sc: '传国玉玺',
    emoji: '👑',
    rarity: 'legendary',
    description:    '天下至尊的傳說玉璽',
    description_en: 'The legendary jade seal of imperial power',
    description_sc: '天下至尊的传说玉玺',
    bossLevelKey: 'jade',
  },
  {
    id: 'jade_legendary_2',
    name: '聖賢典籍',     name_en: 'Sage\'s Classic',     name_sc: '圣贤典籍',
    emoji: '🌟',
    rarity: 'legendary',
    description:    '匯聚千年學問的傳說典籍',
    description_en: 'A legendary classic compiling a thousand years of knowledge',
    description_sc: '汇聚千年学问的传说典籍',
    bossLevelKey: 'jade',
  },
];
