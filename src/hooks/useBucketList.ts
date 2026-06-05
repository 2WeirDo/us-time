import { useCallback } from 'react';
import type { AppState, BucketListItem } from '../types';
import {
  createBucketItem as createBucketItemDB,
  updateBucketItem as updateBucketItemDB,
  deleteBucketItem as deleteBucketItemDB,
} from '../lib/db';

interface UseBucketListDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  identity: 'me' | 'partner' | null;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function useBucketList({ setState, identity, toast, loadData }: UseBucketListDeps) {
  // ---- Actions ----

  const addBucketItem = useCallback(
    async (item: Omit<BucketListItem, 'id' | 'createdAt' | 'completed' | 'completedBy' | 'completedAt'>) => {
      const result = await createBucketItemDB({ ...item, completed: false });
      if (result) {
        setState((prev) => ({ ...prev, bucketListItems: [result, ...prev.bucketListItems] }));
        toast('心愿已添加 ✨', 'success');
      } else {
        toast('添加失败，请重试', 'error');
      }
    },
    [setState, toast]
  );

  const toggleBucketCompletion = useCallback(
    async (itemId: string) => {
      const ident = identity;
      if (!ident) return;

      // Snapshot the current item for rollback
      let previousItem: BucketListItem | undefined;
      setState((prev) => {
        const item = prev.bucketListItems.find((b) => b.id === itemId);
        if (!item) return prev;
        previousItem = { ...item };

        const now = new Date().toISOString();
        const updates = item.completed
          ? { completed: false, completedBy: null, completedAt: null }
          : { completed: true, completedBy: ident as 'me' | 'partner', completedAt: now };

        return {
          ...prev,
          bucketListItems: prev.bucketListItems.map((b) =>
            b.id === itemId
              ? {
                  ...b,
                  completed: updates.completed,
                  completedBy: updates.completedBy as 'me' | 'partner' | undefined,
                  completedAt: updates.completedAt ?? undefined,
                }
              : b
          ),
        };
      });

      // Persist to DB and rollback on failure
      if (previousItem) {
        const newCompleted = !previousItem.completed;
        const success = await updateBucketItemDB(itemId, {
          completed: newCompleted,
          completedBy: newCompleted ? (ident as 'me' | 'partner') : null,
          completedAt: newCompleted ? new Date().toISOString() : null,
        });
        if (!success) {
          toast('操作失败，请重试', 'error');
          loadData();
        }
      }
    },
    [identity, setState, toast, loadData]
  );

  const deleteBucketItem = useCallback(
    async (itemId: string) => {
      setState((prev) => ({
        ...prev,
        bucketListItems: prev.bucketListItems.filter((b) => b.id !== itemId),
      }));
      const success = await deleteBucketItemDB(itemId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        loadData();
      }
    },
    [setState, toast, loadData]
  );

  return { addBucketItem, toggleBucketCompletion, deleteBucketItem };
}
