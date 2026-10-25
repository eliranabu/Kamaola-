import { useEffect, useState } from 'react';

/** Milliseconds until just after the next local midnight (never less than 1s). */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Current date that stays correct in a long-lived (PWA) session: it refreshes at local
 * midnight and whenever the app becomes visible/focused again. The Date identity only
 * changes when the calendar day changes, so downstream memoization is preserved.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setNow((prev) => (isSameLocalDay(prev, new Date()) ? prev : new Date()));
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refresh();
        arm();
      }, msUntilNextMidnight(new Date()));
    };
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        arm();
      }
    };

    arm();
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
    };
  }, []);

  return now;
}
