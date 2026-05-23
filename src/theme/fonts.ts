/**
 * CantoKids 字體系統
 * 主字體：jf open 粉圓 — 圓潤活潑，完整支援繁體中文，小朋友最愛
 */

export const Fonts = {
  /** 主字體（繁體中文 + 數字 + 英文） */
  round: 'JFOpenHuninn',
};

/**
 * 全局文字樣式快捷方式
 * 用法：<Text style={[FS.h1, { color: Colors.text }]}>標題</Text>
 */
export const FS = {
  // 標題
  h1:   { fontFamily: 'JFOpenHuninn', fontSize: 32 } as const,
  h2:   { fontFamily: 'JFOpenHuninn', fontSize: 26 } as const,
  h3:   { fontFamily: 'JFOpenHuninn', fontSize: 22 } as const,

  // 內文
  body: { fontFamily: 'JFOpenHuninn', fontSize: 18 } as const,
  sm:   { fontFamily: 'JFOpenHuninn', fontSize: 15 } as const,
  xs:   { fontFamily: 'JFOpenHuninn', fontSize: 13 } as const,

  // 特大（漢字學習用）
  char: { fontFamily: 'JFOpenHuninn', fontSize: 64 } as const,
};
