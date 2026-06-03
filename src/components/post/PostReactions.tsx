import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { REACTION_EMOJIS } from '../../types';
import { useSharedAppState } from '../../hooks/AppStateContext';

interface PostReactionsProps {
  postId: string;
  reactions: Record<string, string[]>;
}

export default function PostReactions({ postId, reactions }: PostReactionsProps) {
  const { toggleReaction, identity } = useSharedAppState();
  const [showPicker, setShowPicker] = useState(false);

  // Flatten reactions for display
  const activeEntries = Object.entries(reactions).filter(
    ([, authors]) => authors.length > 0
  );

  const handleToggle = (emoji: string) => {
    toggleReaction(postId, emoji);
    setShowPicker(false);
  };

  return (
    <div className="mt-2">
      {/* Active reactions */}
      {activeEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {activeEntries.map(([emoji, authors]) => (
            <button
              key={emoji}
              onClick={() => handleToggle(emoji)}
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all ${
                identity && authors.includes(identity)
                  ? 'bg-pink/15 ring-1 ring-pink/30'
                  : 'bg-warm-cream hover:bg-pink/10'
              }`}
            >
              <span className="text-sm">{emoji}</span>
              {authors.length > 1 && (
                <span className="text-[10px] text-text-muted">{authors.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button + picker */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 text-xs text-text-muted/40 hover:text-pink/60 transition-colors"
        >
          <SmilePlus size={13} />
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-1 bg-white rounded-2xl shadow-lift border border-pink/10 p-1.5 z-20 flex gap-0.5"
            >
              {REACTION_EMOJIS.map((emoji) => {
                const isActive =
                  identity && reactions[emoji]?.includes(identity);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleToggle(emoji)}
                    className={`text-lg p-1.5 rounded-xl transition-all hover:scale-125 ${
                      isActive ? 'bg-pink/15 scale-110' : 'hover:bg-warm-cream'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
