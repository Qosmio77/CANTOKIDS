// QR Auth stub — MVP 階段暫時停用
export type SessionStatus = 'pending' | 'scanned' | 'authenticated' | 'rejected';
export interface QRUserData {
  displayName: string; playerXP: number; playerLevel: number;
  totalStars: number; streakDays: number;
  perfectQuizzes: number; totalCorrect: number; totalAnswers: number;
  bossesDefeated: string[];
  wordProgress: Record<string, { learned: boolean; correctCount: number; wrongCount: number }>;
  syncedAt: number;
}
export interface QRSession { status: SessionStatus; createdAt: number; userData?: QRUserData; }
export const SESSION_TTL_MS = 300000;
export function generateSessionId() { return 'stub-session'; }
export function encodeQRPayload(id: string) { return `cantokids://qr/${id}`; }
export function decodeQRPayload(_raw: string): string | null { return null; }
export async function createSession(_id: string): Promise<void> {}
export function listenToSession(_id: string, _cb: (s: QRSession | null) => void): () => void { return () => {}; }
export async function markSessionScanned(_id: string): Promise<void> {}
export async function approveSession(_id: string, _data: QRUserData): Promise<void> {}
export async function rejectSession(_id: string): Promise<void> {}
export async function deleteSession(_id: string): Promise<void> {}
export function isSessionExpired(_session: QRSession): boolean { return false; }
