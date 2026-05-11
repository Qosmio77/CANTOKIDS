/**
 * ParentAuthContext — 家長驗證 Context
 *
 * 管理家長 PIN 的設定與驗證狀態。
 * PIN 儲存於 useProgressStore（持久化至 AsyncStorage）。
 *
 * 設計：
 * - 首次進入家長區，設定 4 位數 PIN
 * - 之後進入需驗證 PIN
 * - session 內驗證通過後保持已驗證狀態，App 重啟清除
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useProgressStore } from '../store/useProgressStore';

interface ParentAuthContextType {
  isAuthenticated: boolean;
  hasPin: boolean;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  logout: () => void;
}

const ParentAuthContext = createContext<ParentAuthContextType | null>(null);

export function ParentAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { parentPin, setParentPin } = useProgressStore();

  const hasPin = !!parentPin;

  const setPin = useCallback(
    (pin: string) => {
      setParentPin(pin);
      setIsAuthenticated(true);
    },
    [setParentPin]
  );

  const verifyPin = useCallback(
    (pin: string): boolean => {
      const ok = pin === parentPin;
      if (ok) setIsAuthenticated(true);
      return ok;
    },
    [parentPin]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return (
    <ParentAuthContext.Provider value={{ isAuthenticated, hasPin, setPin, verifyPin, logout }}>
      {children}
    </ParentAuthContext.Provider>
  );
}

export function useParentAuth(): ParentAuthContextType {
  const ctx = useContext(ParentAuthContext);
  if (!ctx) throw new Error('useParentAuth must be used within ParentAuthProvider');
  return ctx;
}
