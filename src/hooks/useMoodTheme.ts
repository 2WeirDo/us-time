import { useCallback } from 'react';
import type { AppState } from '../types';
import { getDayKey } from '../lib/utils';
import { LOCAL_KEYS } from '../lib/constants';

interface UseMoodThemeDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function useMoodTheme({ setState }: UseMoodThemeDeps) {
  const setTodayMood = useCallback(
    (mood: { date: string; author: 'me' | 'partner'; mood: string }) => {
      setState((prev) => {
        const filtered = prev.todayMoods.filter(
          (m) => !(m.date === mood.date && m.author === mood.author)
        );
        const newMoods = [...filtered, mood];
        localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(newMoods));
        return { ...prev, todayMoods: newMoods };
      });
    },
    [setState]
  );

  const setTheme = useCallback((theme: AppState['theme']) => {
    localStorage.setItem(LOCAL_KEYS.theme, theme);
    setState((prev) => ({ ...prev, theme }));
  }, [setState]);

  return { setTodayMood, setTheme, getDayKey };
}
