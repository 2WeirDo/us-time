import { motion } from 'framer-motion';
import { MOOD_OPTIONS } from '../../types';

interface MoodPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export default function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {MOOD_OPTIONS.map(({ emoji, label }) => (
        <motion.button
          key={emoji}
          onClick={() => onSelect(emoji === selected ? '' : emoji)}
          className={`text-xl px-3 py-2 rounded-xl transition-colors ${
            selected === emoji
              ? 'bg-pink/10 ring-1 ring-pink/30'
              : 'hover:bg-warm-cream'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
