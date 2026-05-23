/**
 * creatures.ts — 7 種神話生物定義
 *
 * 每種生物對應一個 Realm Zone，擊敗該區域 Boss 後解鎖。
 * 4 個成長階段：幼年(0) → 少年(1) → 成年(2) → 神話(3)
 * 每個階段需要消耗食物 (food) 才能進化。
 */

export interface CreatureDef {
  id:           string;
  nameZh:       string;
  nameEn:       string;
  nameSc:       string;
  descZh:       string;
  descEn:       string;
  emoji:        string;        // 主 emoji（所有階段共用）
  bgColors:     [string, string, string, string];     // 各階段卡片底色
  accentColors: [string, string, string, string];     // 各階段強調色
  stageNamesZh: [string, string, string, string];
  stageNamesEn: [string, string, string, string];
  stageNamesSc: [string, string, string, string];
  unlockBy:     string;        // bossId
  xpToNext:     [number, number, number];             // 升到下一階段所需食物量
  realmZh:      string;        // 對應領域名稱
  realmEn:      string;
}

export const CREATURES: CreatureDef[] = [
  {
    id:       'fox',
    nameZh:   '九尾狐',
    nameEn:   'Nine-Tailed Fox',
    nameSc:   '九尾狐',
    descZh:   '翠林島的守護者，智慧與狡黠的象徵。傳說每掌握一個漢字，便會長出一條尾巴。',
    descEn:   'Guardian of Jade Forest Isle. Legend says a new tail grows with each character mastered.',
    emoji:    '🦊',
    bgColors:     ['#FEF9C3', '#FEF3C7', '#FDE68A', '#F59E0B'],
    accentColors: ['#CA8A04', '#D97706', '#B45309', '#92400E'],
    stageNamesZh: ['狐狸幼仔', '赤尾狐', '三尾狐仙', '九尾天狐'],
    stageNamesEn: ['Fox Kit', 'Red Fox', 'Three-Tailed Fae', 'Nine-Tailed Celestial'],
    stageNamesSc: ['狐狸幼崽', '赤尾狐', '三尾狐仙', '九尾天狐'],
    unlockBy:     'boss_seedling',
    xpToNext:     [30, 80, 160],
    realmZh:      '翠林島',
    realmEn:      'Jade Forest Isle',
  },
  {
    id:       'tiger',
    nameZh:   '白虎',
    nameEn:   'White Tiger',
    nameSc:   '白虎',
    descZh:   '月光谷的守護神，代表勇氣與力量。月圓之夜，它的白毛在月光下如星河閃耀。',
    descEn:   'Guardian of Moonlight Valley. Its white fur shimmers like starlight on full moon nights.',
    emoji:    '🐯',
    bgColors:     ['#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC'],
    accentColors: ['#0369A1', '#0284C7', '#0369A1', '#075985'],
    stageNamesZh: ['虎仔', '白虎少年', '月光白虎', '天之白虎'],
    stageNamesEn: ['Tiger Cub', 'White Tigress', 'Moonlight Tiger', 'Celestial White Tiger'],
    stageNamesSc: ['虎仔', '白虎少年', '月光白虎', '天之白虎'],
    unlockBy:     'boss_sapling',
    xpToNext:     [35, 90, 180],
    realmZh:      '月光谷',
    realmEn:      'Moonlight Valley',
  },
  {
    id:       'phoenix',
    nameZh:   '火鳳凰',
    nameEn:   'Fire Phoenix',
    nameSc:   '火凤凰',
    descZh:   '火焰山的不死鳥，每次從灰燼中重生，象徵不屈的學習精神。',
    descEn:   'The immortal bird of Flame Mountain. Each rebirth from ashes symbolises perseverance.',
    emoji:    '🐦',
    bgColors:     ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C'],
    accentColors: ['#C2410C', '#EA580C', '#DC2626', '#B91C1C'],
    stageNamesZh: ['火雀幼鳥', '朱雀少年', '赤鳳凰', '不死火鳳'],
    stageNamesEn: ['Flame Sparrow', 'Young Vermilion Bird', 'Fire Phoenix', 'Immortal Blaze Phoenix'],
    stageNamesSc: ['火雀幼鸟', '朱雀少年', '赤凤凰', '不死火凤'],
    unlockBy:     'boss_tree',
    xpToNext:     [40, 100, 200],
    realmZh:      '火焰山',
    realmEn:      'Flame Mountain',
  },
  {
    id:       'qilin',
    nameZh:   '麒麟',
    nameEn:   'Qilin',
    nameSc:   '麒麟',
    descZh:   '雲海峰的吉祥神獸，只在太平盛世出現。牠的蹄踏之處，雲朵便會升起。',
    descEn:   'The auspicious beast of Cloud Sea Peak. Clouds form wherever its hooves touch.',
    emoji:    '🦄',
    bgColors:     ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
    accentColors: ['#15803D', '#16A34A', '#15803D', '#14532D'],
    stageNamesZh: ['小麒麟', '雲騎麒麟', '祥瑞麒麟', '神麒麟'],
    stageNamesEn: ['Baby Qilin', 'Cloud Rider', 'Auspicious Qilin', 'Divine Qilin'],
    stageNamesSc: ['小麒麟', '云骑麒麟', '祥瑞麒麟', '神麒麟'],
    unlockBy:     'boss_sunflower',
    xpToNext:     [45, 110, 220],
    realmZh:      '雲海峰',
    realmEn:      'Cloud Sea Peak',
  },
  {
    id:       'dragon',
    nameZh:   '東方龍',
    nameEn:   'Eastern Dragon',
    nameSc:   '东方龙',
    descZh:   '彩虹橋的主宰，能呼風喚雨。每學識10個漢字，牠的龍鱗便會煥發新光彩。',
    descEn:   'Master of Rainbow Bridge. Each 10 characters mastered makes its scales glow anew.',
    emoji:    '🐉',
    bgColors:     ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#C084FC'],
    accentColors: ['#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'],
    stageNamesZh: ['龍蛋幼龍', '青龍少年', '彩虹飛龍', '東海真龍'],
    stageNamesEn: ['Dragon Hatchling', 'Azure Dragon', 'Rainbow Serpent', 'True Eastern Dragon'],
    stageNamesSc: ['龙蛋幼龙', '青龙少年', '彩虹飞龙', '东海真龙'],
    unlockBy:     'boss_rainbow',
    xpToNext:     [50, 120, 240],
    realmZh:      '彩虹橋',
    realmEn:      'Rainbow Bridge',
  },
  {
    id:       'pixiu',
    nameZh:   '貔貅',
    nameEn:   'Pixiu',
    nameSc:   '貔貅',
    descZh:   '星河殿的守護者，象徵財富與好運。牠的咆哮聲能傳遍整個星河。',
    descEn:   'Guardian of Galaxy Palace. Its roar echoes across the entire galaxy.',
    emoji:    '🦁',
    bgColors:     ['#F5F3FF', '#EDE9FE', '#DDD6FE', '#A78BFA'],
    accentColors: ['#6D28D9', '#5B21B6', '#4C1D95', '#3B0764'],
    stageNamesZh: ['貔貅幼獸', '銀毛貔貅', '星光貔貅', '天降貔貅'],
    stageNamesEn: ['Pixiu Cub', 'Silver Pixiu', 'Stardust Pixiu', 'Celestial Pixiu'],
    stageNamesSc: ['貔貅幼兽', '银毛貔貅', '星光貔貅', '天降貔貅'],
    unlockBy:     'boss_galaxy',
    xpToNext:     [55, 130, 260],
    realmZh:      '星河殿',
    realmEn:      'Galaxy Palace',
  },
  {
    id:       'xuanwu',
    nameZh:   '玄武',
    nameEn:   'Black Tortoise',
    nameSc:   '玄武',
    descZh:   '竹林秘境的長壽神獸，龜身蛇尾，背負整個世界的智慧。',
    descEn:   'The longevity deity of Bamboo Sanctuary. Its shell carries the wisdom of the world.',
    emoji:    '🐢',
    bgColors:     ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7'],
    accentColors: ['#047857', '#059669', '#047857', '#065F46'],
    stageNamesZh: ['小玄龜', '水墨玄武', '蛇龜玄武', '北方玄武帝'],
    stageNamesEn: ['Baby Turtle', 'Ink Tortoise', 'Serpent-Shell Xuanwu', 'Lord of the North'],
    stageNamesSc: ['小玄龟', '水墨玄武', '蛇龟玄武', '北方玄武帝'],
    unlockBy:     'boss_bamboo',
    xpToNext:     [60, 140, 280],
    realmZh:      '竹林秘境',
    realmEn:      'Bamboo Sanctuary',
  },
];

/** 根據語言回傳生物名稱 */
export function getCreatureName(c: CreatureDef, language: string): string {
  if (language === 'en') return c.nameEn;
  if (language === 'sc') return c.nameSc;
  return c.nameZh;
}

/** 根據語言回傳階段名稱 */
export function getStageName(c: CreatureDef, stage: 0|1|2|3, language: string): string {
  if (language === 'en') return c.stageNamesEn[stage];
  if (language === 'sc') return c.stageNamesSc[stage];
  return c.stageNamesZh[stage];
}

/** 進化到下一階段所需總食物 (含當前 xp 進度) */
export function xpNeededForNext(c: CreatureDef, stage: 0|1|2|3): number | null {
  if (stage >= 3) return null;
  return c.xpToNext[stage as 0|1|2] ?? null;
}
