import { useCallback, useEffect } from 'react';
import type { AppState } from '../types';
import { getDayKey } from '../lib/utils';
import { LOCAL_KEYS } from '../lib/constants';
import { saveTodayMood as saveTodayMoodDB, subscribeToMoods } from '../lib/db';

interface UseMoodThemeDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  unlocked: boolean;
}

export function useMoodTheme({ setState, unlocked }: UseMoodThemeDeps) {
  // ---- Real-time subscription for moods ----
  useEffect(() => {
    if (!unlocked) return;
    const cleanup = subscribeToMoods(
      (newMood) =>
        setState((prev) => {
          const filtered = prev.todayMoods.filter(
            (m) => !(m.date === newMood.date && m.author === newMood.author)
          );
          const updated = [...filtered, newMood];
          localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(updated));
          return { ...prev, todayMoods: updated };
        }),
      (updatedMood) =>
        setState((prev) => {
          const filtered = prev.todayMoods.filter(
            (m) => !(m.date === updatedMood.date && m.author === updatedMood.author)
          );
          const updated = [...filtered, updatedMood];
          localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(updated));
          return { ...prev, todayMoods: updated };
        }),
      (deleted) =>
        setState((prev) => {
          const updated = prev.todayMoods.filter(
            (m) => !(m.date === deleted.date && m.author === deleted.author)
          );
          localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(updated));
          return { ...prev, todayMoods: updated };
        })
    );
    return cleanup;
  }, [unlocked, setState]);

  const setTodayMood = useCallback(
    async (mood: { date: string; author: 'me' | 'partner'; mood: string }) => {
      // Optimistic local update
      setState((prev) => {
        const filtered = prev.todayMoods.filter(
          (m) => !(m.date === mood.date && m.author === mood.author)
        );
        const newMoods = [...filtered, mood];
        localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(newMoods));
        return { ...prev, todayMoods: newMoods };
      });

      // Persist to Supabase for cross-device sync
      await saveTodayMoodDB(mood);
    },
    [setState]
  );

  const setTheme = useCallback((theme: AppState['theme']) => {
    localStorage.setItem(LOCAL_KEYS.theme, theme);
    setState((prev) => ({ ...prev, theme }));
  }, [setState]);

  return { setTodayMood, setTheme, getDayKey };
}
