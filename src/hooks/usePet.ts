import { useCallback } from 'react';
import type { AppState, PetState } from '../types';
import { savePetState as savePetStateDB } from '../lib/db';
import {
  PET_FEED_HAPPINESS,
  PET_MAX_AUX_BONUS,
} from '../lib/constants';
import { getDayKey } from '../lib/utils';

/** Feed cooldown: at most once per hour */
const FEED_COOLDOWN_HOURS = 1;
/** Max happiness from petting per day */
const DAILY_PET_BONUS_MAX = 15;
/** Happiness gained per pet */
const PET_HAPPINESS_PER_INTERACT = 1;

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

/** Check if enough time has passed since the last feed */
function canFeed(lastFedAt: string): boolean {
  const lastTime = new Date(lastFedAt).getTime();
  const now = Date.now();
  const hoursSince = (now - lastTime) / (1000 * 60 * 60);
  return hoursSince >= FEED_COOLDOWN_HOURS;
}

/** Format remaining cooldown time in minutes */
function formatCooldown(lastFedAt: string): string {
  const lastTime = new Date(lastFedAt).getTime();
  const minutesLeft = 60 - Math.floor((Date.now() - lastTime) / (1000 * 60));
  if (minutesLeft <= 0) return '';
  if (minutesLeft === 60) return '1 小时';
  return `${minutesLeft} 分钟`;
}

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

      if (!canFeed(pet.lastFedAt)) {
        const remaining = formatCooldown(pet.lastFedAt);
        toast(`喂得太频繁啦～ ${remaining}后再来吧 🕐`, 'info');
        return prev;
      }

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
      toast(`喂食成功！+${PET_FEED_HAPPINESS} ❤️`, 'success');
      savePetStateDB(newPet).catch((e) => console.error('feedPet error:', e));
      return { ...prev, petState: newPet };
    });
  }, [setState, toast]);

  const interactWithPet = useCallback(async () => {
    setState((prev) => {
      const pet = prev.petState;
      if (!pet) return prev;

      const dailyPetCount = getDailyCount(INTERACT_COUNT_KEY);
      if (dailyPetCount >= DAILY_PET_BONUS_MAX) {
        toast('今天摸摸加成已达上限 (15%)，明天再继续宠爱TA吧～ ✨', 'info');
        return prev;
      }

      if (pet.happiness >= PET_MAX_AUX_BONUS) {
        toast('摸摸加成已达上限，快和 TA 一起记录心情来提升吧 💕', 'info');
        return prev;
      }

      const now = new Date().toISOString();
      const newHappiness = Math.min(PET_MAX_AUX_BONUS, pet.happiness + PET_HAPPINESS_PER_INTERACT);
      const newPet: PetState = {
        ...pet,
        happiness: newHappiness,
        lastInteractionAt: now,
      };
      incrementDailyCount(INTERACT_COUNT_KEY);
      const todayTotal = dailyPetCount + 1;
      toast(`摸摸成功！+${PET_HAPPINESS_PER_INTERACT} ❤️ (今日已获得 ${todayTotal}/${DAILY_PET_BONUS_MAX}%)`, 'success');
      savePetStateDB(newPet).catch((e) => console.error('interactWithPet error:', e));
      return { ...prev, petState: newPet };
    });
  }, [setState, toast]);

  return { updatePetState, feedPet, interactWithPet };
}
