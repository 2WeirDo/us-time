import { motion } from 'framer-motion';
import { Smile } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { MOOD_OPTIONS } from '../../types';
import { useState } from 'react';

/** Day key that shifts at 6am — must match useAppState */
function getDayKey(): string {
  const now = new Date();
  if (now.getHours() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

export default function MoodBubble() {
  const { state, identity, setTodayMood } = useSharedAppState();
  const [showPicker, setShowPicker] = useState(false);
  const today = getDayKey();

  const myMood = state.todayMoods.find(
    (m) => m.date === today && m.author === 'me'
  );
  const partnerMood = state.todayMoods.find(
    (m) => m.date === today && m.author === 'partner'
  );

  const isMe = identity === 'me';
  const isPartner = identity === 'partner';

  const handleMoodPick = (emoji: string) => {
    if (identity) {
      setTodayMood({ date: today, author: identity, mood: emoji });
    }
    setShowPicker(false);
  };

  return (
    <motion.div
      className="card flex flex-col justify-between min-h-[120px] relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 text-text-muted">
        <Smile size={16} />
        <span className="text-xs font-medium">今日心情</span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-4">
        {/* My mood */}
        {isMe ? (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-warm-cream transition-colors"
          >
            <motion.span
              className="text-2xl"
              whileTap={{ scale: 1.3 }}
              key={myMood?.mood || 'empty-me'}
            >
              {myMood?.mood || '❓'}
            </motion.span>
            <span className="text-[10px] text-text-muted">
              {state.coupleInfo?.myName || '我'}
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-1 p-2">
            <span className="text-2xl">{myMood?.mood || '❓'}</span>
            <span className="text-[10px] text-text-muted">
              {state.coupleInfo?.myName || '我'}
            </span>
          </div>
        )}

        <div className="w-px h-8 bg-text-muted/10" />

        {/* Partner mood */}
        {isPartner ? (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-warm-cream transition-colors"
          >
            <motion.span
              className="text-2xl"
              whileTap={{ scale: 1.3 }}
              key={partnerMood?.mood || 'empty-partner'}
            >
              {partnerMood?.mood || '❓'}
            </motion.span>
            <span className="text-[10px] text-text-muted">
              {state.coupleInfo?.partnerName || 'TA'}
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-1 p-2">
            <span className="text-2xl">{partnerMood?.mood || '❓'}</span>
            <span className="text-[10px] text-text-muted">
              {state.coupleInfo?.partnerName || 'TA'}
            </span>
          </div>
        )}
      </div>

      {/* Mood picker popup */}
      {showPicker && (
        <motion.div
          className="absolute bottom-full left-0 right-0 mb-2 card shadow-lift z-30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-4 gap-1">
            {MOOD_OPTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleMoodPick(emoji)}
                className="p-2 text-xl hover:bg-warm-cream rounded-xl transition-colors"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
