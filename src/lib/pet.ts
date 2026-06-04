import type { PetState, TodayMood } from '../types';
import {
  PET_HAPPINESS_DECAY_PER_HOUR,
  PET_MAX_AUX_BONUS,
  MOOD_HAPPINESS_MAP,
} from './constants';
import { getDayKey } from './utils';

/**
 * Calculate the mood-based happiness contribution from today's moods.
 * Returns the average mood score and the number of participants who set a mood today.
 */
export function getMoodHappinessBase(todayMoods: TodayMood[]): {
  score: number;
  participantCount: number;
} {
  const today = getDayKey();
  const todaysEntries = todayMoods.filter((m) => m.date === today);

  if (todaysEntries.length === 0) {
    return { score: 0, participantCount: 0 };
  }

  const scores = todaysEntries.map(
    (m) => MOOD_HAPPINESS_MAP[m.mood] ?? 50
  );
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    score: Math.round(avgScore),
    participantCount: todaysEntries.length,
  };
}

/**
 * Calculate the effective (displayed) pet happiness.
 *
 * Formula:
 *   raw = moodScore × 0.7 + min(feedInteractBonus, MAX_AUX) − decay
 *   max = both have moods → 100  |  one → 80  |  neither → 60
 *   result = clamp(raw, 0, max)
 *
 * Moods are the primary driver (70% weight).
 * Feeding & petting are auxiliary, capped at PET_MAX_AUX_BONUS points.
 */
export function calculateEffectiveHappiness(
  pet: PetState,
  todayMoods: TodayMood[]
): number {
  const now = Date.now();
  const lastInteract = new Date(pet.lastInteractionAt).getTime();
  const hoursSince = Math.max(
    0,
    (now - lastInteract) / (1000 * 60 * 60)
  );
  const decay = Math.floor(hoursSince * PET_HAPPINESS_DECAY_PER_HOUR);

  const { score: moodBase, participantCount } =
    getMoodHappinessBase(todayMoods);

  // Feed/interact bonus is auxiliary, capped
  const auxBonus = Math.min(pet.happiness, PET_MAX_AUX_BONUS);

  // Moods: 70% weight, feed/interact: auxiliary 30%
  const rawHappiness = moodBase * 0.7 + auxBonus - decay;

  // Cap based on how many partners set mood today
  const maxHappiness =
    participantCount >= 2 ? 100 : participantCount === 1 ? 80 : 60;

  return Math.max(0, Math.min(maxHappiness, Math.round(rawHappiness)));
}

/**
 * Get mood-appropriate adoption starting happiness.
 * When adopting, the pet starts at a level matching current moods.
 */
export function getAdoptionHappiness(todayMoods: TodayMood[]): number {
  const { score, participantCount } = getMoodHappinessBase(todayMoods);
  // If moods are set, start at a reasonable level based on mood
  if (participantCount >= 2) return Math.min(80, score);
  if (participantCount === 1) return Math.min(60, score);
  // No moods — start low, cap at 40 (since overall cap is 60)
  return 30;
}
