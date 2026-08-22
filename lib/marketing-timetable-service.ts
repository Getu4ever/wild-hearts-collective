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
export const MARKETING_TIMETABLE_VISIBLE_KEY = "marketing_timetable_visible";

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
  const days = parseTimetableDays(raw, true);
  const weekly = days.slice(0, 7);
  const emptyWeekdays = weekly.filter((day) => day.classes.length === 0);
  if (weekly.length > 0 && emptyWeekdays.length === weekly.length) {
    throw new Error(
      "The weekly timetable cannot be saved with no classes. Add class rows for each day, or restore the defaults.",
    );
  }
  if (emptyWeekdays.length > 0) {
    throw new Error(
      `Add at least one class for: ${emptyWeekdays.map((day) => day.day).join(", ")}. Empty weekdays hide the schedule on the homepage.`,
    );
  }
  return days;
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
 * Public homepage timetable. Uses the exact admin-saved grid when present.
 * Falls back to site-data defaults only when nothing has been saved yet.
 */
export async function getMarketingTimetable(): Promise<TimetableDay[]> {
  const stored = await readStoredTimetable();
  if (!stored) return cloneDefaultTimetable();
  return stored;
}

export async function getMarketingTimetableVisibility(): Promise<boolean> {
  try {
    const row = await db.studioSetting.findUnique({
      where: { key: MARKETING_TIMETABLE_VISIBLE_KEY },
    });
    if (!row?.value?.trim()) return true;
    return row.value.trim().toLowerCase() !== "false";
  } catch (error) {
    console.error("[marketing-timetable] failed to read visibility:", error);
    return true;
  }
}

export async function setMarketingTimetableVisibility(visible: boolean) {
  await db.studioSetting.upsert({
    where: { key: MARKETING_TIMETABLE_VISIBLE_KEY },
    create: {
      key: MARKETING_TIMETABLE_VISIBLE_KEY,
      value: visible ? "true" : "false",
    },
    update: { value: visible ? "true" : "false" },
  });
  return visible;
}

/**
 * Admin load: return DB timetable, seeding from site-data defaults only when
 * the setting key is missing. Never overwrite an existing saved timetable.
 */
export async function getOrSeedMarketingTimetable(): Promise<{
  days: TimetableDay[];
  source: "database" | "default";
  visible: boolean;
}> {
  const visible = await getMarketingTimetableVisibility();
  const stored = await readStoredTimetable();
  if (stored) {
    return { days: stored, source: "database", visible };
  }

  const days = cloneDefaultTimetable();
  try {
    await db.studioSetting.upsert({
      where: { key: MARKETING_TIMETABLE_SETTING_KEY },
      create: {
        key: MARKETING_TIMETABLE_SETTING_KEY,
        value: JSON.stringify(days),
      },
      update: {},
    });
    return { days, source: "database", visible };
  } catch (error) {
    console.error("[marketing-timetable] failed to seed timetable:", error);
    return { days, source: "default", visible };
  }
}

export async function updateMarketingTimetable(raw: unknown): Promise<{
  days: TimetableDay[];
  source: "database";
  visible: boolean;
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

  const visible = await getMarketingTimetableVisibility();
  return { days, source: "database", visible };
}
