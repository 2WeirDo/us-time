import { useCallback } from 'react';
import type { AppState, LoveLetter } from '../types';
import {
  createLoveLetter as createLoveLetterDB,
  markLetterAsRead,
  deleteLoveLetter as deleteLoveLetterDB,
} from '../lib/db';

interface UseLettersDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function useLetters({ setState, toast, loadData }: UseLettersDeps) {
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
