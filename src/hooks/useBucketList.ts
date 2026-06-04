import { useCallback, useEffect } from 'react';
import type { AppState, BucketListItem } from '../types';
import {
  createBucketItem as createBucketItemDB,
  updateBucketItem as updateBucketItemDB,
  deleteBucketItem as deleteBucketItemDB,
  subscribeToBucketItems,
} from '../lib/db';

interface UseBucketListDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  identity: 'me' | 'partner' | null;
  unlocked: boolean;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function useBucketList({ setState, identity, unlocked, toast, loadData }: UseBucketListDeps) {
  // ---- Real-time subscription ----
  useEffect(() => {
    if (!unlocked) return;
    const cleanup = subscribeToBucketItems(
      (newItem) =>
        setState((prev) => {
          if (prev.bucketListItems.some((b) => b.id === newItem.id)) return prev;
          return { ...prev, bucketListItems: [newItem, ...prev.bucketListItems] };
        }),
      (updatedItem) =>
        setState((prev) => ({
          ...prev,
          bucketListItems: prev.bucketListItems.map((b) =>
            b.id === updatedItem.id ? updatedItem : b
          ),
        })),
      (itemId) =>
        setState((prev) => ({
          ...prev,
          bucketListItems: prev.bucketListItems.filter((b) => b.id !== itemId),
        }))
    );
    return cleanup;
  }, [unlocked, setState]);

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

      setState((prev) => {
        const item = prev.bucketListItems.find((b) => b.id === itemId);
        if (!item) return prev;

        const now = new Date().toISOString();
        const updates = item.completed
          ? { completed: false, completedBy: null, completedAt: null }
          : { completed: true, completedBy: ident as 'me' | 'partner', completedAt: now };

        updateBucketItemDB(itemId, {
          completed: updates.completed,
          completedBy: updates.completedBy,
          completedAt: updates.completedAt,
        }).catch((e) => console.error('toggleBucketCompletion error:', e));

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
    },
    [identity, setState]
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
