import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { BUCKET_CATEGORIES } from '../../types';
import type { BucketCategory } from '../../types';

interface BucketListAddDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_EMOJI_MAP: Record<string, string> = {};
BUCKET_CATEGORIES.forEach((c) => {
  CATEGORY_EMOJI_MAP[c.key] = c.emoji;
});

export default function BucketListAddDrawer({ open, onClose }: BucketListAddDrawerProps) {
  const { identity, addBucketItem } = useSharedAppState();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BucketCategory>('other');
  const [notes, setNotes] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setTitle('');
    setCategory('other');
    setNotes('');
    setEmoji('✨');
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !identity) return;
    setSaving(true);
    await addBucketItem({
      title: title.trim(),
      category,
      notes: notes.trim(),
      emoji,
      createdBy: identity,
    });
    setSaving(false);
    onClose();
  };

  const canSubmit = title.trim().length > 0 && !saving;

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-lift max-w-lg mx-auto overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onAnimationStart={handleOpen}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-pink/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="font-semibold text-text-primary text-base">
                添加心愿
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Emoji picker */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  图标
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['✨', '💕', '🎯', '🌟', '🎨', '🎵', '📸', '🌍', '🍜', '🏃', '💪', '🎮'].map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        emoji === e
                          ? 'bg-pink/15 ring-2 ring-pink/30 scale-110'
                          : 'bg-warm-cream hover:bg-pink/5'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  心愿内容
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：一起看极光..."
                  className="input-field"
                  autoFocus
                  maxLength={100}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  分类
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BUCKET_CATEGORIES.map(({ key, label, emoji: catEmoji }) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 justify-center ${
                        category === key
                          ? 'bg-pink/15 text-pink ring-1 ring-pink/30'
                          : 'bg-warm-cream text-text-muted hover:bg-pink/5'
                      }`}
                    >
                      <span>{catEmoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  备注（可选）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="记录一下细节..."
                  className="input-field min-h-[60px] resize-none"
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="px-5 pb-8 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-3.5 rounded-[20px] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  canSubmit
                    ? 'btn-primary'
                    : 'bg-pink/10 text-pink/40 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    添加到清单
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
