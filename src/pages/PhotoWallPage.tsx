import { motion } from 'framer-motion';

export default function PhotoWallPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
      <h2 className="font-display text-lg font-bold text-text-primary mb-4">🖼️ 照片墙</h2>
      <p className="text-text-muted text-sm text-center py-12">即将上线...</p>
    </motion.div>
  );
}
