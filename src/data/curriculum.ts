/**
 * curriculum.ts — K1-K3 粵語課程對齊
 *
 * K1 (幼兒班, ages 3-4): 基礎自然字 + 動物植物 (IDs 1-20)
 * K2 (低班, ages 4-5): 日常用語 + 數字顏色 + 身體部位 (IDs 21-50)
 * K3 (高班, ages 5-6): 家庭人物 + 動作動詞 + 抽象詞 (IDs 51-100)
 */

export type Grade = 'K1' | 'K2' | 'K3';

export interface CurriculumEntry {
  wordId: number;
  grade: Grade;
  /** 課程主題分類 */
  theme: string;
  themeEn: string;
}

/** 全部 100 個漢字的課程對齊 */
export const CURRICULUM: CurriculumEntry[] = [
  // ── K1 幼兒班 ── 自然萬物 (IDs 1-10) ──────────────────────────────
  { wordId: 1,  grade: 'K1', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 2,  grade: 'K1', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 3,  grade: 'K1', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 4,  grade: 'K1', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 5,  grade: 'K1', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 6,  grade: 'K1', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 7,  grade: 'K1', theme: '人與身體', themeEn: 'People' },
  { wordId: 8,  grade: 'K1', theme: '人與身體', themeEn: 'People' },
  { wordId: 9,  grade: 'K1', theme: '人與身體', themeEn: 'People' },
  { wordId: 10, grade: 'K1', theme: '人與身體', themeEn: 'People' },

  // ── K1 幼兒班 ── 動物植物 (IDs 11-20) ────────────────────────────
  { wordId: 11, grade: 'K1', theme: '動物植物', themeEn: 'Animals & Plants' },
  { wordId: 12, grade: 'K1', theme: '動物植物', themeEn: 'Animals & Plants' },
  { wordId: 13, grade: 'K1', theme: '動物植物', themeEn: 'Animals & Plants' },
  { wordId: 14, grade: 'K1', theme: '動物植物', themeEn: 'Animals & Plants' },
  { wordId: 15, grade: 'K1', theme: '動物植物', themeEn: 'Animals & Plants' },
  { wordId: 16, grade: 'K1', theme: '動物植物', themeEn: 'Animals & Plants' },
  { wordId: 17, grade: 'K1', theme: '天氣環境', themeEn: 'Weather' },
  { wordId: 18, grade: 'K1', theme: '天氣環境', themeEn: 'Weather' },
  { wordId: 19, grade: 'K1', theme: '天氣環境', themeEn: 'Weather' },
  { wordId: 20, grade: 'K1', theme: '天氣環境', themeEn: 'Weather' },

  // ── K2 低班 ── 日常用語 (IDs 21-30) ──────────────────────────────
  { wordId: 21, grade: 'K2', theme: '日常用語', themeEn: 'Daily Life' },
  { wordId: 22, grade: 'K2', theme: '日常用語', themeEn: 'Daily Life' },
  { wordId: 23, grade: 'K2', theme: '日常用語', themeEn: 'Daily Life' },
  { wordId: 24, grade: 'K2', theme: '日常用語', themeEn: 'Daily Life' },
  { wordId: 25, grade: 'K2', theme: '日常用語', themeEn: 'Daily Life' },
  { wordId: 26, grade: 'K2', theme: '形容描述', themeEn: 'Descriptors' },
  { wordId: 27, grade: 'K2', theme: '形容描述', themeEn: 'Descriptors' },
  { wordId: 28, grade: 'K2', theme: '形容描述', themeEn: 'Descriptors' },
  { wordId: 29, grade: 'K2', theme: '形容描述', themeEn: 'Descriptors' },
  { wordId: 30, grade: 'K2', theme: '形容描述', themeEn: 'Descriptors' },

  // ── K2 低班 ── 數字顏色 (IDs 31-50) ──────────────────────────────
  { wordId: 31, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 32, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 33, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 34, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 35, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 36, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 37, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 38, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 39, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 40, grade: 'K2', theme: '數字計算', themeEn: 'Numbers' },
  { wordId: 41, grade: 'K2', theme: '顏色形狀', themeEn: 'Colours' },
  { wordId: 42, grade: 'K2', theme: '顏色形狀', themeEn: 'Colours' },
  { wordId: 43, grade: 'K2', theme: '顏色形狀', themeEn: 'Colours' },
  { wordId: 44, grade: 'K2', theme: '顏色形狀', themeEn: 'Colours' },
  { wordId: 45, grade: 'K2', theme: '顏色形狀', themeEn: 'Colours' },
  { wordId: 46, grade: 'K2', theme: '身體部位', themeEn: 'Body Parts' },
  { wordId: 47, grade: 'K2', theme: '身體部位', themeEn: 'Body Parts' },
  { wordId: 48, grade: 'K2', theme: '身體部位', themeEn: 'Body Parts' },
  { wordId: 49, grade: 'K2', theme: '身體部位', themeEn: 'Body Parts' },
  { wordId: 50, grade: 'K2', theme: '身體部位', themeEn: 'Body Parts' },

  // ── K3 高班 ── 家庭人物 (IDs 51-60) ──────────────────────────────
  { wordId: 51, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 52, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 53, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 54, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 55, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 56, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 57, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 58, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 59, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },
  { wordId: 60, grade: 'K3', theme: '家庭人物', themeEn: 'Family' },

  // ── K3 高班 ── 動作動詞 (IDs 61-80) ──────────────────────────────
  { wordId: 61, grade: 'K3', theme: '學習動作', themeEn: 'Learning Actions' },
  { wordId: 62, grade: 'K3', theme: '學習動作', themeEn: 'Learning Actions' },
  { wordId: 63, grade: 'K3', theme: '學習動作', themeEn: 'Learning Actions' },
  { wordId: 64, grade: 'K3', theme: '學習動作', themeEn: 'Learning Actions' },
  { wordId: 65, grade: 'K3', theme: '學習動作', themeEn: 'Learning Actions' },
  { wordId: 66, grade: 'K3', theme: '運動動作', themeEn: 'Physical Actions' },
  { wordId: 67, grade: 'K3', theme: '運動動作', themeEn: 'Physical Actions' },
  { wordId: 68, grade: 'K3', theme: '情感表達', themeEn: 'Emotions' },
  { wordId: 69, grade: 'K3', theme: '情感表達', themeEn: 'Emotions' },
  { wordId: 70, grade: 'K3', theme: '運動動作', themeEn: 'Physical Actions' },
  { wordId: 71, grade: 'K3', theme: '運動動作', themeEn: 'Physical Actions' },
  { wordId: 72, grade: 'K3', theme: '學習動作', themeEn: 'Learning Actions' },
  { wordId: 73, grade: 'K3', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 74, grade: 'K3', theme: '自然萬物', themeEn: 'Nature' },
  { wordId: 75, grade: 'K3', theme: '人際關係', themeEn: 'Relationships' },
  { wordId: 76, grade: 'K3', theme: '人際關係', themeEn: 'Relationships' },
  { wordId: 77, grade: 'K3', theme: '形容描述', themeEn: 'Descriptors' },
  { wordId: 78, grade: 'K3', theme: '形容描述', themeEn: 'Descriptors' },
  { wordId: 79, grade: 'K3', theme: '日常用語', themeEn: 'Daily Life' },
  { wordId: 80, grade: 'K3', theme: '日常用語', themeEn: 'Daily Life' },

  // ── K3 高班 ── 思維抽象 (IDs 81-100) ────────────────────────────
  { wordId: 81, grade: 'K3', theme: '思維抽象', themeEn: 'Abstract Thinking' },
  { wordId: 82, grade: 'K3', theme: '思維抽象', themeEn: 'Abstract Thinking' },
  { wordId: 83, grade: 'K3', theme: '思維抽象', themeEn: 'Abstract Thinking' },
  { wordId: 84, grade: 'K3', theme: '思維抽象', themeEn: 'Abstract Thinking' },
  { wordId: 85, grade: 'K3', theme: '品格美德', themeEn: 'Virtues' },
  { wordId: 86, grade: 'K3', theme: '品格美德', themeEn: 'Virtues' },
  { wordId: 87, grade: 'K3', theme: '品格美德', themeEn: 'Virtues' },
  { wordId: 88, grade: 'K3', theme: '品格美德', themeEn: 'Virtues' },
  { wordId: 89, grade: 'K3', theme: '品格美德', themeEn: 'Virtues' },
  { wordId: 90, grade: 'K3', theme: '品格美德', themeEn: 'Virtues' },
  { wordId: 91, grade: 'K3', theme: '行動進取', themeEn: 'Action & Progress' },
  { wordId: 92, grade: 'K3', theme: '行動進取', themeEn: 'Action & Progress' },
  { wordId: 93, grade: 'K3', theme: '行動進取', themeEn: 'Action & Progress' },
  { wordId: 94, grade: 'K3', theme: '行動進取', themeEn: 'Action & Progress' },
  { wordId: 95, grade: 'K3', theme: '探索求知', themeEn: 'Curiosity & Learning' },
  { wordId: 96, grade: 'K3', theme: '探索求知', themeEn: 'Curiosity & Learning' },
  { wordId: 97, grade: 'K3', theme: '探索求知', themeEn: 'Curiosity & Learning' },
  { wordId: 98, grade: 'K3', theme: '探索求知', themeEn: 'Curiosity & Learning' },
  { wordId: 99, grade: 'K3', theme: '探索求知', themeEn: 'Curiosity & Learning' },
  { wordId: 100, grade: 'K3', theme: '情感表達', themeEn: 'Emotions' },
];

/** 快速查詢：根據 wordId 取得課程資料 */
export function getCurriculumEntry(wordId: number): CurriculumEntry | undefined {
  return CURRICULUM.find(e => e.wordId === wordId);
}

/** 取得指定年級的所有 wordId */
export function getWordIdsByGrade(grade: Grade): number[] {
  return CURRICULUM.filter(e => e.grade === grade).map(e => e.wordId);
}

/** 取得指定年級內各主題的分組 */
export function getThemesByGrade(grade: Grade): Record<string, number[]> {
  const entries = CURRICULUM.filter(e => e.grade === grade);
  const groups: Record<string, number[]> = {};
  for (const entry of entries) {
    if (!groups[entry.theme]) groups[entry.theme] = [];
    groups[entry.theme].push(entry.wordId);
  }
  return groups;
}

export const GRADE_INFO: Record<Grade, { nameZh: string; nameEn: string; color: string; bgColor: string; emoji: string; ageRange: string }> = {
  K1: { nameZh: '幼兒班',   nameEn: 'Nursery (K1)',  color: '#16a34a', bgColor: '#f0fdf4', emoji: '🌱', ageRange: '3-4歲' },
  K2: { nameZh: '低班',     nameEn: 'Lower KG (K2)', color: '#2563eb', bgColor: '#eff6ff', emoji: '🌿', ageRange: '4-5歲' },
  K3: { nameZh: '高班',     nameEn: 'Upper KG (K3)', color: '#9333ea', bgColor: '#faf5ff', emoji: '🌳', ageRange: '5-6歲' },
};
