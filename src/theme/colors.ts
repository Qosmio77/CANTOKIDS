/**
 * CantoKids 設計系統 — 顏色常數
 *
 * 設計原則（Phase 5 更新）：
 *   • 主背景：暖奶油 (#FFFBEB) — 護眼，兒童友好
 *   • 行動按鈕：鮮豔琥珀 + 珊瑚橙 — 高對比，吸引點擊
 *   • 卡片 / 介面元素：柔和粉彩 — 舒緩，不刺激眼睛
 *   • 連勝 / 錯誤：紅色系 — 情緒識別
 *   • 已學完：薄荷綠系 — 成就感、正向回饋
 */
export const Colors = {
  // ── 主色 — 暖金黃（行動按鈕、主要 CTA）─────────────────────────
  primary:      '#F59E0B',   // 鮮豔琥珀，高對比
  primaryLight: '#FDE68A',   // 淡金，邊框 / 強調
  primaryBg:    '#FFFBEB',   // 主背景：暖奶油
  primaryMuted: '#FEF3C7',   // 柔和黃，徽章 / 次要背景
  primaryDeep:  '#D97706',   // 深琥珀，數字 / 星數

  // ── 柔和粉彩（Phase 5 新增）— 兒童友好，護眼 ───────────────────
  softCream:    '#FFFDF7',   // 比 primaryBg 更暖的奶油（可用於卡片底色）
  softMint:     '#F0FDF4',   // 柔和薄荷綠（成功 / 已學）
  softPeach:    '#FFF7ED',   // 柔和蜜桃（測驗相關背景）
  softLavender: '#F5F3FF',   // 柔和薰衣草（設定 / 次要入口）

  // ── 成功 — 薄荷翠綠 ─────────────────────────────────────────────
  success:       '#10B981',
  successLight:  '#ECFDF5',
  successBorder: '#6EE7B7',

  // ── 粵語 — 天空藍 ───────────────────────────────────────────────
  cantonese:     '#3B82F6',
  cantoneseLight:'#DBEAFE',
  cantoneseBg:   '#EFF6FF',

  // ── 普通話 — 薰衣草紫 ───────────────────────────────────────────
  mandarin:      '#7C3AED',
  mandarinLight: '#EDE9FE',

  // ── 測驗 — 珊瑚橙（行動按鈕，高對比）──────────────────────────
  quiz:          '#F97316',
  quizLight:     '#FFF7ED',

  // ── 中性色 ──────────────────────────────────────────────────────
  text:          '#1F2937',  // 主文字，深炭灰
  textSecondary: '#6B7280',  // 次要文字
  textMuted:     '#9CA3AF',  // 輔助文字，淡灰
  border:        '#E5E7EB',  // 一般邊框
  borderLight:   '#F3F4F6',  // 淡邊框
  white:         '#FFFFFF',

  // ── 連勝 / 錯誤 — 紅色系 ────────────────────────────────────────
  streak:        '#EF4444',  // 火焰紅
  streakBg:      '#FEF2F2',  // 火焰背景（柔和粉紅）
  error:         '#EF4444',
  errorLight:    '#FEF2F2',
} as const;
