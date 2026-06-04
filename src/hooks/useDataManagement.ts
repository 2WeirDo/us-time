import { useCallback } from 'react';
import type { AppState } from '../types';
import { clearAllSupabaseData } from '../lib/db';
import { LOCAL_KEYS } from '../lib/constants';

const DEFAULT_STATE: AppState = {
  coupleInfo: null,
  posts: [],
  milestones: [],
  loveLetters: [],
  bucketListItems: [],
  footprints: [],
  petState: null,
  theme: 'dark',
  setupComplete: false,
  todayMoods: [],
};

interface UseDataManagementDeps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toast: (msg: string, type?: 'success' | 'error') => void;
  lock: () => void;
}

export function useDataManagement({ state, setState, toast, lock }: UseDataManagementDeps) {
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `us-time-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback(
    async (jsonString: string): Promise<boolean> => {
      try {
        const data = JSON.parse(jsonString);
        setState((prev) => ({
          ...prev,
          posts: data.posts || [],
          milestones: data.milestones || [],
          loveLetters: data.loveLetters || [],
          bucketListItems: data.bucketListItems || [],
          footprints: data.footprints || [],
          petState: data.petState || null,
          coupleInfo: data.coupleInfo || prev.coupleInfo,
          todayMoods: data.todayMoods || [],
        }));
        return true;
      } catch {
        return false;
      }
    },
    [setState]
  );

  const resetAll = useCallback(async () => {
    const failedCount = await clearAllSupabaseData();
    if (failedCount > 0) {
      console.warn(`resetAll: ${failedCount} table(s) failed to clear on Supabase`);
    }
    setState(DEFAULT_STATE);
    lock();
    localStorage.removeItem(LOCAL_KEYS.moods);
    toast('所有数据已清除', 'success');
  }, [setState, toast, lock]);

  return { exportData, importData, resetAll };
}
