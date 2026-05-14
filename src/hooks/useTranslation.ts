/**
 * useTranslation — 讀取當前語言並返回字串
 *
 * 用法：
 *   const { t, language } = useTranslation();
 *   t('greeting', { name: '小明' })  →  '你好，小明！ 👋'
 */

import { useProgressStore } from '../store/useProgressStore';
import { translations, Language } from '../i18n/translations';

export function useTranslation() {
  const language = useProgressStore((s) => s.language ?? 'zh') as Language;
  const dict = translations[language] ?? translations.zh;

  /**
   * t(key, vars?) — 取得翻譯字串，支援 {placeholder} 替換
   * e.g. t('greeting', { name: '小明' })
   */
  function t(key: keyof typeof dict, vars?: Record<string, string | number>): string {
    let str: string = (dict as any)[key] ?? (translations.zh as any)[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  }

  /**
   * ta(key) — 取得翻譯陣列（用於 features list、tips 等）
   */
  function ta(key: keyof typeof dict): string[] {
    const val = (dict as any)[key] ?? (translations.zh as any)[key];
    return Array.isArray(val) ? val : [String(val)];
  }

  return { t, ta, language };
}
