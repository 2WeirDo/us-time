import { useState } from 'react';

interface PhotoGridProps {
  photos: string[];
  onPhotoClick?: (index: number) => void;
  maxDisplay?: number;
}

/** Shared photo grid that handles 1/2/3/4 photo layouts consistently. */
export default function PhotoGrid({ photos, onPhotoClick, maxDisplay = 4 }: PhotoGridProps) {
  const [imgError, setImgError] = useState(false);

  if (photos.length === 0 || imgError) return null;

  const displayPhotos = photos.slice(0, maxDisplay);

  return (
    <div
      className={`mt-2 grid gap-1.5 rounded-2xl overflow-hidden ${
        displayPhotos.length === 1
          ? 'grid-cols-1'
          : displayPhotos.length === 2
            ? 'grid-cols-2'
            : displayPhotos.length === 3
              ? 'grid-cols-2 grid-rows-2'
              : 'grid-cols-2'
      }`}
    >
      {displayPhotos.map((photo, i) => (
        <div
          key={i}
          className={`relative cursor-pointer ${
            displayPhotos.length === 3 && i === 0 ? 'row-span-2' : ''
          }`}
          onClick={() => onPhotoClick?.(i)}
        >
          <img
            src={photo}
            alt={`照片 ${i + 1}`}
            className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
