import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import type { BucketListItem as BucketListItemType } from '../../types';

interface BucketListItemProps {
  item: BucketListItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export default function BucketListItem({ item, onToggle, onDelete, index }: BucketListItemProps) {
  return (
    <motion.div
      className={`card flex items-center gap-3 group transition-all ${
        item.completed ? 'opacity-50 border-pink/5' : 'border-pink/08'
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      layout
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          item.completed
            ? 'bg-pink border-pink text-white'
            : 'border-pink/20 hover:border-pink/40 text-transparent hover:text-pink/30'
        }`}
      >
        {item.completed && <Check size={14} strokeWidth={3} />}
      </button>

      {/* Emoji */}
      <span className="text-xl flex-shrink-0">{item.emoji}</span>

      {/* Title + notes */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium transition-all ${
            item.completed
              ? 'text-text-muted/60 line-through'
              : 'text-text-primary'
          }`}
        >
          {item.title}
        </p>
        {item.notes && (
          <p className="text-xs text-text-muted/50 truncate mt-0.5">
            {item.notes}
          </p>
        )}
        {item.completed && item.completedBy && (
          <p className="text-[10px] text-pink/60 mt-0.5">
            {item.completedBy === 'me' ? '我' : 'TA'}完成了这个心愿 💕
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-muted/30 hover:text-red-400 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
