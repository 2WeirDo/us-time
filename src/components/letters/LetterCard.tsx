import { motion } from 'framer-motion';
import { Mail, MailOpen, Trash2, Clock } from 'lucide-react';
import type { LoveLetter } from '../../types';

interface LetterCardProps {
  letter: LoveLetter;
  onClick: () => void;
  onDelete: (id: string) => void;
  index: number;
}

export default function LetterCard({ letter, onClick, onDelete, index }: LetterCardProps) {
  const date = new Date(letter.createdAt);
  const dateStr = date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.button
      onClick={onClick}
      className="w-full card flex items-center gap-3 text-left group relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Envelope icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          letter.read ? 'bg-warm-cream' : 'bg-pink/10'
        }`}
      >
        {letter.read ? (
          <MailOpen size={18} className="text-text-muted/40" />
        ) : (
          <Mail size={18} className="text-pink" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-semibold text-text-primary truncate">
            {letter.title || '一封手写信'}
          </h4>
          {!letter.read && (
            <span className="w-2 h-2 rounded-full bg-pink flex-shrink-0" />
          )}
        </div>
        {letter.message && (
          <p className="text-xs text-text-muted/60 truncate">{letter.message}</p>
        )}
        <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted/40">
          <Clock size={10} />
          <span>{dateStr}</span>
          <span>·</span>
          <span>{letter.author === 'me' ? '我' : 'TA'}</span>
        </div>
      </div>

      {/* Receipt stripe for unread */}
      {!letter.read && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-pink rounded-r-full" />
      )}

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(letter.id);
        }}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-muted/30 hover:text-red-400 transition-all"
      >
        <Trash2 size={13} />
      </button>
    </motion.button>
  );
}
