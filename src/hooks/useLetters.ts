import { useCallback, useEffect } from 'react';
import type { AppState, LoveLetter } from '../types';
import {
  createLoveLetter as createLoveLetterDB,
  markLetterAsRead,
  deleteLoveLetter as deleteLoveLetterDB,
  subscribeToLetters,
} from '../lib/db';

interface UseLettersDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  unlocked: boolean;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function useLetters({ setState, unlocked, toast, loadData }: UseLettersDeps) {
  // ---- Real-time subscription ----
  useEffect(() => {
    if (!unlocked) return;
    const cleanup = subscribeToLetters(
      (newLetter) =>
        setState((prev) => {
          if (prev.loveLetters.some((l) => l.id === newLetter.id)) return prev;
          return { ...prev, loveLetters: [newLetter, ...prev.loveLetters] };
        }),
      (updatedLetter) =>
        setState((prev) => ({
          ...prev,
          loveLetters: prev.loveLetters.map((l) =>
            l.id === updatedLetter.id ? updatedLetter : l
          ),
        })),
      (letterId) =>
        setState((prev) => ({
          ...prev,
          loveLetters: prev.loveLetters.filter((l) => l.id !== letterId),
        }))
    );
    return cleanup;
  }, [unlocked, setState]);

  // ---- Actions ----

  const addLetter = useCallback(
    async (letter: Omit<LoveLetter, 'id' | 'createdAt' | 'read'>) => {
      const result = await createLoveLetterDB({ ...letter, read: false });
      if (result) {
        setState((prev) => ({ ...prev, loveLetters: [result, ...prev.loveLetters] }));
        toast('书信已发送 💌', 'success');
      } else {
        toast('发送失败，请重试', 'error');
      }
    },
    [setState, toast]
  );

  const markLetterRead = useCallback(
    async (letterId: string) => {
      setState((prev) => ({
        ...prev,
        loveLetters: prev.loveLetters.map((l) =>
          l.id === letterId ? { ...l, read: true } : l
        ),
      }));
      const success = await markLetterAsRead(letterId);
      if (!success) {
        setState((prev) => ({
          ...prev,
          loveLetters: prev.loveLetters.map((l) =>
            l.id === letterId ? { ...l, read: false } : l
          ),
        }));
      }
    },
    [setState]
  );

  const deleteLetter = useCallback(
    async (letterId: string) => {
      setState((prev) => ({
        ...prev,
        loveLetters: prev.loveLetters.filter((l) => l.id !== letterId),
      }));
      const success = await deleteLoveLetterDB(letterId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        loadData();
      }
    },
    [setState, toast, loadData]
  );

  return { addLetter, markLetterRead, deleteLetter };
}
