import { useCallback } from 'react';
import type { AppState, PetState } from '../types';
import { savePetState as savePetStateDB } from '../lib/db';
import { PET_FEED_HAPPINESS, PET_INTERACT_HAPPINESS, PET_MAX_HAPPINESS } from '../lib/constants';

interface UsePetDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function usePet({ setState }: UsePetDeps) {
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
      const now = new Date().toISOString();
      const newPet: PetState = {
        ...pet,
        happiness: Math.min(PET_MAX_HAPPINESS, pet.happiness + PET_FEED_HAPPINESS),
        lastFedAt: now,
        lastInteractionAt: now,
      };
      savePetStateDB(newPet).catch((e) => console.error('feedPet error:', e));
      return { ...prev, petState: newPet };
    });
  }, [setState]);

  const interactWithPet = useCallback(async () => {
    setState((prev) => {
      const pet = prev.petState;
      if (!pet) return prev;
      const now = new Date().toISOString();
      const newPet: PetState = {
        ...pet,
        happiness: Math.min(PET_MAX_HAPPINESS, pet.happiness + PET_INTERACT_HAPPINESS),
        lastInteractionAt: now,
      };
      savePetStateDB(newPet).catch((e) => console.error('interactWithPet error:', e));
      return { ...prev, petState: newPet };
    });
  }, [setState]);

  return { updatePetState, feedPet, interactWithPet };
}
