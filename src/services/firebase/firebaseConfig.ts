/**
 * Firebase 設定
 * Phase 3: 替換 placeholder 為真實 Firebase 專案設定
 *
 * 安裝：
 *   npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
 *
 * 或使用 Supabase（替代方案）：
 *   npm install @supabase/supabase-js
 */

export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'cantokids-app.firebaseapp.com',
  projectId: 'cantokids-app',
  storageBucket: 'cantokids-app.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

/** Firestore 集合名稱常數 */
export const COLLECTIONS = {
  USERS: 'users',
  PROGRESS: 'progress',
  PARENT_LINKS: 'parentLinks',
} as const;
