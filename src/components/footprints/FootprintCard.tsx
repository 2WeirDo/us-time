import { motion } from 'framer-motion';
import { MapPin, Calendar, Trash2, Navigation } from 'lucide-react';
import type { Footprint } from '../../types';

interface FootprintCardProps {
  footprint: Footprint;
  onDelete: (id: string) => void;
  onFocus: (lat: number, lng: number) => void;
  index: number;
}

export default function FootprintCard({
  footprint,
  onDelete,
  onFocus,
  index,
}: FootprintCardProps) {
  const dateStr = footprint.date
    ? new Date(footprint.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <motion.div
      className="card flex items-center gap-3 group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      layout
    >
      {/* Map pin icon */}
      <div className="w-9 h-9 rounded-xl bg-pink/10 flex items-center justify-center flex-shrink-0">
        <MapPin size={16} className="text-pink" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-text-primary truncate">
          {footprint.name}
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {dateStr && (
            <span className="text-xs text-text-muted/50 flex items-center gap-1">
              <Calendar size={10} />
              {dateStr}
            </span>
          )}
          {footprint.note && (
            <span className="text-xs text-text-muted/40 truncate">
              {footprint.note}
            </span>
          )}
        </div>
        {footprint.photo && (
          <img
            src={footprint.photo}
            alt={footprint.name}
            className="mt-2 w-full h-20 object-cover rounded-lg"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFocus(footprint.lat, footprint.lng)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-pink/10 text-text-muted/30 hover:text-pink transition-all"
        >
          <Navigation size={13} />
        </button>
        <button
          onClick={() => onDelete(footprint.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-muted/30 hover:text-red-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}
