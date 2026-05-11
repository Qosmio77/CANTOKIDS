/**
 * allWords — 集中管理全部 100 個漢字
 *
 * 所有畫面只需 import 此檔，不需各自 import 8 個 JSON。
 * getWordById() 提供跨級別 O(n) 查詢。
 */

import seedlingData  from './words_seedling.json';
import saplingData   from './words_sapling.json';
import treeData      from './words_tree.json';
import sunflowerData from './words_sunflower.json';
import rainbowData   from './words_rainbow.json';
import galaxyData    from './words_galaxy.json';
import bambooData    from './words_bamboo.json';
import jadeData      from './words_jade.json';
import { Word } from '../types/word';

export const SEEDLING_WORDS  = seedlingData  as Word[];
export const SAPLING_WORDS   = saplingData   as Word[];
export const TREE_WORDS      = treeData      as Word[];
export const SUNFLOWER_WORDS = sunflowerData as Word[];
export const RAINBOW_WORDS   = rainbowData   as Word[];
export const GALAXY_WORDS    = galaxyData    as Word[];
export const BAMBOO_WORDS    = bambooData    as Word[];
export const JADE_WORDS      = jadeData      as Word[];

export const ALL_WORDS: Word[] = [
  ...SEEDLING_WORDS,
  ...SAPLING_WORDS,
  ...TREE_WORDS,
  ...SUNFLOWER_WORDS,
  ...RAINBOW_WORDS,
  ...GALAXY_WORDS,
  ...BAMBOO_WORDS,
  ...JADE_WORDS,
];

export const SEEDLING_IDS  = SEEDLING_WORDS.map((w) => w.id);
export const SAPLING_IDS   = SAPLING_WORDS.map((w) => w.id);
export const TREE_IDS      = TREE_WORDS.map((w) => w.id);
export const SUNFLOWER_IDS = SUNFLOWER_WORDS.map((w) => w.id);
export const RAINBOW_IDS   = RAINBOW_WORDS.map((w) => w.id);
export const GALAXY_IDS    = GALAXY_WORDS.map((w) => w.id);
export const BAMBOO_IDS    = BAMBOO_WORDS.map((w) => w.id);
export const JADE_IDS      = JADE_WORDS.map((w) => w.id);

/** 根據 ID（1–100）查找單字。找不到回傳 undefined。*/
export function getWordById(id: number): Word | undefined {
  return ALL_WORDS.find((w) => w.id === id);
}
