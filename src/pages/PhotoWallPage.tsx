import { motion } from 'framer-motion';
import PhotoWall from '../components/photos/PhotoWall';

export default function PhotoWallPage() {
  return (
    <motion.div
      className="pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="font-display text-lg font-bold text-text-primary mb-4">
        🖼️ 照片墙
      </h2>
      <PhotoWall />
    </motion.div>
  );
}
