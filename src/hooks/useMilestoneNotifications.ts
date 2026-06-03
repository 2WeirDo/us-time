import { useEffect, useRef } from 'react';
import type { Milestone } from '../types';

/**
 * Show a browser notification for milestones coming up within `daysThreshold`.
 * Only fires once per session (tracks via a Set ref).
 */
export function useMilestoneNotifications(
  startDate: string | undefined,
  milestones: Milestone[],
  daysThreshold: number = 3
) {
  const notifiedRef = useRef<Set<string>>(new Set());
  const hasPermission = useRef<boolean>(false);

  useEffect(() => {
    // Check and request notification permission
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      hasPermission.current = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        hasPermission.current = permission === 'granted';
      });
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const dayMs = 1000 * 60 * 60 * 24;

    // Build upcoming events list
    const upcoming: { id: string; title: string; icon: string; daysLeft: number }[] = [];

    // Anniversary
    if (startDate) {
      const start = new Date(startDate);
      const currentYear = today.getFullYear();
      const anniversary = new Date(currentYear, start.getMonth(), start.getDate());
      const diff = Math.ceil((anniversary.getTime() - todayTime) / dayMs);

      if (diff >= 0 && diff <= daysThreshold) {
        const years = currentYear - start.getFullYear();
        upcoming.push({
          id: `anniversary-${currentYear}`,
          title: `${years}周年纪念日`,
          icon: '💕',
          daysLeft: diff,
        });
      }
    }

    // Custom milestones
    for (const ms of milestones) {
      const msDate = new Date(ms.date);
      const thisYear = new Date(today.getFullYear(), msDate.getMonth(), msDate.getDate());
      const diff = Math.ceil((thisYear.getTime() - todayTime) / dayMs);

      if (diff >= 0 && diff <= daysThreshold) {
        upcoming.push({
          id: `milestone-${ms.id}-${today.getFullYear()}`,
          title: ms.title,
          icon: ms.icon || '💝',
          daysLeft: diff,
        });
      }
    }

    // Show notifications for new upcoming events
    for (const event of upcoming) {
      if (notifiedRef.current.has(event.id)) continue;
      notifiedRef.current.add(event.id);

      const body =
        event.daysLeft === 0
          ? '就是今天！🎉'
          : `还有 ${event.daysLeft} 天`;

      new Notification(`${event.icon} ${event.title}`, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💕</text></svg>',
        tag: event.id,
      });
    }
  }, [startDate, milestones, daysThreshold]);
}
