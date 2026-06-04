import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Show a submit button pinned at the bottom */
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitIcon?: ReactNode;
  /** z-index override, defaults to 50 */
  zIndex?: number;
  /** Called when drawer animation starts (for resetting form state) */
  onOpen?: () => void;
  /** Max height for scrollable content area */
  contentMaxHeight?: string;
}

const DRAWER_ANIMATION = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
};

const BACKDROP_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function BottomDrawer({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = '确定',
  submitDisabled = false,
  submitLoading = false,
  submitIcon,
  zIndex = 50,
  onOpen,
  contentMaxHeight = '65vh',
}: BottomDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex }}
            {...BACKDROP_ANIMATION}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl max-w-lg mx-auto shadow-lift"
            style={{ zIndex, maxHeight: '90vh', overflowY: 'auto' }}
            {...DRAWER_ANIMATION}
            onAnimationStart={onOpen}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-muted/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="font-display text-lg font-bold text-text-primary">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-warm-cream transition-colors"
                aria-label="关闭"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div
              className="px-5 pb-6 space-y-4 overflow-y-auto"
              style={{ maxHeight: contentMaxHeight }}
            >
              {children}
            </div>

            {/* Submit button */}
            {onSubmit && (
              <div className="px-5 pb-8 pt-2">
                <button
                  onClick={onSubmit}
                  disabled={submitDisabled || submitLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white transition-all ${
                    submitDisabled || submitLoading
                      ? 'bg-text-muted/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink to-pink-dark shadow-soft hover:shadow-card active:scale-[0.98]'
                  }`}
                >
                  {submitLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      {submitIcon}
                      {submitLabel}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
