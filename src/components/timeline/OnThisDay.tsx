import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import type { Post } from '../../types';

interface OnThisDayProps {
  posts: Post[];
  onPostClick?: (post: Post) => void;
}

/**
 * Filters posts from the same month+day in previous years.
 */
export function getOnThisDayMemories(posts: Post[]): { post: Post; yearsAgo: number }[] {
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
  const navigate = useNavigate();
  const memories = useMemo(() => getOnThisDayMemories(posts), [posts]);

  if (memories.length === 0) return null;

  // Collect all photos from all on-this-day posts for the carousel
  const allPhotos = useMemo(
    () => memories.flatMap(({ post }) => post.photos.slice(0, 1).map((url) => ({ url, postId: post.id }))),
    [memories],
  );

  return (
    <AnimatePresence>
      <motion.div
        className="card mb-4 border-pink/20 bg-pink-soft/50 overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pink/10 flex items-center justify-center">
              <Sparkles size={14} className="text-pink" />
            </div>
            <h3 className="text-sm font-semibold text-pink">那年今日</h3>
            <span className="text-xs text-text-muted/60">
              {new Date().getMonth() + 1}月{new Date().getDate()}日
            </span>
          </div>
          <button
            onClick={() => navigate('/onthisday')}
            className="flex items-center gap-1 text-xs text-pink/60 hover:text-pink transition-colors"
          >
            查看全部
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Photo preview strip */}
        {allPhotos.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {allPhotos.slice(0, 5).map(({ url, postId }) => (
              <div
                key={postId}
                className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {allPhotos.length > 5 && (
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-pink/5 flex items-center justify-center text-xs text-pink/60">
                +{allPhotos.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Memory list */}
        <div className="space-y-1.5">
          {memories.slice(0, 3).map(({ post, yearsAgo }) => (
            <button
              key={post.id}
              onClick={() => onPostClick?.(post)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/60 transition-colors text-left"
            >
              {/* Photo thumbnail or mood */}
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                {post.photos.length > 0 ? (
                  <img
                    src={post.photos[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : post.mood ? (
                  <span className="text-base">{post.mood}</span>
                ) : (
                  <Clock size={14} className="text-text-muted/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {post.content || '一张照片'}
                </p>
                <p className="text-xs text-text-muted/60">
                  {yearsAgo}年前 · {post.author === 'me' ? '你' : 'TA'}
                </p>
              </div>
              <span className="text-xs text-pink/50 font-medium flex-shrink-0">
                {yearsAgo}年前
              </span>
            </button>
          ))}

          {memories.length > 3 && (
            <button
              onClick={() => navigate('/onthisday')}
              className="w-full text-center text-xs text-pink/50 hover:text-pink py-1 transition-colors"
            >
              还有 {memories.length - 3} 条记忆...
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
