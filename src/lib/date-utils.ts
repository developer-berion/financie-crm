import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';

export type DashboardDateRange = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month';

export function getDashboardDateRange(range: DashboardDateRange) {
  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);

  switch (range) {
    case 'today':
      start = startOfDay(now);
      break;
    case 'yesterday':
      const yesterday = subDays(now, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case 'this_week':
      // Monday to Sunday as per PM plan
      start = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'this_month':
      start = startOfMonth(now);
      break;
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    default:
      start = startOfMonth(now);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
