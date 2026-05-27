/**
 * CantoKids 設計系統 — Honey Bear Joy 色系 (Phase 6 UI Refresh)
 *
 * 設計靈感：Google Stitch「Honey Bear Joy」
 *   • 背景：暖奶油 (#fbf9f1) — 比純白溫暖，護眼
 *   • 主色：琥珀黃 (#E8A000) — 高對比 CTA
 *   • 次色：活力橙 (#fd8b00) — Daily Challenge、Streak
 *   • 分類卡：6 色柔和粉彩 — 動物/自然/數字/顏色/家人/生活
 */
export const Colors = {
  // ── 主色 — 琥珀黃 ─────────────────────────────────────────────
  primary:       '#E8A000',   // 琥珀黃（CTA、高亮）
  primaryDark:   '#705d00',   // 深黃棕
  primaryLight:  '#ffe16d',   // 淡黃
  primaryBg:     '#fbf9f1',   // 主背景：暖奶油
  primaryMuted:  '#f5f4ec',   // 次要背景
  primaryDeep:   '#544600',   // 最深黃棕（數字/標題）

  // ── 次色 — 活力橙（CTA 按鈕、連勝）──────────────────────────
  secondary:     '#fd8b00',   // 活力橙
  secondaryDark: '#904d00',   // 深橙
  secondaryLight:'#fff7ed',   // 淡橙底

  // ── Daily Goal 卡片色 ────────────────────────────────────────
  goalCard:      '#FFF3C4',   // 暖黃卡片底色
  goalCardBorder:'#F0C060',   // 暖黃邊框
  goalBar:       '#E8A000',   // 進度條填充
  goalBarTrack:  '#F0E090',   // 進度條軌道

  // ── 主題分類卡 — 6 色柔和粉彩 ─────────────────────────────────
  catAnimalsBg:   '#BAE6FD',  catAnimalsBorder: '#7DD3FC',  // 動物 — 天藍
  catNatureBg:    '#BBF7D0',  catNatureBorder:  '#86EFAC',  // 自然 — 薄荷
  catNumbersBg:   '#FEF9C3',  catNumbersBorder: '#FDE047',  // 數字 — 蜜黃
  catColorsBg:    '#DDD6FE',  catColorsBorder:  '#C4B5FD',  // 顏色 — 薰衣草
  catFamilyBg:    '#FCE7F3',  catFamilyBorder:  '#F9A8D4',  // 家人 — 粉紅
  catDailyBg:     '#FED7AA',  catDailyBorder:   '#FDBA74',  // 生活 — 蜜桃

  // ── 成功 ─────────────────────────────────────────────────────
  success:        '#16a34a',
  successLight:   '#dcfce7',
  successBorder:  '#86efac',

  // ── 粵語測驗 — 天藍 ──────────────────────────────────────────
  cantonese:      '#3B82F6',
  cantoneseLight: '#DBEAFE',
  cantoneseBg:    '#EFF6FF',

  // ── 普通話測驗 — 薰衣草紫 ────────────────────────────────────
  mandarin:       '#7C3AED',
  mandarinLight:  '#EDE9FE',

  // ── 測驗 CTA — 珊瑚橙 ────────────────────────────────────────
  quiz:           '#F97316',
  quizLight:      '#FFF7ED',

  // ── 中性色 ───────────────────────────────────────────────────
  text:           '#1b1c17',   // 暖近黑（主文字）
  textSecondary:  '#4d4732',   // 暖棕（次要文字）
  textMuted:      '#7e775f',   // 輔助文字
  border:         '#d0c6ab',   // 暖邊框
  borderLight:    '#e4e3db',   // 淡邊框
  white:          '#ffffff',

  // ── 連勝 — 橙色系（Honey Bear 用橙而非紅）────────────────────
  streak:         '#fd8b00',   // 連勝橙
  streakBg:       '#fff7ed',   // 連勝底色

  // ── 錯誤 ─────────────────────────────────────────────────────
  error:          '#ba1a1a',
  errorLight:     '#ffdad6',
} as const;

/** 字卡漢字字型 — 與 HanziWriter 筆畫風格一致（NotoSerifTC 楷書子集） */
export const CHAR_FONT = 'NotoSerifTC';
