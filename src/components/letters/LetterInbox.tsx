import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Inbox } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import LetterCard from './LetterCard';
import LetterComposerDrawer from './LetterComposerDrawer';
import LetterDrawer from './LetterDrawer';
import type { LoveLetter } from '../../types';

export default function LetterInbox() {
  const { state, deleteLetter } = useSharedAppState();
  const [composeOpen, setComposeOpen] = useState(false);
  const [readingLetter, setReadingLetter] = useState<LoveLetter | null>(null);

  const letters = state.loveLetters;
  const unreadCount = letters.filter((l) => !l.read).length;

  if (letters.length === 0) {
    return (
      <>
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mb-4">
            <Inbox size={32} className="text-text-muted/30" />
          </div>
          <h3 className="font-semibold text-text-primary mb-1">
            还没有手写信
          </h3>
          <p className="text-text-muted text-sm mb-6">
            画一封手写信，让TA感受到你的心意 💌
          </p>
          <button
            onClick={() => setComposeOpen(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            写一封信
          </button>
        </motion.div>

        <LetterComposerDrawer
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
        />
      </>
    );
  }

  return (
    <div>
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <motion.div
          className="flex items-center gap-2 mb-4 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="w-2 h-2 rounded-full bg-pink" />
          <span className="text-sm font-medium text-pink">
            {unreadCount} 封未读
          </span>
        </motion.div>
      )}

      {/* Letters list */}
      <div className="space-y-2.5 mb-4">
        {letters.map((letter, i) => (
          <LetterCard
            key={letter.id}
            letter={letter}
            onClick={() => setReadingLetter(letter)}
            onDelete={deleteLetter}
            index={i}
          />
        ))}
      </div>

      {/* Write button */}
      <button
        onClick={() => setComposeOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pink/15 text-pink/50 hover:text-pink hover:border-pink/30 transition-all text-sm font-medium flex items-center justify-center gap-2 mb-8"
      >
        <Plus size={16} />
        写一封信
      </button>

      {/* Compose drawer */}
      <LetterComposerDrawer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
      />

      {/* Read letter drawer */}
      <LetterDrawer
        letter={readingLetter}
        onClose={() => setReadingLetter(null)}
      />
    </div>
  );
}
