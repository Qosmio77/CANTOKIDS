/**
 * Word — 單字資料型別
 * 對應 words_seedling.json 的結構
 */
export interface Word {
  id: number;
  character: string;
  pinyin: string;
  jyutping: string;
  meaning_zh: string;
  meaning_en: string;
  example_sentence: string;
  stroke_count: number;
  level: 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy';
  audio_cantonese: string;
  audio_mandarin: string;
}
