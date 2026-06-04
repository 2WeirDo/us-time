/**
 * useAppState — thin composer that wires together domain-specific hooks.
 *
 * Each domain (posts, letters, bucket list, footprints, pet, mood/theme, auth, data)
 * lives in its own file and manages its own state slice + subscriptions.
 * This file owns only: the unified AppState, loadData, settings, and milestones.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AppState, Milestone, CoupleInfo, TodayMood } from '../types';
import { useToast } from '../components/ui/Toast';
import {
  fetchPosts,
  fetchCoupleSettings,
  saveCoupleSettings,
  fetchMilestones,
  createMilestone as createMilestoneDB,
  deleteMilestoneFromDB,
  fetchLoveLetters,
  fetchBucketItems,
  fetchFootprints,
  fetchPetState,
  fetchTodayMoods,
} from '../lib/db';
import { ensurePhotosBucket } from '../lib/storage';
import { getDayKey } from '../lib/utils';
import { LOCAL_KEYS } from '../lib/constants';

import { useAuthModule } from './useAuth';
import { usePosts } from './usePosts';
import { useLetters } from './useLetters';
import { useBucketList } from './useBucketList';
import { useFootprints } from './useFootprints';
import { usePet } from './usePet';
import { useMoodTheme } from './useMoodTheme';
import { useComments } from './useComments';
import { useDataManagement } from './useDataManagement';

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
  const { toast } = useToast();

  // ---- Auth module ----
  const auth = useAuthModule();
  const { identity, unlocked } = auth;

  // ---- Shared loadData (fetches all tables) ----
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, posts, milestones, letters, bucketItems, footprints, pet, dbMoods] =
        await Promise.all([
          fetchCoupleSettings(),
          fetchPosts(),
          fetchMilestones(),
          fetchLoveLetters(),
          fetchBucketItems(),
          fetchFootprints(),
          fetchPetState(),
          fetchTodayMoods(),
        ]);
      ensurePhotosBucket().catch(() => {});

      if (settings?.passcode) {
        localStorage.setItem(LOCAL_KEYS.passcode, settings.passcode);
      }

      // Merge moods: Supabase is authoritative, fall back to localStorage cache
      const today = getDayKey();
      const localMoods = loadPersistedMoods();
      const mergedMoods = dbMoods.length > 0
        ? dbMoods.filter((m) => m.date === today)
        : localMoods;
      if (mergedMoods.length > 0) {
        localStorage.setItem(LOCAL_KEYS.moods, JSON.stringify(mergedMoods));
      }

      setState((prev) => ({
        ...prev,
        coupleInfo: settings?.coupleInfo || prev.coupleInfo,
        posts,
        milestones,
        loveLetters: letters,
        bucketListItems: bucketItems,
        footprints,
        petState: pet,
        setupComplete: !!settings || prev.setupComplete,
        theme:
          (localStorage.getItem(LOCAL_KEYS.theme) as AppState['theme']) || 'dark',
        todayMoods: mergedMoods,
      }));
    } catch (e) {
      console.error('loadData error:', e);
      toast('加载数据失败，请检查网络连接', 'error');
    }
    setLoading(false);
  }, [toast]);

  // Initial load trigger
  useEffect(() => {
    if (unlocked) {
      loadData();
    }
  }, [unlocked, loadData]);

  // ---- Domain hooks ----
  const posts = usePosts({ setState, identity, unlocked, toast, loadData });
  const letters = useLetters({ setState, unlocked, toast, loadData });
  const bucketList = useBucketList({ setState, identity, unlocked, toast, loadData });
  const footprints = useFootprints({ setState, unlocked, toast, loadData });
  const pet = usePet({ setState, toast });
  const moodTheme = useMoodTheme({ setState, unlocked });
  const commentModule = useComments({ unlocked, identity, toast });
  const dataMgmt = useDataManagement({ state, setState, toast, lock: auth.lock });

  // ---- Settings (couple info) ----
  const setCoupleInfo = useCallback(
    async (info: CoupleInfo, passcode?: string) => {
      let code = passcode || localStorage.getItem(LOCAL_KEYS.passcode) || null;
      if (!code) {
        const settings = await fetchCoupleSettings();
        code = settings?.passcode || null;
      }
      if (!code) code = '0000';
      localStorage.setItem(LOCAL_KEYS.passcode, code);

      const success = await saveCoupleSettings(info, code);
      if (success) {
        setState((prev) => ({ ...prev, coupleInfo: info, setupComplete: true }));
        toast('保存成功', 'success');
      } else {
        toast('保存失败，请重试', 'error');
      }
    },
    [toast]
  );

  // ---- Milestones ----
  const addMilestone = useCallback(
    async (milestone: Milestone) => {
      const result = await createMilestoneDB(milestone);
      if (result) {
        setState((prev) => ({ ...prev, milestones: [...prev.milestones, result] }));
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
        loadData();
      }
    },
    [loadData, toast]
  );

  // ---- Compose return value ----
  return {
    state,
    loading,
    identity,
    unlocked,
    // Auth
    unlock: auth.unlock,
    lock: auth.lock,
    getRememberedAuth: auth.getRememberedAuth,
    // Posts
    ...posts,
    // Settings & Milestones
    setCoupleInfo,
    addMilestone,
    deleteMilestone,
    // Mood & Theme
    ...moodTheme,
    // Letters
    ...letters,
    // Bucket List
    ...bucketList,
    // Footprints
    ...footprints,
    // Pet
    ...pet,
    // Comments
    ...commentModule,
    // Data management
    ...dataMgmt,
  };
}
