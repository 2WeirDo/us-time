import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState, Post, Milestone, CoupleInfo, TodayMood } from '../types';
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
} from '../lib/db';
import { ensurePhotosBucket } from '../lib/storage';

const DEFAULT_STATE: AppState = {
  coupleInfo: null,
  posts: [],
  milestones: [],
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
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  // Load all data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, posts, milestones] = await Promise.all([
        fetchCoupleSettings(),
        fetchPosts(),
        fetchMilestones(),
      ]);
      // Try to ensure storage bucket exists (non-critical)
      ensurePhotosBucket().catch(() => {});

      setState((prev) => ({
        ...prev,
        // Keep previous coupleInfo if Supabase fetch returns nothing
        // (prevents race condition during first-time setup)
        coupleInfo: settings?.coupleInfo || prev.coupleInfo,
        posts,
        milestones,
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

  // Real-time subscription
  useEffect(() => {
    if (!unlocked) return;

    unsubscribeRef.current = subscribeToPosts(
      (newPost) => {
        setState((prev) => ({
          ...prev,
          posts: [newPost, ...prev.posts],
        }));
      },
      (updatedPost) => {
        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
        }));
      },
      (postId) => {
        setState((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== postId),
        }));
      }
    );

    return () => {
      unsubscribeRef.current?.();
    };
  }, [unlocked]);

  // ====== Auth ======

  const unlock = useCallback(
    (ident: 'me' | 'partner') => {
      setIdentityState(ident);
      localStorage.setItem(LOCAL_KEYS.identity, ident);
      setUnlocked(true);
    },
    []
  );

  const lock = useCallback(() => {
    setUnlocked(false);
    setIdentityState(null);
    localStorage.removeItem(LOCAL_KEYS.identity);
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
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, ...updates, mood: updates.mood ?? p.mood } : p
        ),
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
      const code = passcode || localStorage.getItem(LOCAL_KEYS.passcode) || '0000';
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
  }, []);

  return {
    state,
    loading,
    identity,
    unlocked,
    unlock,
    lock,
    addPost,
    editPost,
    deletePost,
    toggleReaction,
    setCoupleInfo,
    addMilestone,
    deleteMilestone,
    setTodayMood,
    setTheme,
    resetAll,
    exportData,
    importData,
  };
}
