import { useState, useEffect, useCallback } from 'react';
import type { AppState, Post, Milestone, CoupleInfo, TodayMood, LoveLetter, BucketListItem, Footprint, PetState } from '../types';
import { useToast } from '../components/ui/Toast';
import {
  fetchPosts,
  createPost as createPostDB,
  updatePostInDB,
  deletePostFromDB,
  fetchCoupleSettings,
  saveCoupleSettings,
  fetchMilestones,
  createMilestone as createMilestoneDB,
  deleteMilestoneFromDB,
  updatePostReactions,
  subscribeToPosts,
  fetchLoveLetters,
  createLoveLetter as createLoveLetterDB,
  markLetterAsRead,
  deleteLoveLetter as deleteLoveLetterDB,
  subscribeToLetters,
  fetchBucketItems,
  createBucketItem as createBucketItemDB,
  updateBucketItem as updateBucketItemDB,
  deleteBucketItem as deleteBucketItemDB,
  subscribeToBucketItems,
  fetchFootprints,
  createFootprint as createFootprintDB,
  deleteFootprint as deleteFootprintDB,
  subscribeToFootprints,
  fetchPetState,
  savePetState as savePetStateDB,
} from '../lib/db';
import { ensurePhotosBucket } from '../lib/storage';

const DEFAULT_STATE: AppState = {
  coupleInfo: null,
  posts: [],
  milestones: [],
  loveLetters: [],
  bucketListItems: [],
  footprints: [],
  petState: null,
  theme: 'light',
  setupComplete: false,
  todayMoods: [],
};

// Local-only state keys (per device)
const LOCAL_KEYS = {
  identity: 'us-time-identity', // 'me' | 'partner' | null
  passcode: 'us-time-passcode',
  theme: 'us-time-theme',
  moods: 'us-time-moods',
  remembered: 'us-time-remembered', // stored passcode for auto-login
};

/** Day key that shifts at 6am instead of midnight */
function getDayKey(): string {
  const now = new Date();
  if (now.getHours() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

/** Load persisted moods, discarding any from past days */
function loadPersistedMoods(): TodayMood[] {
  try {
    const stored = localStorage.getItem(LOCAL_KEYS.moods);
    if (!stored) return [];
    const moods: TodayMood[] = JSON.parse(stored);
    const today = getDayKey();
    const valid = moods.filter((m) => m.date === today);
    if (valid.length !== moods.length) {
      localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => ({
    ...DEFAULT_STATE,
    todayMoods: loadPersistedMoods(),
  }));
  const [loading, setLoading] = useState(true);
  const [identity, setIdentityState] = useState<'me' | 'partner' | null>(
    () => localStorage.getItem(LOCAL_KEYS.identity) as 'me' | 'partner' | null
  );
  const [unlocked, setUnlocked] = useState(false);
  const { toast } = useToast();

  // Load all data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, posts, milestones, letters, bucketItems, footprints, pet] = await Promise.all([
        fetchCoupleSettings(),
        fetchPosts(),
        fetchMilestones(),
        fetchLoveLetters(),
        fetchBucketItems(),
        fetchFootprints(),
        fetchPetState(),
      ]);
      // Try to ensure storage bucket exists (non-critical)
      ensurePhotosBucket().catch(() => {});

      // Persist passcode from server so setCoupleInfo can use it later
      if (settings?.passcode) {
        localStorage.setItem(LOCAL_KEYS.passcode, settings.passcode);
      }

      setState((prev) => ({
        ...prev,
        // Keep previous coupleInfo if Supabase fetch returns nothing
        // (prevents race condition during first-time setup)
        coupleInfo: settings?.coupleInfo || prev.coupleInfo,
        posts,
        milestones,
        loveLetters: letters,
        bucketListItems: bucketItems,
        footprints,
        petState: pet,
        setupComplete: !!settings || prev.setupComplete,
        theme:
          (localStorage.getItem(LOCAL_KEYS.theme) as AppState['theme']) || 'light',
      }));
    } catch (e) {
      console.error('loadData error:', e);
      toast('加载数据失败，请检查网络连接', 'error');
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    if (unlocked) {
      loadData();
    }
  }, [unlocked, loadData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!unlocked) return;

    const cleanups: (() => void)[] = [];

    // Posts subscription
    cleanups.push(subscribeToPosts(
      (newPost) => setState((prev) => ({ ...prev, posts: [newPost, ...prev.posts] })),
      (updatedPost) => setState((prev) => ({ ...prev, posts: prev.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)) })),
      (postId) => setState((prev) => ({ ...prev, posts: prev.posts.filter((p) => p.id !== postId) })),
    ));

    // Letters subscription
    cleanups.push(subscribeToLetters(
      (newLetter) => setState((prev) => ({ ...prev, loveLetters: [newLetter, ...prev.loveLetters] })),
      (updatedLetter) => setState((prev) => ({ ...prev, loveLetters: prev.loveLetters.map((l) => (l.id === updatedLetter.id ? updatedLetter : l)) })),
      (letterId) => setState((prev) => ({ ...prev, loveLetters: prev.loveLetters.filter((l) => l.id !== letterId) })),
    ));

    // Bucket list subscription
    cleanups.push(subscribeToBucketItems(
      (newItem) => setState((prev) => ({ ...prev, bucketListItems: [newItem, ...prev.bucketListItems] })),
      (updatedItem) => setState((prev) => ({ ...prev, bucketListItems: prev.bucketListItems.map((b) => (b.id === updatedItem.id ? updatedItem : b)) })),
      (itemId) => setState((prev) => ({ ...prev, bucketListItems: prev.bucketListItems.filter((b) => b.id !== itemId) })),
    ));

    // Footprints subscription
    cleanups.push(subscribeToFootprints(
      (newFp) => setState((prev) => ({ ...prev, footprints: [newFp, ...prev.footprints] })),
      (fpId) => setState((prev) => ({ ...prev, footprints: prev.footprints.filter((f) => f.id !== fpId) })),
    ));

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [unlocked]);

  // ====== Auth ======

  const unlock = useCallback(
    (ident: 'me' | 'partner', passcode?: string) => {
      setIdentityState(ident);
      localStorage.setItem(LOCAL_KEYS.identity, ident);
      // Remember passcode for auto-login next time
      if (passcode) {
        localStorage.setItem(LOCAL_KEYS.remembered, JSON.stringify({ ident, passcode }));
      }
      setUnlocked(true);
    },
    []
  );

  const lock = useCallback(() => {
    setUnlocked(false);
    setIdentityState(null);
    localStorage.removeItem(LOCAL_KEYS.identity);
    localStorage.removeItem(LOCAL_KEYS.remembered);
  }, []);

  /** Get stored credentials for auto-login, or null if not remembered */
  const getRememberedAuth = useCallback((): { ident: 'me' | 'partner'; passcode: string } | null => {
    try {
      const stored = localStorage.getItem(LOCAL_KEYS.remembered);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  // ====== Posts ======

  const addPost = useCallback(
    async (post: Omit<Post, 'id' | 'createdAt'>) => {
      const result = await createPostDB(post);
      if (result) {
        loadData();
      } else {
        toast('发布失败，请重试', 'error');
      }
    },
    [loadData, toast]
  );

  const editPost = useCallback(
    async (postId: string, updates: { content?: string; photos?: string[]; audio?: string | null; mood?: string | null }) => {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const { audio: updAudio, mood: updMood, ...rest } = updates;
          return {
            ...p,
            ...rest,
            mood: updMood ?? p.mood,
            audio: updAudio !== undefined ? (updAudio ?? undefined) : p.audio,
          };
        }),
      }));
      const result = await updatePostInDB(postId, updates);
      if (!result) {
        toast('保存失败，请重试', 'error');
        loadData(); // Revert optimistic update on failure
      }
    },
    [loadData, toast]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      setState((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
      }));
      const success = await deletePostFromDB(postId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        loadData(); // Revert on failure
      }
    },
    [loadData, toast]
  );

  // ====== Reactions ======

  const toggleReaction = useCallback(
    async (postId: string, emoji: string) => {
      const ident = identity;
      if (!ident) return;

      setState((prev) => {
        const posts = prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const reactions = { ...p.reactions };
          const current = reactions[emoji] || [];
          if (current.includes(ident)) {
            // Remove reaction
            reactions[emoji] = current.filter((a) => a !== ident);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            // Add reaction
            reactions[emoji] = [...current, ident];
          }
          return { ...p, reactions };
        });
        return { ...prev, posts };
      });

      // Persist to DB (fire-and-forget)
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        const newReactions = { ...post.reactions };
        const current = newReactions[emoji] || [];
        if (current.includes(ident)) {
          newReactions[emoji] = current.filter((a) => a !== ident);
          if (newReactions[emoji].length === 0) delete newReactions[emoji];
        } else {
          newReactions[emoji] = [...current, ident];
        }
        updatePostReactions(postId, newReactions);
      }
    },
    [identity, state.posts]
  );

  // ====== Settings ======

  const setCoupleInfo = useCallback(
    async (info: CoupleInfo, passcode?: string) => {
      // Figure out the passcode: explicit arg → localStorage → fetch from server
      let code = passcode || localStorage.getItem(LOCAL_KEYS.passcode) || null;
      if (!code) {
        // Last resort: fetch current passcode from Supabase to avoid overwriting it
        const settings = await fetchCoupleSettings();
        code = settings?.passcode || null;
      }
      // If still no passcode, use default only for first-time setup (shouldn't happen)
      if (!code) {
        code = '0000';
      }

      localStorage.setItem(LOCAL_KEYS.passcode, code);

      const success = await saveCoupleSettings(info, code);
      if (success) {
        setState((prev) => ({
          ...prev,
          coupleInfo: info,
          setupComplete: true,
        }));
        toast('保存成功', 'success');
      } else {
        toast('保存失败，请重试', 'error');
      }
    },
    [toast]
  );

  // ====== Milestones ======

  const addMilestone = useCallback(
    async (milestone: Milestone) => {
      const result = await createMilestoneDB(milestone);
      if (result) {
        setState((prev) => ({
          ...prev,
          milestones: [...prev.milestones, result],
        }));
        toast('纪念日已添加', 'success');
      } else {
        toast('添加失败，请重试', 'error');
      }
    },
    [toast]
  );

  const deleteMilestone = useCallback(
    async (milestoneId: string) => {
      setState((prev) => ({
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== milestoneId),
      }));
      const success = await deleteMilestoneFromDB(milestoneId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        loadData(); // Revert on failure
      }
    },
    [loadData, toast]
  );

  // ====== Mood ======

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
    []
  );

  // ====== Theme ======

  const setTheme = useCallback((theme: AppState['theme']) => {
    localStorage.setItem(LOCAL_KEYS.theme, theme);
    setState((prev) => ({ ...prev, theme }));
  }, []);

  // ====== Love Letters ======

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
    [toast]
  );

  const markLetterRead = useCallback(
    async (letterId: string) => {
      setState((prev) => ({
        ...prev,
        loveLetters: prev.loveLetters.map((l) => (l.id === letterId ? { ...l, read: true } : l)),
      }));
      await markLetterAsRead(letterId);
    },
    []
  );

  const deleteLetter = useCallback(
    async (letterId: string) => {
      setState((prev) => ({ ...prev, loveLetters: prev.loveLetters.filter((l) => l.id !== letterId) }));
      await deleteLoveLetterDB(letterId);
    },
    []
  );

  // ====== Bucket List ======

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
    [toast]
  );

  const toggleBucketCompletion = useCallback(
    async (itemId: string) => {
      const item = state.bucketListItems.find((b) => b.id === itemId);
      if (!item) return;
      const ident = identity;
      if (!ident) return;

      const now = new Date().toISOString();
      const updates = item.completed
        ? { completed: false, completedBy: null, completedAt: null }
        : { completed: true, completedBy: ident, completedAt: now };

      setState((prev) => ({
        ...prev,
        bucketListItems: prev.bucketListItems.map((b) =>
          b.id === itemId ? { ...b, ...updates, completedBy: updates.completedBy as 'me' | 'partner' | undefined, completedAt: updates.completedAt as string | undefined } : b
        ),
      }));
      await updateBucketItemDB(itemId, updates);
    },
    [state.bucketListItems, identity]
  );

  const deleteBucketItem = useCallback(
    async (itemId: string) => {
      setState((prev) => ({ ...prev, bucketListItems: prev.bucketListItems.filter((b) => b.id !== itemId) }));
      await deleteBucketItemDB(itemId);
    },
    []
  );

  // ====== Footprints ======

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
    [toast]
  );

  const deleteFootprint = useCallback(
    async (fpId: string) => {
      setState((prev) => ({ ...prev, footprints: prev.footprints.filter((f) => f.id !== fpId) }));
      await deleteFootprintDB(fpId);
    },
    []
  );

  // ====== Pet ======

  const updatePetState = useCallback(
    async (pet: PetState) => {
      setState((prev) => ({ ...prev, petState: pet }));
      await savePetStateDB(pet);
    },
    []
  );

  const feedPet = useCallback(async () => {
    const pet = state.petState;
    if (!pet) return;
    const now = new Date().toISOString();
    const newPet: PetState = {
      ...pet,
      happiness: Math.min(100, pet.happiness + 15),
      lastFedAt: now,
      lastInteractionAt: now,
    };
    await updatePetState(newPet);
  }, [state.petState, updatePetState]);

  const interactWithPet = useCallback(async () => {
    const pet = state.petState;
    if (!pet) return;
    const now = new Date().toISOString();
    const newPet: PetState = {
      ...pet,
      happiness: Math.min(100, pet.happiness + 5),
      lastInteractionAt: now,
    };
    await updatePetState(newPet);
  }, [state.petState, updatePetState]);

  // ====== Data management ======

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
        }));
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
    setUnlocked(false);
    setIdentityState(null);
    localStorage.removeItem(LOCAL_KEYS.identity);
    localStorage.removeItem(LOCAL_KEYS.passcode);
    localStorage.removeItem(LOCAL_KEYS.remembered);
  }, []);

  return {
    state,
    loading,
    identity,
    unlocked,
    unlock,
    lock,
    getRememberedAuth,
    addPost,
    editPost,
    deletePost,
    toggleReaction,
    setCoupleInfo,
    addMilestone,
    deleteMilestone,
    setTodayMood,
    setTheme,
    // Love Letters
    addLetter,
    markLetterRead,
    deleteLetter,
    // Bucket List
    addBucketItem,
    toggleBucketCompletion,
    deleteBucketItem,
    // Footprints
    addFootprint,
    deleteFootprint,
    // Pet
    updatePetState,
    feedPet,
    interactWithPet,
    // Data
    resetAll,
    exportData,
    importData,
  };
}
