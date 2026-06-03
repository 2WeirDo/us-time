import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Utensils, Sparkles } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { PET_TYPES } from '../../types';
import type { PetType, PetState } from '../../types';

/**
 * Calculate happiness decay: -1 per hour since last interaction, capped.
 * This is purely visual/client-side; actual DB writes happen on interaction.
 */
function getDecayedHappiness(pet: PetState): number {
  const now = Date.now();
  const lastInteract = new Date(pet.lastInteractionAt).getTime();
  const hoursSince = Math.max(0, (now - lastInteract) / (1000 * 60 * 60));
  const decay = Math.floor(hoursSince * 1.5);
  return Math.max(0, pet.happiness - decay);
}

function getHappinessEmoji(happiness: number): string {
  if (happiness >= 80) return '😄';
  if (happiness >= 50) return '😊';
  if (happiness >= 20) return '😐';
  if (happiness > 0) return '😢';
  return '💀';
}

function getHappinessLabel(happiness: number): string {
  if (happiness >= 80) return '超开心';
  if (happiness >= 50) return '开心';
  if (happiness >= 20) return '一般';
  if (happiness > 0) return '不开心';
  return '需要关爱';
}

function getHappinessColor(happiness: number): string {
  if (happiness >= 80) return '#10B981';
  if (happiness >= 50) return '#F59E0B';
  if (happiness >= 20) return '#F97316';
  return '#EF4444';
}

export default function PetCard() {
  const { state, feedPet, interactWithPet, updatePetState } = useSharedAppState();
  const [showAdopt, setShowAdopt] = useState(false);
  const [adoptName, setAdoptName] = useState('小可爱');
  const [adoptType, setAdoptType] = useState<PetType>('cat');
  const [petting, setPetting] = useState(false);

  const pet = state.petState;
  const happiness = pet ? getDecayedHappiness(pet) : 0;
  const petTypeInfo = pet ? PET_TYPES.find((t) => t.key === pet.petType) : null;

  const handleFeed = async () => {
    await feedPet();
  };

  const handlePet = async () => {
    setPetting(true);
    await interactWithPet();
    setTimeout(() => setPetting(false), 600);
  };

  const handleAdopt = async () => {
    const newPet: PetState = {
      petType: adoptType,
      name: adoptName.trim() || '小可爱',
      happiness: 80,
      lastFedAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
    };
    await updatePetState(newPet);
    setShowAdopt(false);
  };

  // No pet yet — show adoption prompt
  if (!pet) {
    return (
      <>
        <motion.button
          onClick={() => setShowAdopt(true)}
          className="card col-span-1 flex flex-col items-center justify-center py-5 gap-2 cursor-pointer hover:border-pink/20 transition-colors group"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className="text-4xl"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            🥚
          </motion.span>
          <p className="text-xs font-medium text-text-primary">领养宠物</p>
          <p className="text-[10px] text-text-muted/50">一起照顾TA吧</p>
        </motion.button>

        {/* Adoption modal */}
        <AnimatePresence>
          {showAdopt && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAdopt(false)}
              />
              <motion.div
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-lift max-w-sm mx-auto p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <h3 className="font-display text-lg font-bold text-text-primary text-center mb-1">
                  领养一只宠物
                </h3>
                <p className="text-xs text-text-muted text-center mb-5">
                  选一个可爱的宠物，一起照顾它长大
                </p>

                {/* Pet type picker */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PET_TYPES.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      onClick={() => setAdoptType(key)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${
                        adoptType === key
                          ? 'bg-pink/10 ring-2 ring-pink/30'
                          : 'bg-warm-cream hover:bg-pink/5'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-[10px] text-text-muted">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={adoptName}
                  onChange={(e) => setAdoptName(e.target.value)}
                  placeholder="给TA取个名字..."
                  className="input-field text-sm text-center mb-4"
                  maxLength={10}
                />

                <button onClick={handleAdopt} className="btn-primary w-full text-sm">
                  领养 🎀
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Has pet — show interactive card
  return (
    <motion.div
      className="card col-span-1 overflow-hidden relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Pet display area */}
      <div className="flex flex-col items-center pb-3">
        {/* Pet emoji */}
        <motion.button
          onClick={handlePet}
          className="text-5xl cursor-pointer select-none my-2"
          animate={
            petting
              ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] }
              : { y: [0, -3, 0] }
          }
          transition={
            petting
              ? { duration: 0.6 }
              : { repeat: Infinity, duration: 2, ease: 'easeInOut' }
          }
          whileHover={{ scale: 1.15 }}
        >
          {petTypeInfo?.emoji || '🐱'}
        </motion.button>

        {/* Name + mood */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-semibold text-text-primary">
            {pet.name}
          </span>
          <span className="text-xs">{getHappinessEmoji(happiness)}</span>
        </div>

        {/* Happiness bar */}
        <div className="w-full px-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              <Heart size={10} className="text-pink" />
              <span className="text-[10px] text-text-muted/50">
                {getHappinessLabel(happiness)}
              </span>
            </div>
            <span className="text-[10px] font-medium" style={{ color: getHappinessColor(happiness) }}>
              {happiness}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-warm-cream overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, #FF69B4, ${getHappinessColor(happiness)})`,
                width: `${happiness}%`,
              }}
              layout
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFeed}
          className="flex-1 py-2 rounded-xl bg-pink/5 hover:bg-pink/10 text-pink text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <Utensils size={12} />
          喂食
        </button>
        <button
          onClick={handlePet}
          className="flex-1 py-2 rounded-xl bg-pink/5 hover:bg-pink/10 text-pink text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <Sparkles size={12} />
          摸摸
        </button>
      </div>
    </motion.div>
  );
}
