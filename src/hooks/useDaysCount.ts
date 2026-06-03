import { useMemo } from 'react';

/**
 * Calculate days between two dates.
 */
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Hook: returns the number of days since the couple got together.
 */
export function useDaysCount(startDate: string | undefined) {
  return useMemo(() => {
    if (!startDate) return 0;
    return daysBetween(startDate, new Date().toISOString().split('T')[0]);
  }, [startDate]);
}

/**
 * Hook: find the next upcoming milestone and its countdown.
 */
export function useNextMilestone(
  startDate: string | undefined,
  milestones: { date: string; title: string; icon?: string }[]
) {
  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Build candidates: anniversary + custom milestones
    const candidates: { title: string; date: string; icon?: string }[] = [];

    if (startDate) {
      const start = new Date(startDate);
      const currentYear = new Date().getFullYear();
      // This year's anniversary
      const anniversaryThisYear = new Date(
        currentYear,
        start.getMonth(),
        start.getDate()
      );
      const anniversaryDate = anniversaryThisYear.toISOString().split('T')[0];
      if (anniversaryDate >= today) {
        const years = currentYear - start.getFullYear();
        candidates.push({
          title: `${years}周年纪念日`,
          date: anniversaryDate,
          icon: '💕',
        });
      } else {
        // Next year's anniversary
        const nextYear = new Date(
          currentYear + 1,
          start.getMonth(),
          start.getDate()
        );
        const years = currentYear + 1 - start.getFullYear();
        candidates.push({
          title: `${years}周年纪念日`,
          date: nextYear.toISOString().split('T')[0],
          icon: '💕',
        });
      }
    }

    // Custom milestones
    for (const m of milestones) {
      if (!m.date) continue;
      // Check if this year's milestone date has passed
      const msDate = new Date(m.date);
      const thisYearMs = new Date(
        new Date().getFullYear(),
        msDate.getMonth(),
        msDate.getDate()
      );
      const thisYearDate = thisYearMs.toISOString().split('T')[0];
      if (thisYearDate >= today) {
        candidates.push({
          title: m.title,
          date: thisYearDate,
          icon: m.icon,
        });
      } else {
        const nextYearMs = new Date(
          new Date().getFullYear() + 1,
          msDate.getMonth(),
          msDate.getDate()
        );
        candidates.push({
          title: m.title,
          date: nextYearMs.toISOString().split('T')[0],
          icon: m.icon,
        });
      }
    }

    // Sort by date, pick the closest
    candidates.sort((a, b) => a.date.localeCompare(b.date));
    const next = candidates[0] || null;

    if (!next) return null;

    const daysLeft = daysBetween(today, next.date);
    return { ...next, daysLeft };
  }, [startDate, milestones]);
}
