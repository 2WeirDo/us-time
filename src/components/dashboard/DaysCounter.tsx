import { Heart } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { useDaysCount } from '../../hooks/useDaysCount';

export default function DaysCounter() {
  const { state } = useSharedAppState();
  const days = useDaysCount(state.coupleInfo?.startDate);

  if (!state.coupleInfo) return null;

  return (
    <div className="card bg-gradient-to-br from-pink to-pink-dark text-white overflow-hidden relative !border-0 animate-slide-up stagger-1">
      {/* Decorative hearts in background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Heart
          size={60}
          className="absolute top-2 right-4 rotate-12"
          fill="white"
        />
        <Heart
          size={40}
          className="absolute bottom-2 left-4 -rotate-12"
          fill="white"
        />
        <Heart
          size={20}
          className="absolute top-1/2 right-8 rotate-45"
          fill="white"
        />
      </div>

      <div className="relative z-10">
        <p className="text-white/70 text-sm font-medium">
          {state.coupleInfo.myName} {state.coupleInfo.coupleEmoji || '💕'}{' '}
          {state.coupleInfo.partnerName}
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-white/60 text-sm">在一起第</span>
          <span
            className="font-display text-4xl font-bold tabular-nums animate-pop-in"
            key={days}
          >
            {days.toLocaleString()}
          </span>
          <span className="text-white/60 text-sm">天</span>
        </div>
        <p className="text-white/50 text-xs mt-2">
          从 {state.coupleInfo.startDate} 开始 ❤️
        </p>
      </div>
    </div>
  );
}
