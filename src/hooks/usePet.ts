import { useCallback } from 'react';
import type { AppState, PetState } from '../types';
import { savePetState as savePetStateDB } from '../lib/db';
import {
  PET_FEED_HAPPINESS,
  PET_INTERACT_HAPPINESS,
  PET_MAX_AUX_BONUS,
} from '../lib/constants';
import { getDayKey } from '../lib/utils';

/** Daily limits to prevent spamming feed/pet */
const DAILY_FEED_LIMIT = 3;
const DAILY_INTERACT_LIMIT = 5;

interface UsePetDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

/** Count how many times an action was performed today from timestamps stored in localStorage */
function getDailyCount(key: string): number {
  try {
    const data = localStorage.getItem(key);
    if (!data) return 0;
    const timestamps: string[] = JSON.parse(data);
    const today = getDayKey();
    return timestamps.filter((ts) => ts.startsWith(today)).length;
  } catch {
    return 0;
  }
}

function incrementDailyCount(key: string): void {
  try {
    const data = localStorage.getItem(key);
    const timestamps: string[] = data ? JSON.parse(data) : [];
    timestamps.push(new Date().toISOString());
    localStorage.setItem(key, JSON.stringify(timestamps));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

const FEED_COUNT_KEY = 'us-time-pet-feed-log';
const INTERACT_COUNT_KEY = 'us-time-pet-interact-log';

export function usePet({ setState, toast }: UsePetDeps) {
  const updatePetState = useCallback(
    async (pet: PetState) => {
      setState((prev) => ({ ...prev, petState: pet }));
      await savePetStateDB(pet);
    },
    [setState]
  );

  const feedPet = useCallback(async () => {
    setState((prev) => {
      const pet = prev.petState;
      if (!pet) return prev;

      // Check daily feed limit
      if (getDailyCount(FEED_COUNT_KEY) >= DAILY_FEED_LIMIT) {
        toast('今天的喂食次数用完啦，明天再来吧～ 🍖', 'info');
        return prev;
      }

      // Check aux bonus cap
      if (pet.happiness >= PET_MAX_AUX_BONUS) {
        toast('喂食加成已达上限，快和 TA 一起记录心情来提升吧 💕', 'info');
        return prev;
      }

      const now = new Date().toISOString();
      const newPet: PetState = {
        ...pet,
        happiness: Math.min(PET_MAX_AUX_BONUS, pet.happiness + PET_FEED_HAPPINESS),
        lastFedAt: now,
        lastInteractionAt: now,
      };
      incrementDailyCount(FEED_COUNT_KEY);
      toast(`喂食成功！+${PET_FEED_HAPPINESS} ❤️`, 'success');
      savePetStateDB(newPet).catch((e) => console.error('feedPet error:', e));
      return { ...prev, petState: newPet };
    });
  }, [setState, toast]);

  const interactWithPet = useCallback(async () => {
    setState((prev) => {
      const pet = prev.petState;
      if (!pet) return prev;

      // Check daily interact limit
      if (getDailyCount(INTERACT_COUNT_KEY) >= DAILY_INTERACT_LIMIT) {
        toast('今天的摸摸次数用完啦，明天再来吧～ ✨', 'info');
        return prev;
      }

      // Check aux bonus cap
      if (pet.happiness >= PET_MAX_AUX_BONUS) {
        toast('摸摸加成已达上限，快和 TA 一起记录心情来提升吧 💕', 'info');
        return prev;
      }

      const now = new Date().toISOString();
      const newPet: PetState = {
        ...pet,
        happiness: Math.min(PET_MAX_AUX_BONUS, pet.happiness + PET_INTERACT_HAPPINESS),
        lastInteractionAt: now,
      };
      incrementDailyCount(INTERACT_COUNT_KEY);
      toast(`摸摸成功！+${PET_INTERACT_HAPPINESS} ❤️`, 'success');
      savePetStateDB(newPet).catch((e) => console.error('interactWithPet error:', e));
      return { ...prev, petState: newPet };
    });
  }, [setState, toast]);

  return { updatePetState, feedPet, interactWithPet };
}
