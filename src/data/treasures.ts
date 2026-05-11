/**
 * treasures.ts — 寶物定義
 * 依 Boss 關卡分組，共 ~20 件寶物
 */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Treasure {
  id: string;
  name: string;         // 繁體中文名稱
  emoji: string;
  rarity: Rarity;
  description: string;  // 短描述（繁體中文）
  bossLevelKey: 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy' | 'bamboo' | 'jade';
}

export const RARITY_CONFIG: Record<
  Rarity,
  { label: string; color: string; bgColor: string; glowColor: string }
> = {
  common:    { label: '普通',  color: '#6B7280', bgColor: '#F3F4F6', glowColor: '#9CA3AF' },
  rare:      { label: '罕見',  color: '#2563EB', bgColor: '#EFF6FF', glowColor: '#3B82F6' },
  epic:      { label: '史詩',  color: '#7C3AED', bgColor: '#F5F3FF', glowColor: '#8B5CF6' },
  legendary: { label: '傳說',  color: '#D97706', bgColor: '#FFFBEB', glowColor: '#F59E0B' },
};

export const TREASURES: Treasure[] = [
  // ── seedling ─────────────────────────────────────────────────────
  {
    id: 'seedling_common_1',
    name: '嫩芽石',
    emoji: '🌱',
    rarity: 'common',
    description: '散發幼苗氣息的普通石頭',
    bossLevelKey: 'seedling',
  },
  {
    id: 'seedling_rare_1',
    name: '幸運草',
    emoji: '🍀',
    rarity: 'rare',
    description: '四葉幸運草，帶來好運',
    bossLevelKey: 'seedling',
  },
  {
    id: 'seedling_epic_1',
    name: '陽光寶珠',
    emoji: '🌻',
    rarity: 'epic',
    description: '凝聚陽光能量的神秘珠子',
    bossLevelKey: 'seedling',
  },

  // ── sapling ──────────────────────────────────────────────────────
  {
    id: 'sapling_common_1',
    name: '學問卷軸',
    emoji: '📜',
    rarity: 'common',
    description: '記載著古老知識的舊卷軸',
    bossLevelKey: 'sapling',
  },
  {
    id: 'sapling_rare_1',
    name: '智慧水晶',
    emoji: '🔮',
    rarity: 'rare',
    description: '閃爍藍光的智慧水晶球',
    bossLevelKey: 'sapling',
  },
  {
    id: 'sapling_epic_1',
    name: '彩蝶翼',
    emoji: '🦋',
    rarity: 'epic',
    description: '來自神秘森林的七彩蝴蝶翅膀',
    bossLevelKey: 'sapling',
  },

  // ── tree ─────────────────────────────────────────────────────────
  {
    id: 'tree_common_1',
    name: '古老石',
    emoji: '🪨',
    rarity: 'common',
    description: '歷史悠久的神秘古石',
    bossLevelKey: 'tree',
  },
  {
    id: 'tree_rare_1',
    name: '藍寶石',
    emoji: '💎',
    rarity: 'rare',
    description: '深海藍色的珍貴寶石',
    bossLevelKey: 'tree',
  },
  {
    id: 'tree_epic_1',
    name: '月光石',
    emoji: '🌙',
    rarity: 'epic',
    description: '月亮賜予的銀色魔法石',
    bossLevelKey: 'tree',
  },
  {
    id: 'tree_legendary_1',
    name: '星塵',
    emoji: '⭐',
    rarity: 'legendary',
    description: '從星空墜落的傳說星塵',
    bossLevelKey: 'tree',
  },

  // ── sunflower ────────────────────────────────────────────────────
  {
    id: 'sunflower_common_1',
    name: '古甕碎片',
    emoji: '🏺',
    rarity: 'common',
    description: '遠古陶甕留下的碎片',
    bossLevelKey: 'sunflower',
  },
  {
    id: 'sunflower_rare_1',
    name: '火焰核心',
    emoji: '🔥',
    rarity: 'rare',
    description: '熾熱燃燒的火元素核心',
    bossLevelKey: 'sunflower',
  },
  {
    id: 'sunflower_epic_1',
    name: '彩虹晶片',
    emoji: '🌈',
    rarity: 'epic',
    description: '七色彩虹凝成的晶片',
    bossLevelKey: 'sunflower',
  },
  {
    id: 'sunflower_legendary_1',
    name: '鳳凰羽',
    emoji: '🦅',
    rarity: 'legendary',
    description: '浴火重生的鳳凰珍貴羽毛',
    bossLevelKey: 'sunflower',
  },

  // ── rainbow ──────────────────────────────────────────────────────
  {
    id: 'rainbow_rare_1',
    name: '海洋之心',
    emoji: '🌊',
    rarity: 'rare',
    description: '深海中心凝聚的寶物',
    bossLevelKey: 'rainbow',
  },
  {
    id: 'rainbow_epic_1',
    name: '雷霆精華',
    emoji: '⚡',
    rarity: 'epic',
    description: '閃電精華凝結而成的寶石',
    bossLevelKey: 'rainbow',
  },
  {
    id: 'rainbow_legendary_1',
    name: '龍鱗',
    emoji: '🐉',
    rarity: 'legendary',
    description: '古龍身上脫落的神聖鱗片',
    bossLevelKey: 'rainbow',
  },

  // ── galaxy ───────────────────────────────────────────────────────
  {
    id: 'galaxy_epic_1',
    name: '星光精華',
    emoji: '🌟',
    rarity: 'epic',
    description: '匯聚無數星光的璀璨精華',
    bossLevelKey: 'galaxy',
  },
  {
    id: 'galaxy_epic_2',
    name: '宇宙塵',
    emoji: '💫',
    rarity: 'epic',
    description: '宇宙誕生之初的神秘塵埃',
    bossLevelKey: 'galaxy',
  },
  {
    id: 'galaxy_legendary_1',
    name: '時光水晶',
    emoji: '🔮',
    rarity: 'legendary',
    description: '能看見過去與未來的水晶',
    bossLevelKey: 'galaxy',
  },
  {
    id: 'galaxy_legendary_2',
    name: '天龍冠',
    emoji: '👑',
    rarity: 'legendary',
    description: '天界神龍遺留的至尊王冠',
    bossLevelKey: 'galaxy',
  },

  // ── bamboo ───────────────────────────────────────────────────────
  {
    id: 'bamboo_common_1',
    name: '竹簡',
    emoji: '📜',
    rarity: 'common',
    description: '刻有古文的竹片書簡',
    bossLevelKey: 'bamboo',
  },
  {
    id: 'bamboo_rare_1',
    name: '文房四寶',
    emoji: '🖌️',
    rarity: 'rare',
    description: '筆墨紙硯，書生必備',
    bossLevelKey: 'bamboo',
  },
  {
    id: 'bamboo_epic_1',
    name: '靈竹笛',
    emoji: '🎋',
    rarity: 'epic',
    description: '竹林中的神奇魔法笛',
    bossLevelKey: 'bamboo',
  },
  {
    id: 'bamboo_legendary_1',
    name: '智慧書卷',
    emoji: '📖',
    rarity: 'legendary',
    description: '記載天下智慧的傳說書卷',
    bossLevelKey: 'bamboo',
  },

  // ── jade ─────────────────────────────────────────────────────────
  {
    id: 'jade_rare_1',
    name: '玉璧',
    emoji: '🔵',
    rarity: 'rare',
    description: '古代帝王的珍貴玉器',
    bossLevelKey: 'jade',
  },
  {
    id: 'jade_epic_1',
    name: '龍紋玉佩',
    emoji: '💚',
    rarity: 'epic',
    description: '雕有神龍的翡翠玉佩',
    bossLevelKey: 'jade',
  },
  {
    id: 'jade_legendary_1',
    name: '傳國玉璽',
    emoji: '👑',
    rarity: 'legendary',
    description: '天下至尊的傳說玉璽',
    bossLevelKey: 'jade',
  },
  {
    id: 'jade_legendary_2',
    name: '聖賢典籍',
    emoji: '🌟',
    rarity: 'legendary',
    description: '匯聚千年學問的傳說典籍',
    bossLevelKey: 'jade',
  },
];
