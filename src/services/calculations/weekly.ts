/** Weekly pack-goal progress (Israeli week: Sunday-Saturday). */

import { Purchase, WeeklyGoalStats } from '../../types/index.ts';

/**
 * Calculates current week's spending and progress against a weekly pack target.
 * Week starts on Sunday (standard Israeli week).
 */
export function calculateWeeklyStats(
  purchases: Purchase[],
  referenceDate: Date = new Date(),
  weeklyPackGoal: number = 0
): WeeklyGoalStats {
  if (!weeklyPackGoal || weeklyPackGoal <= 0) {
    return {
      hasGoal: false,
      weeklyPackGoal: 0,
      currentWeekPacks: 0,
      currentWeekSpent: 0,
      percentUsed: 0,
      status: 'on_track',
      statusMessage: 'הגדירו יעד חפיסות שבועי כדי לעקוב אחר ההתקדמות'
    };
  }

  // Calculate start of current week (Sunday 00:00:00)
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;

  const weekPurchases = purchases.filter((p) => {
    if (!p.date) return false;
    return p.date >= startOfWeekStr;
  });

  const currentWeekPacks = weekPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const currentWeekSpent = weekPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const percentUsed = Math.round((currentWeekPacks / weeklyPackGoal) * 100);

  let status: 'on_track' | 'near_limit' | 'exceeded' = 'on_track';
  let statusMessage = '';

  if (currentWeekPacks > weeklyPackGoal) {
    status = 'exceeded';
    const over = currentWeekPacks - weeklyPackGoal;
    statusMessage = `חריגה עדינה של ${over} ${over === 1 ? 'חפיסה' : 'חפיסות'} מהיעד השבועי — אפשר לאזן בשבוע הבא!`;
  } else if (currentWeekPacks === weeklyPackGoal) {
    status = 'near_limit';
    statusMessage = `הגעת בדיוק ליעד השבועי (${weeklyPackGoal} חפיסות) — הישג מעולה!`;
  } else {
    status = 'on_track';
    const remaining = weeklyPackGoal - currentWeekPacks;
    statusMessage = `נרכשו ${currentWeekPacks} מתוך ${weeklyPackGoal} חפיסות (נותרו עוד ${remaining} לפי היעד)`;
  }

  return {
    hasGoal: true,
    weeklyPackGoal,
    currentWeekPacks,
    currentWeekSpent: Math.round(currentWeekSpent * 100) / 100,
    percentUsed,
    status,
    statusMessage
  };
}
