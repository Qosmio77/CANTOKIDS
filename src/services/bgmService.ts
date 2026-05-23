/**
 * bgmService — 背景音樂管理（隨機播放列表）
 *
 * 共 8 首曲目，隨機洗牌播放，播完自動換下一首
 * 使用 generation counter 防止多個 playTrack 並發造成重疊
 */

import { Audio } from 'expo-av';

// ── 曲目列表 ──────────────────────────────────────────────────────────
const BGM_TRACKS = [
  require('../../assets/bgm.mp3'),
  require('../../assets/bgm_monkeys.mp3'),
  require('../../assets/bgm_silly.mp3'),
  require('../../assets/bgm_delight.mp3'),
  require('../../assets/bgm_flower.mp3'),
  require('../../assets/bgm_celebration.mp3'),
  require('../../assets/bgm_funny_friends.mp3'),
  require('../../assets/bgm_lazy_village.mp3'),
];

let bgmSound: Audio.Sound | null = null;
let initialized = false;
let isPlayingEnabled = true;
let currentIndex = 0;
let shuffledOrder: number[] = [];

// Generation counter — 每次 playTrack 遞增
// callback 只有在 generation 相符時才會觸發下一首
let playGeneration = 0;

// ── Fisher-Yates 洗牌 ─────────────────────────────────────────────────
function shuffle(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── 播放指定順序中的第 index 首（防重疊版）────────────────────────────
async function playTrack(index: number): Promise<void> {
  const myGeneration = ++playGeneration;

  // 先清除舊 sound 的 callback，再卸載——防止 didJustFinish 重複觸發
  const prevSound = bgmSound;
  bgmSound = null;
  if (prevSound) {
    try {
      prevSound.setOnPlaybackStatusUpdate(null);
      await prevSound.stopAsync();
      await prevSound.unloadAsync();
    } catch {}
  }

  // 若已被更新的 generation 搶先，放棄
  if (myGeneration !== playGeneration) return;
  if (!isPlayingEnabled) return;

  const trackIndex = shuffledOrder[index % shuffledOrder.length];

  try {
    const { sound } = await Audio.Sound.createAsync(
      BGM_TRACKS[trackIndex],
      { isLooping: false, volume: 0.35, shouldPlay: true },
    );

    // 建立期間若 generation 已過期，立即卸載新 sound
    if (myGeneration !== playGeneration) {
      sound.unloadAsync().catch(() => {});
      return;
    }

    bgmSound = sound;

    // 播完後自動播下一首（只有 generation 相符才執行）
    sound.setOnPlaybackStatusUpdate((status) => {
      if (
        status.isLoaded &&
        status.didJustFinish &&
        isPlayingEnabled &&
        myGeneration === playGeneration
      ) {
        currentIndex = (currentIndex + 1) % shuffledOrder.length;
        if (currentIndex === 0) {
          shuffledOrder = shuffle(BGM_TRACKS.length);
        }
        playTrack(currentIndex).catch(() => {});
      }
    });
  } catch {
    // 靜默失敗
  }
}

// ── 公開 API ──────────────────────────────────────────────────────────

export async function initBGM(): Promise<void> {
  if (initialized) return;
  initialized = true;
  isPlayingEnabled = true;
  shuffledOrder = shuffle(BGM_TRACKS.length);
  currentIndex = 0;
  await playTrack(0);
}

export async function pauseBGM(): Promise<void> {
  isPlayingEnabled = false;
  try { await bgmSound?.pauseAsync(); } catch {}
}

export async function resumeBGM(): Promise<void> {
  isPlayingEnabled = true;
  try {
    if (bgmSound) {
      await bgmSound.playAsync();
    } else {
      await playTrack(currentIndex);
    }
  } catch {}
}

export async function skipToNextBGM(): Promise<void> {
  if (!isPlayingEnabled) return;
  currentIndex = (currentIndex + 1) % shuffledOrder.length;
  if (currentIndex === 0) {
    shuffledOrder = shuffle(BGM_TRACKS.length);
  }
  await playTrack(currentIndex);
}

export async function setBGMVolume(vol: number): Promise<void> {
  try { await bgmSound?.setVolumeAsync(vol); } catch {}
}

export async function unloadBGM(): Promise<void> {
  isPlayingEnabled = false;
  playGeneration++; // 作廢所有 pending callbacks
  try {
    bgmSound?.setOnPlaybackStatusUpdate(null);
    await bgmSound?.stopAsync();
    await bgmSound?.unloadAsync();
    bgmSound = null;
    initialized = false;
  } catch {}
}
