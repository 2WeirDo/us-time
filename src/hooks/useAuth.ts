import { useState, useCallback } from 'react';
import { LOCAL_KEYS } from '../lib/constants';

export function useAuthModule() {
  const [identity, setIdentityState] = useState<'me' | 'partner' | null>(
    () => localStorage.getItem(LOCAL_KEYS.identity) as 'me' | 'partner' | null
  );
  const [unlocked, setUnlocked] = useState(false);

  const unlock = useCallback((ident: 'me' | 'partner', passcode?: string) => {
    setIdentityState(ident);
    localStorage.setItem(LOCAL_KEYS.identity, ident);
    if (passcode) {
      localStorage.setItem(LOCAL_KEYS.remembered, JSON.stringify({ ident, passcode }));
    }
    setUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    setUnlocked(false);
    setIdentityState(null);
    localStorage.removeItem(LOCAL_KEYS.identity);
    localStorage.removeItem(LOCAL_KEYS.remembered);
  }, []);

  const getRememberedAuth = useCallback((): { ident: 'me' | 'partner'; passcode: string } | null => {
    try {
      const stored = localStorage.getItem(LOCAL_KEYS.remembered);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  return { identity, unlocked, unlock, lock, getRememberedAuth };
}
