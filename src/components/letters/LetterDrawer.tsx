import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MailOpen, ImageOff } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import type { LoveLetter } from '../../types';

interface LetterDrawerProps {
  letter: LoveLetter | null;
  onClose: () => void;
}

export default function LetterDrawer({ letter, onClose }: LetterDrawerProps) {
  const { markLetterRead } = useSharedAppState();
  const [imageError, setImageError] = useState(false);

  // Mark as read when opened
  useEffect(() => {
    if (letter && !letter.read) {
      markLetterRead(letter.id);
      setImageError(false); // reset error state when a new letter opens
    }
  }, [letter, letter?.id, letter?.read, markLetterRead]);

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {letter && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1001]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Centered modal */}
          <motion.div
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg bg-white dark:bg-[#3D2B3E] rounded-[28px] shadow-lift overflow-hidden pointer-events-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <MailOpen size={16} className="text-pink" />
                <span className="text-xs text-pink/80 font-medium">
                  {letter.author === 'me' ? '我' : 'TA'}写的
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-warm-cream dark:bg-white/[0.06] flex items-center justify-center"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 max-h-[70vh] overflow-y-auto">
              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-text-muted/40 mb-4">
                <Clock size={11} />
                <span>
                  {new Date(letter.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Title */}
              {letter.title && (
                <h3 className="font-display text-lg font-bold text-text-primary mb-4">
                  {letter.title}
                </h3>
              )}

              {/* Handwritten image */}
              {letter.imageUrl && !imageError && (
                <motion.div
                  className="rounded-2xl overflow-hidden mb-4 border border-pink/10 dark:border-white/[0.06] bg-white dark:bg-[#3D2B3E]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <img
                    src={letter.imageUrl}
                    alt="手写信"
                    className="w-full h-auto"
                    onError={() => setImageError(true)}
                  />
                </motion.div>
              )}
              {letter.imageUrl && imageError && (
                <div className="rounded-2xl mb-4 border border-pink/10 dark:border-white/[0.06] bg-warm-cream dark:bg-white/[0.04] flex items-center justify-center gap-2 py-12 text-text-muted/40 text-sm">
                  <ImageOff size={18} />
                  <span>手写信图片加载失败</span>
                </div>
              )}

              {/* Message */}
              {letter.message && (
                <motion.p
                  className="text-sm text-text-primary leading-relaxed italic"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {letter.message}
                </motion.p>
              )}

              {!letter.imageUrl && !letter.title && !letter.message && (
                <p className="text-text-muted/40 text-sm text-center py-8">
                  这封信里什么也没有...
                </p>
              )}
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
