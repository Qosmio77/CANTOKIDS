/**
 * syncService — 雲端進度同步服務（Firebase Firestore）
 *
 * Phase 3 架構：
 * - 每次完成課程 / 測驗後，將進度推送至 Firestore
 * - 家長端 Dashboard 讀取同一份資料
 * - 多裝置衝突策略：以 lastUpdated 時間戳為準（latest wins）
 *
 * 目前為 stub 實作，整合 Firebase SDK 後替換 TODO 區塊
 */

import { COLLECTIONS } from './firebaseConfig';

export interface CloudProgress {
  userId: string;
  displayName: string;
  totalStars: number;
  learnedWordIds: number[];
  perfectQuizzes: number;
  streakDays: number;
  lastUpdated: string; // ISO timestamp
}

/**
 * 上傳進度至 Firestore
 * TODO: 替換為真實 Firebase 呼叫
 */
export async function pushProgressToCloud(
  userId: string,
  progress: Omit<CloudProgress, 'userId' | 'lastUpdated'>
): Promise<void> {
  try {
    const payload: CloudProgress = {
      ...progress,
      userId,
      lastUpdated: new Date().toISOString(),
    };
    // TODO: await firestore().collection(COLLECTIONS.PROGRESS).doc(userId).set(payload, { merge: true });
    if (__DEV__) console.log('[syncService] 模擬推送進度:', payload);
  } catch (err) {
    if (__DEV__) console.warn('[syncService] 推送失敗:', err);
    // 離線時靜默失敗，AsyncStorage 保有本地備份
  }
}

/**
 * 從 Firestore 拉取進度（用於多裝置同步）
 * TODO: 替換為真實 Firebase 呼叫
 */
export async function pullProgressFromCloud(userId: string): Promise<CloudProgress | null> {
  try {
    // TODO: const doc = await firestore().collection(COLLECTIONS.PROGRESS).doc(userId).get();
    // TODO: return doc.exists ? (doc.data() as CloudProgress) : null;
    if (__DEV__) console.log('[syncService] 模擬拉取進度 for userId:', userId);
    return null;
  } catch (err) {
    if (__DEV__) console.warn('[syncService] 拉取失敗:', err);
    return null;
  }
}

/**
 * 綁定家長帳號至孩童帳號
 * TODO: 替換為真實 Firebase 呼叫
 */
export async function linkParentToChild(
  parentEmail: string,
  childUserId: string
): Promise<boolean> {
  try {
    // TODO: await firestore().collection(COLLECTIONS.PARENT_LINKS).add({ parentEmail, childUserId, linkedAt: new Date().toISOString() });
    if (__DEV__) console.log('[syncService] 模擬綁定家長:', parentEmail, '->', childUserId);
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[syncService] 綁定失敗:', err);
    return false;
  }
}
