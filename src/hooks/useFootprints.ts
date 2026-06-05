import { useCallback } from 'react';
import type { AppState, Footprint } from '../types';
import {
  createFootprint as createFootprintDB,
  deleteFootprint as deleteFootprintDB,
} from '../lib/db';

interface UseFootprintsDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function useFootprints({ setState, toast, loadData }: UseFootprintsDeps) {
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
