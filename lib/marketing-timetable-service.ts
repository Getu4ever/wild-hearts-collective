/**
 * Marketing weekly timetable (homepage /#timetable) — NOT the live bookable
 * schedule. Live sessions are managed under Admin → Schedule.
 *
 * Stored as JSON in StudioSetting key `marketing_timetable`. Seeds from
 * `lib/site-data` timetable defaults when the key is empty.
 */

import { db } from "@/lib/db";
import {
  timetable as defaultTimetable,
  type TimetableClass,
  type TimetableDay,
} from "@/lib/site-data";
import { getClassTypeOption } from "@/lib/admin-studio-config";

export const MARKETING_TIMETABLE_SETTING_KEY = "marketing_timetable";

export type { TimetableClass, TimetableDay };

function cloneDefaultTimetable(): TimetableDay[] {
  return defaultTimetable.map((day) => ({
    day: day.day,
    classes: day.classes.map((item) => ({
      time: item.time,
      title: item.title,
      ...(item.note ? { note: item.note } : {}),
      ...(item.bookClassSlug ? { bookClassSlug: item.bookClassSlug } : {}),
    })),
  }));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseClass(raw: unknown, strictSlugs: boolean): TimetableClass | null {
  if (!isPlainObject(raw)) return null;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;

  const time = typeof raw.time === "string" ? raw.time.trim() : "";
  const note =
    typeof raw.note === "string" && raw.note.trim() ? raw.note.trim() : undefined;
  const bookClassSlugRaw =
    typeof raw.bookClassSlug === "string" ? raw.bookClassSlug.trim() : "";
  const bookClassSlug = bookClassSlugRaw || undefined;

  if (strictSlugs && bookClassSlug && !getClassTypeOption(bookClassSlug)) {
    throw new Error(
      `Unknown booking class slug “${bookClassSlug}”. Choose a class type or leave blank for general /book.`,
    );
  }

  return {
    time,
    title,
    ...(note ? { note } : {}),
    ...(bookClassSlug ? { bookClassSlug } : {}),
  };
}

function parseTimetableDays(raw: unknown, strictSlugs: boolean): TimetableDay[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Timetable must include at least one day.");
  }

  const days: TimetableDay[] = [];

  for (const entry of raw) {
    if (!isPlainObject(entry)) {
      throw new Error("Each timetable day must be an object.");
    }

    const dayName = typeof entry.day === "string" ? entry.day.trim() : "";
    if (!dayName) {
      throw new Error("Each day needs a name.");
    }

    if (!Array.isArray(entry.classes)) {
      throw new Error(`Day “${dayName}” is missing a classes list.`);
    }

    const classes: TimetableClass[] = [];
    for (const item of entry.classes) {
      const normalized = parseClass(item, strictSlugs);
      if (!normalized) {
        throw new Error(
          `Day “${dayName}” has a class row missing a title (time is optional).`,
        );
      }
      classes.push(normalized);
    }

    days.push({ day: dayName, classes });
  }

  return days;
}

/** Validate and normalize a timetable payload from admin save. */
export function normalizeMarketingTimetable(raw: unknown): TimetableDay[] {
  return parseTimetableDays(raw, true);
}

async function readStoredTimetable(): Promise<TimetableDay[] | null> {
  try {
    const row = await db.studioSetting.findUnique({
      where: { key: MARKETING_TIMETABLE_SETTING_KEY },
    });
    if (!row?.value?.trim()) return null;

    const parsed: unknown = JSON.parse(row.value);
    return parseTimetableDays(parsed, false);
  } catch (error) {
    console.error("[marketing-timetable] failed to read stored timetable:", error);
    return null;
  }
}

/**
 * Public homepage timetable. Uses DB when present; otherwise site-data defaults.
 * Never throws — falls back so the marketing page stays available.
 */
export async function getMarketingTimetable(): Promise<TimetableDay[]> {
  const stored = await readStoredTimetable();
  if (stored) return stored;
  return cloneDefaultTimetable();
}

/**
 * Admin load: return DB timetable, seeding from site-data defaults on first use.
 */
export async function getOrSeedMarketingTimetable(): Promise<{
  days: TimetableDay[];
  source: "database" | "default";
}> {
  const stored = await readStoredTimetable();
  if (stored) {
    return { days: stored, source: "database" };
  }

  const days = cloneDefaultTimetable();
  try {
    await db.studioSetting.upsert({
      where: { key: MARKETING_TIMETABLE_SETTING_KEY },
      create: {
        key: MARKETING_TIMETABLE_SETTING_KEY,
        value: JSON.stringify(days),
      },
      update: { value: JSON.stringify(days) },
    });
    return { days, source: "database" };
  } catch (error) {
    console.error("[marketing-timetable] failed to seed timetable:", error);
    return { days, source: "default" };
  }
}

export async function updateMarketingTimetable(raw: unknown): Promise<{
  days: TimetableDay[];
  source: "database";
}> {
  const days = normalizeMarketingTimetable(raw);

  await db.studioSetting.upsert({
    where: { key: MARKETING_TIMETABLE_SETTING_KEY },
    create: {
      key: MARKETING_TIMETABLE_SETTING_KEY,
      value: JSON.stringify(days),
    },
    update: { value: JSON.stringify(days) },
  });

  return { days, source: "database" };
}
