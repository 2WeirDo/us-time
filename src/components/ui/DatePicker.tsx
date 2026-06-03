import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO date "YYYY-MM-DD"
  onChange: (date: string) => void;
  max?: string; // max selectable date
  min?: string;
  label?: string;
}

const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function DatePicker({ value, onChange, max, min, label }: DatePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    value ? new Date(value).getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    value ? new Date(value).getMonth() : today.getMonth()
  );
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value) : null;
  const maxDate = max ? new Date(max) : null;
  const minDate = min ? new Date(min) : null;

  const displayText = value
    ? `${selectedDate!.getFullYear()}年 ${selectedDate!.getMonth() + 1}月${selectedDate!.getDate()}日`
    : '选择日期';

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (maxDate && date > maxDate) return true;
    if (minDate && date < minDate) return true;
    return false;
  };

  const handleSelect = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="text-xs text-text-muted mb-1.5 block font-medium">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] bg-gradient-to-r from-pink-light/30 to-white border-2 border-pink/20 hover:border-pink/40 transition-all duration-200 group"
      >
        <div className="w-9 h-9 rounded-full bg-pink/10 flex items-center justify-center flex-shrink-0 group-hover:bg-pink/20 transition-colors">
          <Calendar size={16} className="text-pink" />
        </div>
        <span className={`text-sm font-medium ${value ? 'text-text-primary' : 'text-text-muted/50'}`}>
          {displayText}
        </span>
        {value && (
          <span className="ml-auto text-lg">📅</span>
        )}
      </button>

      {/* Calendar dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-[24px] shadow-lift border-2 border-pink/15 p-4 overflow-hidden"
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header: month nav */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-full hover:bg-pink-light/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={16} className="text-pink" />
                </button>
                <span className="font-display font-bold text-text-primary text-base">
                  {viewYear}年 {MONTHS[viewMonth]}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full hover:bg-pink-light/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={16} className="text-pink" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-[11px] font-semibold text-pink/50 py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day buttons */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const selected = isSelected(day);
                  const today_ = isToday(day);
                  const disabled = isDisabled(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleSelect(day)}
                      className={`aspect-square rounded-full text-sm font-medium flex items-center justify-center transition-all relative
                        ${disabled
                          ? 'text-text-muted/20 cursor-not-allowed'
                          : selected
                            ? 'bg-pink text-white shadow-md shadow-pink/30 scale-110'
                            : today_
                              ? 'bg-pink-light/30 text-pink font-bold ring-1 ring-pink/30'
                              : 'hover:bg-pink-light/20 text-text-primary'
                        }
                      `}
                    >
                      {day}
                      {/* Hello Kitty bow dot for today */}
                      {today_ && !selected && (
                        <span className="absolute -top-0.5 right-0.5 w-2 h-2 bg-red-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bow decoration at bottom */}
              <div className="flex justify-center mt-3 pt-2 border-t border-pink/10">
                <span className="text-sm text-pink/40">🎀</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
