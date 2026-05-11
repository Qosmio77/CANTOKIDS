/**
 * lootService.ts — 戰利品掉落服務
 *
 * 依 Boss 關卡決定掉落數量與稀有度機率，
 * 再從對應關卡的寶物池中隨機挑選。
 */

import { Treasure, Rarity, TREASURES } from '../data/treasures';

// ── 關卡掉落設定 ─────────────────────────────────────────────────────
interface LootConfig {
  dropCount: [number, number]; // [min, max] 掉落件數
  weights: Record<Rarity, number>; // 加權機率（合計不需 = 100，會自動正規化）
}

const LOOT_CONFIG: Record<string, LootConfig> = {
  seedling: {
    dropCount: [1, 1],
    weights: { common: 70, rare: 25, epic: 5, legendary: 0 },
  },
  sapling: {
    dropCount: [1, 2],
    weights: { common: 60, rare: 30, epic: 9, legendary: 1 },
  },
  tree: {
    dropCount: [1, 2],
    weights: { common: 45, rare: 35, epic: 15, legendary: 5 },
  },
  sunflower: {
    dropCount: [2, 2],
    weights: { common: 30, rare: 35, epic: 25, legendary: 10 },
  },
  rainbow: {
    dropCount: [2, 2],
    weights: { common: 20, rare: 30, epic: 30, legendary: 20 },
  },
  galaxy: {
    dropCount: [2, 3],
    weights: { common: 10, rare: 20, epic: 40, legendary: 30 },
  },
  bamboo: {
    dropCount: [2, 3],
    weights: { common: 25, rare: 35, epic: 30, legendary: 10 },
  },
  jade: {
    dropCount: [2, 3],
    weights: { common: 10, rare: 20, epic: 35, legendary: 35 },
  },
};

// ── 加權隨機抽稀有度 ─────────────────────────────────────────────────
function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

// ── 從候選池中隨機挑一件（避免重複，若池子不夠則允許重複） ────────────
function pickFromPool(pool: Treasure[], alreadyPicked: Set<string>): Treasure {
  const available = pool.filter((t) => !alreadyPicked.has(t.id));
  const candidates = available.length > 0 ? available : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── 主入口 ───────────────────────────────────────────────────────────
/**
 * rollLoot — 根據 bossLevelKey 擲出戰利品
 * @returns 掉落的寶物陣列（1–3 件）
 */
export function rollLoot(bossLevelKey: string): Treasure[] {
  const config = LOOT_CONFIG[bossLevelKey];
  if (!config) return [];

  // 當前關卡寶物池（依稀有度分組）
  const levelPool = TREASURES.filter((t) => t.bossLevelKey === bossLevelKey);
  if (levelPool.length === 0) return [];

  const poolByRarity: Record<Rarity, Treasure[]> = {
    common:    levelPool.filter((t) => t.rarity === 'common'),
    rare:      levelPool.filter((t) => t.rarity === 'rare'),
    epic:      levelPool.filter((t) => t.rarity === 'epic'),
    legendary: levelPool.filter((t) => t.rarity === 'legendary'),
  };

  // 決定本次掉落件數
  const [minDrop, maxDrop] = config.dropCount;
  const dropCount =
    minDrop === maxDrop
      ? minDrop
      : minDrop + Math.floor(Math.random() * (maxDrop - minDrop + 1));

  const dropped: Treasure[] = [];
  const pickedIds = new Set<string>();

  for (let i = 0; i < dropCount; i++) {
    // 抽稀有度
    const rarity = rollRarity(config.weights);

    // 若該稀有度無寶物，fallback 到 common
    const pool =
      poolByRarity[rarity].length > 0 ? poolByRarity[rarity] : poolByRarity.common;

    if (pool.length === 0) continue;

    const treasure = pickFromPool(pool, pickedIds);
    pickedIds.add(treasure.id);
    dropped.push(treasure);
  }

  return dropped;
}
