import { motion } from 'framer-motion';
import LetterInbox from '../components/letters/LetterInbox';

export default function LettersPage() {
  return (
    <motion.div
      className="pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="font-display text-lg font-bold text-text-primary mb-1">
        ✉️ 书信
      </h2>
      <p className="text-xs text-text-muted/50 mb-4">
        用手写的方式，传递最真挚的情感
      </p>
      <LetterInbox />
    </motion.div>
  );
}
