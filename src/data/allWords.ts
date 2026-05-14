/**
 * allWords — 集中管理全部學習內容
 *
 * 單字（100 個）+ 詞語（10 個）+ 成語（6 個）
 * 所有畫面只需 import 此檔，不需各自 import JSON。
 * getWordById() 提供跨級別 O(n) 查詢。
 *
 * 解鎖門檻：
 *   VOCAB_UNLOCK_THRESHOLD — 需學會 N 個字才解鎖詞語
 *   IDIOM_UNLOCK_THRESHOLD — 需學會 N 個詞語才解鎖成語
 */

import seedlingData  from './words_seedling.json';
import saplingData   from './words_sapling.json';
import treeData      from './words_tree.json';
import sunflowerData from './words_sunflower.json';
import rainbowData   from './words_rainbow.json';
import galaxyData    from './words_galaxy.json';
import bambooData    from './words_bamboo.json';
import jadeData      from './words_jade.json';
import vocabData     from './words_vocab.json';
import idiomsData    from './words_idioms.json';
import { Word } from '../types/word';

export const SEEDLING_WORDS  = seedlingData  as Word[];
export const SAPLING_WORDS   = saplingData   as Word[];
export const TREE_WORDS      = treeData      as Word[];
export const SUNFLOWER_WORDS = sunflowerData as Word[];
export const RAINBOW_WORDS   = rainbowData   as Word[];
export const GALAXY_WORDS    = galaxyData    as Word[];
export const BAMBOO_WORDS    = bambooData    as Word[];
export const JADE_WORDS      = jadeData      as Word[];
export const VOCAB_WORDS     = vocabData     as Word[];
export const IDIOM_WORDS     = idiomsData    as Word[];

/** 全部內容（單字 + 詞語 + 成語） */
export const ALL_WORDS: Word[] = [
  ...SEEDLING_WORDS,
  ...SAPLING_WORDS,
  ...TREE_WORDS,
  ...SUNFLOWER_WORDS,
  ...RAINBOW_WORDS,
  ...GALAXY_WORDS,
  ...BAMBOO_WORDS,
  ...JADE_WORDS,
  ...VOCAB_WORDS,
  ...IDIOM_WORDS,
];

/** 只包含單字（用於進度計算、解鎖門檻判斷） */
export const ALL_CHARACTER_WORDS: Word[] = ALL_WORDS.filter(
  (w) => !w.contentType || w.contentType === 'character',
);

export const SEEDLING_IDS  = SEEDLING_WORDS.map((w) => w.id);
export const SAPLING_IDS   = SAPLING_WORDS.map((w) => w.id);
export const TREE_IDS      = TREE_WORDS.map((w) => w.id);
export const SUNFLOWER_IDS = SUNFLOWER_WORDS.map((w) => w.id);
export const RAINBOW_IDS   = RAINBOW_WORDS.map((w) => w.id);
export const GALAXY_IDS    = GALAXY_WORDS.map((w) => w.id);
export const BAMBOO_IDS    = BAMBOO_WORDS.map((w) => w.id);
export const JADE_IDS      = JADE_WORDS.map((w) => w.id);
export const VOCAB_IDS     = VOCAB_WORDS.map((w) => w.id);
export const IDIOM_IDS     = IDIOM_WORDS.map((w) => w.id);

// ── 解鎖門檻 ─────────────────────────────────────────────────────────
/** 需要學識 N 個漢字，才能解鎖詞語關卡 */
export const VOCAB_UNLOCK_THRESHOLD = 5;
/** 需要學識 N 個詞語，才能解鎖成語關卡 */
export const IDIOM_UNLOCK_THRESHOLD = 3;
/** 詞語第一關的 lessonId */
export const FIRST_VOCAB_LESSON_ID = 1001;
/** 成語第一關的 lessonId */
export const FIRST_IDIOM_LESSON_ID = 2001;

/** 根據 ID 查找任意學習內容。找不到回傳 undefined。*/
export function getWordById(id: number): Word | undefined {
  return ALL_WORDS.find((w) => w.id === id);
}
