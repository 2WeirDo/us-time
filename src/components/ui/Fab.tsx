import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, FileText } from 'lucide-react';

interface FabProps {
  onNewPost?: () => void;
}

export default function Fab({ onNewPost }: FabProps) {
  const [open, setOpen] = useState(false);

  const handleNewPost = () => {
    setOpen(false);
    onNewPost?.();
  };

  return (
    <div className="fixed bottom-8 right-4 z-50 flex flex-col items-end gap-3">
      {/* Expandable actions */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col gap-3 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-card text-text-primary font-medium text-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.05 }}
              onClick={handleNewPost}
            >
              <FileText size={18} className="text-pink" />
              记录瞬间
            </motion.button>
            <motion.button
              className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-card text-text-primary font-medium text-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.1 }}
              onClick={handleNewPost}
            >
              <Mic size={18} className="text-pink-dark" />
              录制语音
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink to-pink-dark text-white shadow-pink flex items-center justify-center"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: open ? 45 : 0 }}
      >
        <Plus size={28} />
      </motion.button>
    </div>
  );
}
