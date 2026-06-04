import { useState, useMemo } from 'react';
import { Image } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import PhotoItem from './PhotoItem';
import PhotoLightbox from '../timeline/PhotoLightbox';

export default function PhotoWall() {
  const { state } = useSharedAppState();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Extract all photos from all posts
  const photoEntries = useMemo(() => {
    return state.posts.flatMap((post) =>
      post.photos.map((photoUrl, photoIdx) => ({
        photoUrl,
        post,
        photoIdx,
        key: `${post.id}-${photoIdx}`,
      }))
    );
  }, [state.posts]);

  const handlePhotoClick = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (photoEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mb-4">
          <Image size={32} className="text-text-muted/30" />
        </div>
        <p className="text-text-muted text-sm">还没有照片</p>
        <p className="text-text-muted/50 text-xs mt-1">发一条带照片的记录吧 📸</p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry grid using CSS columns */}
      <div className="columns-2 gap-3">
        {photoEntries.map((entry, i) => (
          <PhotoItem
            key={entry.key}
            photoUrl={entry.photoUrl}
            post={entry.post}
            index={i}
            onClick={handlePhotoClick}
          />
        ))}
      </div>

      <p className="text-center text-xs text-text-muted/30 mt-4 mb-8">
        {photoEntries.length} 张照片
      </p>

      {/* Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(lightboxPhotos.length - 1, i + 1))}
        />
      )}
    </>
  );
}
