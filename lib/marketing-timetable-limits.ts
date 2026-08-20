/** First seven rows are the weekly homepage poster overlays. */
export const WEEKLY_TIMETABLE_DAY_COUNT = 7;

/**
 * Max class rows that fit cleanly inside each poster day card
 * (Mon–Sun). Extra weekly rows appear beneath the poster instead of overflowing.
 */
export const TIMETABLE_CLASS_LIMITS = [4, 4, 4, 3, 2, 2, 2] as const;

export function maxClassesForTimetableDay(dayIndex: number) {
  if (dayIndex < 0 || dayIndex >= TIMETABLE_CLASS_LIMITS.length) {
    return Number.POSITIVE_INFINITY;
  }
  return TIMETABLE_CLASS_LIMITS[dayIndex];
}
