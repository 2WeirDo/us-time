import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { useNextMilestone } from '../../hooks/useDaysCount';

export default function CountdownCard() {
  const { state } = useSharedAppState();
  const nextMilestone = useNextMilestone(
    state.coupleInfo?.startDate,
    state.milestones
  );

  return (
    <motion.div
      className="card flex flex-col justify-between min-h-[120px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 text-text-muted">
        <Clock size={16} />
        <span className="text-xs font-medium">下一个纪念日</span>
      </div>

      {nextMilestone ? (
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg">{nextMilestone.icon || '💕'}</span>
            <span className="text-sm font-semibold text-text-primary truncate">
              {nextMilestone.title}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <motion.span
              className="font-display text-2xl font-bold text-pink tabular-nums"
              key={nextMilestone.daysLeft}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {nextMilestone.daysLeft}
            </motion.span>
            <span className="text-xs text-text-muted">天</span>
          </div>
          <p className="text-text-muted/50 text-[10px] mt-1">
            {nextMilestone.date}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted/40 py-4">
          <Calendar size={24} />
          <span className="text-xs mt-1">添加纪念日</span>
        </div>
      )}
    </motion.div>
  );
}
