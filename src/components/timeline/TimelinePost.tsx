import { motion } from 'framer-motion';
import { Trash2, Pencil, Play, Pause } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import type { Post } from '../../types';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { formatRelativeTime } from '../../lib/utils';
import PhotoGrid from '../ui/PhotoGrid';
import PhotoLightbox from './PhotoLightbox';
import PostReactions from '../post/PostReactions';
import CommentSection from '../post/CommentSection';

interface TimelinePostProps {
  post: Post;
  index: number;
  onEdit?: (post: Post) => void;
}

export default function TimelinePost({ post, index, onEdit }: TimelinePostProps) {
  const { state, identity, deletePost } = useSharedAppState();
  const [showDelete, setShowDelete] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowDelete(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    if (!isLongPress.current && showDelete) {
      setShowDelete(false);
    }
    isLongPress.current = false;
  }, [showDelete]);

  const isMe = post.author === 'me';
  const isOwnPost = post.author === identity;
  const authorName = isMe
    ? state.coupleInfo?.myName || '我'
    : state.coupleInfo?.partnerName || 'TA';
  const avatarUrl = isMe
    ? state.coupleInfo?.avatarMe
    : state.coupleInfo?.avatarPartner;
  const avatarEmoji = isMe ? '🙋' : '💁';

  return (
    <motion.div
      className="flex gap-3 group select-none"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={clearTimer}
      onClick={handleClick}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-9 h-9 rounded-full bg-pink/10 ring-2 ring-pink/15 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            avatarEmoji
          )}
        </div>
        <div className="w-px flex-1 bg-text-muted/10 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-text-primary">
            {authorName}
          </span>
          <span className="text-xs text-text-muted/60">
            {formatRelativeTime(post.createdAt)}
          </span>
          {post.mood && (
            <span className="text-sm ml-auto">{post.mood}</span>
          )}
        </div>

        {/* Text content */}
        {post.content && (
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Audio */}
        {post.audio && (
          <div className="mt-2">
            <AudioPlayer src={post.audio} />
          </div>
        )}

        {/* Photos */}
        <PhotoGrid
          photos={post.photos}
          onPhotoClick={(i) => setLightboxIndex(i)}
        />

        {/* Reactions */}
        <PostReactions postId={post.id} reactions={post.reactions || {}} />

        {/* Comments */}
        <CommentSection postId={post.id} />

        {/* Edit & Delete buttons — only for the author */}
        {showDelete && isOwnPost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 flex items-center gap-3"
          >
            <button
              className="flex items-center gap-1 text-xs text-pink/60 hover:text-pink transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
                setShowDelete(false);
              }}
            >
              <Pencil size={12} />
              编辑
            </button>
            <button
              className="flex items-center gap-1 text-xs text-red/50 hover:text-red transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                deletePost(post.id);
              }}
            >
              <Trash2 size={12} />
              删除
            </button>
          </motion.div>
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={post.photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(post.photos.length - 1, (i ?? 0) + 1))}
        />
      )}
    </motion.div>
  );
}

/** Simple audio player for voice messages */
function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleEnded = () => setPlaying(false);

  const handleLoaded = () => {
    if (audioRef.current) {
      const d = Math.round(audioRef.current.duration || 0);
      setDuration(d);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-warm-cream rounded-2xl px-3 py-2.5">
      <button
        onClick={togglePlay}
        aria-label={playing ? '暂停播放' : '播放语音'}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-pink text-white flex items-center justify-center hover:bg-pink-dark transition-colors"
      >
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 bg-text-muted/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-pink rounded-full"
          animate={{ width: playing ? '100%' : '0%' }}
          transition={{ duration: playing ? (duration || 5) : 0, ease: 'linear' }}
          key={playing ? 'playing' : 'stopped'}
        />
      </div>
      <span className="text-xs text-text-muted flex-shrink-0">
        {duration > 0 ? `${duration}"` : ''}
      </span>
      <audio
        ref={audioRef}
        src={src}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoaded}
        preload="metadata"
      />
    </div>
  );
}
