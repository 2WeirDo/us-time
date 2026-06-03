import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';
import type { Post } from '../../types';

interface OnThisDayProps {
  posts: Post[];
  onPostClick?: (post: Post) => void;
}

/**
 * Filters posts from the same month+day in previous years.
 */
function getOnThisDayPosts(posts: Post[]): { post: Post; yearsAgo: number }[] {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const thisYear = today.getFullYear();

  return posts
    .map((post) => {
      const postDate = new Date(post.createdAt);
      if (
        postDate.getMonth() === todayMonth &&
        postDate.getDate() === todayDay &&
        postDate.getFullYear() < thisYear
      ) {
        return { post, yearsAgo: thisYear - postDate.getFullYear() };
      }
      return null;
    })
    .filter((v): v is { post: Post; yearsAgo: number } => v !== null)
    .sort((a, b) => b.yearsAgo - a.yearsAgo);
}

export default function OnThisDay({ posts, onPostClick }: OnThisDayProps) {
  const memories = useMemo(() => getOnThisDayPosts(posts), [posts]);

  if (memories.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="card mb-4 border-pink/20 bg-pink-soft/50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-pink" />
          <h3 className="text-sm font-semibold text-pink">那年今日</h3>
          <span className="text-xs text-text-muted/60">
            {new Date().getMonth() + 1}月{new Date().getDate()}日
          </span>
        </div>

        <div className="space-y-2">
          {memories.map(({ post, yearsAgo }) => (
            <button
              key={post.id}
              onClick={() => onPostClick?.(post)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 transition-colors text-left"
            >
              {/* Photo thumbnail or mood */}
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                {post.photos.length > 0 ? (
                  <img
                    src={post.photos[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : post.mood ? (
                  <span className="text-lg">{post.mood}</span>
                ) : (
                  <Clock size={16} className="text-text-muted/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {post.content || '一张照片'}
                </p>
                <p className="text-xs text-text-muted/60">
                  {yearsAgo}年前 · {post.author === 'me' ? '你' : 'TA'}的记录
                </p>
              </div>
              <span className="text-xs text-pink/60 font-medium">{yearsAgo}年前</span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
