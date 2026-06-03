import { motion } from 'framer-motion';
import type { Post } from '../../types';

interface PhotoItemProps {
  photoUrl: string;
  post: Post;
  index: number;
  onClick: (photos: string[], index: number) => void;
}

export default function PhotoItem({ photoUrl, post, index, onClick }: PhotoItemProps) {
  const handleClick = () => {
    // Find this photo's index within the post's photos array
    const photoIndex = post.photos.indexOf(photoUrl);
    onClick(post.photos, photoIndex >= 0 ? photoIndex : 0);
  };

  return (
    <motion.div
      className="break-inside-avoid mb-3 cursor-pointer group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={photoUrl}
          alt=""
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Author badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            post.author === 'me'
              ? 'bg-pink text-white'
              : 'bg-white/90 text-text-primary'
          }`}>
            {post.author === 'me' ? '我' : 'TA'}
          </span>
        </div>
      </div>

      {/* Post context mini preview */}
      {post.mood && (
        <span className="absolute bottom-2 left-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {post.mood}
        </span>
      )}
    </motion.div>
  );
}
