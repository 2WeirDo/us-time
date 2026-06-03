import { useRef } from 'react';
import { X, Image } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[] | ((prev: string[]) => string[])) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 4,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxPhotos - photos.length;
    const toProcess = files.slice(0, remaining);

    toProcess.forEach(async (file) => {
      try {
        // Compress image before converting to base64 (max 1200px, JPEG 0.75 quality)
        const compressed = await compressImage(file, 1200, 0.75);
        onPhotosChange((current) => [...current, compressed]);
      } catch {
        // Fallback: read as-is if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          onPhotosChange((current) => [...current, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
              <img
                src={photo}
                alt={`选中 ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {photos.length < maxPhotos && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-text-muted/20 hover:border-pink/30 hover:bg-pink/5 transition-colors text-text-muted text-sm"
        >
          <Image size={18} />
          添加照片 ({photos.length}/{maxPhotos})
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
