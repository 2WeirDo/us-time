import { useCallback, useEffect } from 'react';
import type { AppState, Footprint } from '../types';
import {
  createFootprint as createFootprintDB,
  deleteFootprint as deleteFootprintDB,
  subscribeToFootprints,
} from '../lib/db';

interface UseFootprintsDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  unlocked: boolean;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function useFootprints({ setState, unlocked, toast, loadData }: UseFootprintsDeps) {
  // ---- Real-time subscription ----
  useEffect(() => {
    if (!unlocked) return;
    const cleanup = subscribeToFootprints(
      (newFp) =>
        setState((prev) => {
          if (prev.footprints.some((f) => f.id === newFp.id)) return prev;
          return { ...prev, footprints: [newFp, ...prev.footprints] };
        }),
      (fpId) =>
        setState((prev) => ({
          ...prev,
          footprints: prev.footprints.filter((f) => f.id !== fpId),
        }))
    );
    return cleanup;
  }, [unlocked, setState]);

  // ---- Actions ----

  const addFootprint = useCallback(
    async (fp: Omit<Footprint, 'id' | 'createdAt'>) => {
      const result = await createFootprintDB(fp);
      if (result) {
        setState((prev) => ({ ...prev, footprints: [result, ...prev.footprints] }));
        toast('足迹已记录 📍', 'success');
      } else {
        toast('添加失败，请重试', 'error');
      }
    },
    [setState, toast]
  );

  const deleteFootprint = useCallback(
    async (fpId: string) => {
      setState((prev) => ({
        ...prev,
        footprints: prev.footprints.filter((f) => f.id !== fpId),
      }));
      const success = await deleteFootprintDB(fpId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        loadData();
      }
    },
    [setState, toast, loadData]
  );

  return { addFootprint, deleteFootprint };
}
