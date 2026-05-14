/**
 * Word — 學習內容資料型別
 *
 * contentType 區分三種內容：
 *   'character' — 單字（預設，向後相容）
 *   'word'      — 詞語（2 個字）
 *   'idiom'     — 成語（4 個字）
 *
 * components / componentJyutping / componentPinyin
 *   供詞語 & 成語記錄各分字的拼音，以及逐字練寫流程使用。
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
  level: 'seedling' | 'sapling' | 'tree' | 'sunflower' | 'rainbow' | 'galaxy' | 'bamboo' | 'jade' | 'vocab' | 'idiom';
  audio_cantonese: string;
  audio_mandarin: string;

  /** 認知橋樑用途的 emoji 圖示（可選）*/
  emoji?: string;

  // ── 多字內容擴充（可選，向後相容）────────────────────────
  contentType?: 'character' | 'word' | 'idiom';
  /** 組成文字的各個漢字，例如 ["朋","友"] */
  components?: string[];
  /** 各分字的粵語拼音，例如 ["pang4","jau5"] */
  componentJyutping?: string[];
  /** 各分字的普通話拼音，例如 ["péng","yǒu"] */
  componentPinyin?: string[];
}
