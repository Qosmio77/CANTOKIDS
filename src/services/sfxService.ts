/**
 * sfxService — 全域音效管理
 *
 * 使用方式：
 *   1. App 啟動時呼叫 initSFX()（預載所有音效）
 *   2. 任何地方呼叫 playSFX('correct') 等
 *
 * 音效檔案放在 assets/sfx/ 資料夾：
 *   correct.wav  — 答題正確
 *   wrong.wav    — 答題錯誤
 *   complete.wav — 練寫完成（得星）
 *   levelup.wav  — 升級 / 徽章解鎖
 */

import { Audio } from 'expo-av';

export type SFXKey = 'correct' | 'wrong' | 'complete' | 'levelup';

const SFX_FILES: Record<SFXKey, any> = {
  correct:  require('../../assets/sfx/correct.wav'),
  wrong:    require('../../assets/sfx/wrong.wav'),
  complete: require('../../assets/sfx/complete.wav'),
  levelup:  require('../../assets/sfx/levelup.wav'),
};

const SFX_VOLUME: Record<SFXKey, number> = {
  correct:  0.8,
  wrong:    0.7,
  complete: 0.85,
  levelup:  0.9,
};

const sounds: Partial<Record<SFXKey, Audio.Sound>> = {};
let initialized = false;

/** App 啟動時呼叫一次，預載所有音效 */
export async function initSFX(): Promise<void> {
  if (initialized) return;
  initialized = true;

  for (const key of Object.keys(SFX_FILES) as SFXKey[]) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        SFX_FILES[key],
        { volume: SFX_VOLUME[key], shouldPlay: false },
      );
      sounds[key] = sound;
    } catch {
      // 靜默失敗：音效不可用時不影響應用
    }
  }
}

/** 播放指定音效（若音效未載入則靜默跳過） */
export async function playSFX(key: SFXKey): Promise<void> {
  try {
    const sound = sounds[key];
    if (!sound) return;
    // 重置到開頭再播放，確保快速連續觸發時正常響應
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // 靜默失敗
  }
}

/** App 卸載時釋放資源（選用） */
export async function unloadSFX(): Promise<void> {
  for (const sound of Object.values(sounds)) {
    try { await sound?.unloadAsync(); } catch {}
  }
}
