import { useState, useMemo } from 'react';
import { Calendar, Clock, Sparkles, ImageOff } from 'lucide-react';
import { useSharedAppState } from '../hooks/AppStateContext';
import { getOnThisDayMemories } from '../components/timeline/OnThisDay';
import PhotoLightbox from '../components/timeline/PhotoLightbox';

export default function OnThisDayPage() {
  const { state } = useSharedAppState();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const memories = useMemo(() => getOnThisDayMemories(state.posts), [state.posts]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  const handlePhotoClick = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (memories.length === 0) {
    return (
      <div className="pb-24 animate-fade-in">
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">
          📅 那年今日
        </h2>

        <div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up-delayed">
          <div className="w-24 h-24 rounded-full bg-warm-cream flex items-center justify-center mb-5">
            <Calendar size={40} className="text-text-muted/20" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {todayStr}
          </h3>
          <p className="text-text-muted text-sm max-w-[240px]">
            这一天的记忆还在等待创造呢 💕
          </p>
          <p className="text-text-muted/40 text-xs mt-3">
            明年的今天，这里就会有属于你们的回忆
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold text-text-primary mb-1">
          📅 那年今日
        </h2>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <Calendar size={14} />
          <span>{todayStr}</span>
          <span className="text-pink/60 font-medium">
            {memories.length} 条回忆
          </span>
        </div>
      </div>

      {/* Year labels section */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[...new Set(memories.map((m) => m.yearsAgo))].sort().map((years) => (
          <span
            key={years}
            className="px-3 py-1 rounded-full bg-pink/5 border border-pink/10 text-xs font-medium text-pink/80"
          >
            {years}年前
          </span>
        ))}
      </div>

      {/* Memory cards */}
      <div className="space-y-4">
        {memories.map(({ post, yearsAgo }, i) => (
          <div
            key={post.id}
            className="card border-pink/10 overflow-hidden animate-slide-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-pink/10 flex items-center justify-center">
                  <Sparkles size={13} className="text-pink" />
                </div>
                <span className="text-sm font-semibold text-pink">
                  {yearsAgo}年前
                </span>
              </div>
              <div className="flex items-center gap-2">
                {post.mood && (
                  <span className="text-sm">{post.mood}</span>
                )}
                <span className="text-xs text-text-muted/40">
                  {post.author === 'me' ? '我' : 'TA'}
                </span>
              </div>
            </div>

            {/* Photos grid */}
            {post.photos.length > 0 && (
              <div
                className={`grid gap-2 mb-3 ${
                  post.photos.length === 1
                    ? 'grid-cols-1'
                    : post.photos.length === 2
                    ? 'grid-cols-2'
                    : post.photos.length === 3
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
                }`}
              >
                {post.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className={`relative overflow-hidden rounded-xl cursor-pointer group ${
                      post.photos.length === 3 && idx === 0
                        ? 'col-span-2 max-h-48'
                        : 'aspect-square'
                    }`}
                    onClick={() => handlePhotoClick(post.photos, idx)}
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            {post.content && (
              <p className="text-sm text-text-primary leading-relaxed mb-3">
                {post.content}
              </p>
            )}

            {/* No photo & no content */}
            {post.photos.length === 0 && !post.content && (
              <div className="flex items-center gap-2 py-3 text-text-muted/40 text-sm">
                <ImageOff size={16} />
                <span>没有留下文字和照片</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-2 text-xs text-text-muted/40 pt-2 border-t border-pink/5">
              <Clock size={11} />
              <span>
                {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setLightboxIndex((i) =>
              Math.min(lightboxPhotos.length - 1, i + 1)
            )
          }
        />
      )}
    </div>
  );
}
