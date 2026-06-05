import { useCallback } from 'react';
import type { AppState } from '../types';
import { getDayKey } from '../lib/utils';
import { LOCAL_KEYS } from '../lib/constants';
import { saveTodayMood as saveTodayMoodDB } from '../lib/db';

interface UseMoodThemeDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function useMoodTheme({ setState }: UseMoodThemeDeps) {
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
