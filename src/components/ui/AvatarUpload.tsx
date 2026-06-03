import { useRef } from 'react';
import { Camera } from 'lucide-react';

interface AvatarUploadProps {
  image: string | undefined;
  onChange: (base64: string) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

const iconSizeMap = {
  sm: 14,
  md: 18,
  lg: 22,
};

export default function AvatarUpload({
  image,
  onChange,
  size = 'md',
  label,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${sizeMap[size]} rounded-full overflow-hidden relative group transition-all hover:ring-2 hover:ring-pink/30`}
      >
        {image ? (
          <img
            src={image}
            alt={label || '头像'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-warm-cream flex items-center justify-center text-3xl text-text-muted/30">
            👤
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={iconSizeMap[size]} className="text-white" />
        </div>
      </button>
      {label && (
        <span className="text-xs text-text-muted">{label}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
