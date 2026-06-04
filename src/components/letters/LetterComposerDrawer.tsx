import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { uploadPhoto } from '../../lib/storage';
import LetterCanvas from './LetterCanvas';

interface LetterComposerDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function LetterComposerDrawer({ open, onClose }: LetterComposerDrawerProps) {
  const { identity, addLetter } = useSharedAppState();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const getCanvasDataUrlRef = useRef<(() => string | null) | null>(null);

  const handleCanvasReady = useCallback((getDataUrl: () => string | null) => {
    getCanvasDataUrlRef.current = getDataUrl;
  }, []);

  const handleOpen = () => {
    setTitle('');
    setMessage('');
    setSaving(false);
    getCanvasDataUrlRef.current = null;
  };

  const handleSubmit = async () => {
    if (!identity) return;

    const dataUrl = getCanvasDataUrlRef.current?.();
    const hasText = title.trim() || message.trim();

    // Require at least the canvas drawing or some text
    if (!dataUrl && !hasText) return;

    setSaving(true);

    // Get canvas image
    let imageUrl: string | undefined;
    if (dataUrl) {
      const uploaded = await uploadPhoto(dataUrl, `letter-${Date.now()}.png`);
      imageUrl = uploaded || dataUrl; // fallback to base64
    }

    await addLetter({
      author: identity,
      imageUrl,
      title: title.trim() || undefined,
      message: message.trim() || undefined,
    });

    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-[1001]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[1001] bg-white rounded-t-[28px] shadow-lift max-w-lg mx-auto overflow-hidden"
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
                写一封信
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title input */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  标题（可选）
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给TA的一句话..."
                  className="input-field"
                  maxLength={50}
                />
              </div>

              {/* Canvas */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  手写内容
                </label>
                <LetterCanvas onCanvasReady={handleCanvasReady} />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  附言（可选）
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="想说但画不出来的话..."
                  className="input-field min-h-[60px] resize-none"
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="px-5 pb-24 pt-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`w-full py-3.5 rounded-[20px] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  !saving
                    ? 'btn-primary'
                    : 'bg-pink/10 text-pink/40 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    发送中...
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    发送信件
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
