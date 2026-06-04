import { Camera, Heart } from 'lucide-react';

export default function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-slide-up">
      {/* Decorative */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-pink/5 flex items-center justify-center animate-[pulse-soft_3s_ease-in-out_infinite]">
          <Camera size={32} className="text-pink/30" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-pink/10 flex items-center justify-center animate-[pulse-soft_2s_ease-in-out_0.5s_infinite]">
          <Heart size={14} className="text-pink/40" fill="currentColor" />
        </div>
      </div>

      <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
        还没有记录呢
      </h3>
      <p className="text-text-muted text-sm max-w-[240px]">
        点击右下角的 + 按钮，记录你们的第一个瞬间吧 💕
      </p>

      {/* Arrow pointing down-right */}
      <div className="mt-6 text-text-muted/30 animate-[bounce-gentle_2s_ease-in-out_infinite]">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <path
            d="M10 10 L30 30 M30 30 L30 15 M30 30 L15 30"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
