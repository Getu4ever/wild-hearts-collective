import {
  BIRTHDAY_VOUCHER_VALID_DAYS,
  INACTIVITY_DAYS,
  MILESTONE_THRESHOLDS,
} from "@/lib/booking-advanced-config";
import { db } from "@/lib/db";

const SETTING_KEYS = {
  winback: "winback_emails_active",
  birthday: "birthday_emails_active",
  milestone: "milestone_emails_active",
  /** Legacy single-value keys — read only for migration into steps. */
  inactivityDays: "winback_inactivity_days",
  discountPercent: "winback_discount_percent",
  steps: "winback_steps",
  birthdayDiscountPercent: "birthday_discount_percent",
  birthdayValidDays: "birthday_valid_days",
  milestoneSteps: "milestone_steps",
} as const;

/** Default discount when migrating a single legacy day setting with no %. */
export const DEFAULT_WINBACK_DISCOUNT_PERCENT = 20;

const MIN_INACTIVITY_DAYS = 1;
const MAX_INACTIVITY_DAYS = 365;
const MIN_DISCOUNT_PERCENT = 1;
const MAX_DISCOUNT_PERCENT = 100;
const MIN_VALID_DAYS = 1;
const MAX_VALID_DAYS = 365;
const MIN_MILESTONE_CLASSES = 1;
const MAX_MILESTONE_CLASSES = 9999;
const MAX_WINBACK_STEPS = 10;
const MAX_MILESTONE_STEPS = 10;

export type WinbackStep = {
  days: number;
  discountPercent: number;
};

export type MilestoneStep = {
  classes: number;
  discountPercent: number;
  validDays: number;
};

export type RewardCampaignSettings = {
  winbackEnabled: boolean;
  birthdayEnabled: boolean;
  milestoneEnabled: boolean;
  /** Ordered by days ascending. */
  winbackSteps: WinbackStep[];
  birthdayDiscountPercent: number;
  birthdayValidDays: number;
  /** Ordered by classes ascending. */
  milestoneSteps: MilestoneStep[];
};

/** Default ladder if nothing is saved yet. */
export const DEFAULT_WINBACK_STEPS: WinbackStep[] = [
  { days: 30, discountPercent: 20 },
  { days: 60, discountPercent: 25 },
  { days: 90, discountPercent: 30 },
];

export const DEFAULT_BIRTHDAY_DISCOUNT_PERCENT = 100;
export const DEFAULT_BIRTHDAY_VALID_DAYS = BIRTHDAY_VOUCHER_VALID_DAYS;

export const DEFAULT_MILESTONE_STEPS: MilestoneStep[] = MILESTONE_THRESHOLDS.map(
  (classes) => ({
    classes,
    discountPercent: 100,
    validDays: 60,
  }),
);

function parseBooleanSetting(value: string | null | undefined, defaultValue: boolean) {
  if (value == null || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
}

function parsePositiveInt(
  value: string | null | undefined,
  defaultValue: number,
  min: number,
  max: number,
) {
  if (value == null || value === "") return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return defaultValue;
  return parsed;
}

async function readFlag(key: string, defaultValue: boolean) {
  try {
    const row = await db.studioSetting.findUnique({ where: { key } });
    return parseBooleanSetting(row?.value, defaultValue);
  } catch (error) {
    console.error(`[rewards] failed to read ${key}:`, error);
    return defaultValue;
  }
}

async function readRawSetting(key: string) {
  try {
    const row = await db.studioSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch (error) {
    console.error(`[rewards] failed to read ${key}:`, error);
    return null;
  }
}

export function validateWinbackInactivityDays(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < MIN_INACTIVITY_DAYS ||
    parsed > MAX_INACTIVITY_DAYS
  ) {
    throw new Error(
      `Inactivity days must be a whole number between ${MIN_INACTIVITY_DAYS} and ${MAX_INACTIVITY_DAYS}.`,
    );
  }
  return parsed;
}

export function validateWinbackDiscountPercent(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < MIN_DISCOUNT_PERCENT ||
    parsed > MAX_DISCOUNT_PERCENT
  ) {
    throw new Error(
      `Discount percent must be a whole number between ${MIN_DISCOUNT_PERCENT} and ${MAX_DISCOUNT_PERCENT}.`,
    );
  }
  return parsed;
}

export function validateRewardValidDays(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < MIN_VALID_DAYS ||
    parsed > MAX_VALID_DAYS
  ) {
    throw new Error(
      `Valid days must be a whole number between ${MIN_VALID_DAYS} and ${MAX_VALID_DAYS}.`,
    );
  }
  return parsed;
}

export function validateMilestoneClasses(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < MIN_MILESTONE_CLASSES ||
    parsed > MAX_MILESTONE_CLASSES
  ) {
    throw new Error(
      `Class count must be a whole number between ${MIN_MILESTONE_CLASSES} and ${MAX_MILESTONE_CLASSES}.`,
    );
  }
  return parsed;
}

export function normalizeWinbackSteps(input: unknown): WinbackStep[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("Add at least one win-back step (days + discount %).");
  }
  if (input.length > MAX_WINBACK_STEPS) {
    throw new Error(`You can have at most ${MAX_WINBACK_STEPS} win-back steps.`);
  }

  const steps = input.map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`Win-back step ${index + 1} is invalid.`);
    }
    const row = raw as { days?: unknown; discountPercent?: unknown };
    return {
      days: validateWinbackInactivityDays(row.days),
      discountPercent: validateWinbackDiscountPercent(row.discountPercent),
    };
  });

  const daysSeen = new Set<number>();
  for (const step of steps) {
    if (daysSeen.has(step.days)) {
      throw new Error(
        `Two steps use ${step.days} days. Each step needs a different day count.`,
      );
    }
    daysSeen.add(step.days);
  }

  return [...steps].sort((a, b) => a.days - b.days);
}

export function normalizeMilestoneSteps(input: unknown): MilestoneStep[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("Add at least one milestone (classes + discount % + valid days).");
  }
  if (input.length > MAX_MILESTONE_STEPS) {
    throw new Error(`You can have at most ${MAX_MILESTONE_STEPS} milestone steps.`);
  }

  const steps = input.map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`Milestone step ${index + 1} is invalid.`);
    }
    const row = raw as {
      classes?: unknown;
      discountPercent?: unknown;
      validDays?: unknown;
    };
    return {
      classes: validateMilestoneClasses(row.classes),
      discountPercent: validateWinbackDiscountPercent(row.discountPercent),
      validDays: validateRewardValidDays(row.validDays),
    };
  });

  const classesSeen = new Set<number>();
  for (const step of steps) {
    if (classesSeen.has(step.classes)) {
      throw new Error(
        `Two milestones use ${step.classes} classes. Each step needs a different class count.`,
      );
    }
    classesSeen.add(step.classes);
  }

  return [...steps].sort((a, b) => a.classes - b.classes);
}

function parseWinbackStepsJson(value: string | null): WinbackStep[] | null {
  if (value == null || value === "") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return normalizeWinbackSteps(parsed);
  } catch {
    return null;
  }
}

function parseMilestoneStepsJson(value: string | null): MilestoneStep[] | null {
  if (value == null || value === "") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return normalizeMilestoneSteps(parsed);
  } catch {
    return null;
  }
}

async function loadWinbackSteps(): Promise<WinbackStep[]> {
  const stepsJson = await readRawSetting(SETTING_KEYS.steps);
  const fromJson = parseWinbackStepsJson(stepsJson);
  if (fromJson) return fromJson;

  const [legacyDaysRaw, legacyPercentRaw] = await Promise.all([
    readRawSetting(SETTING_KEYS.inactivityDays),
    readRawSetting(SETTING_KEYS.discountPercent),
  ]);

  if (legacyDaysRaw != null || legacyPercentRaw != null) {
    const days = parsePositiveInt(
      legacyDaysRaw,
      INACTIVITY_DAYS,
      MIN_INACTIVITY_DAYS,
      MAX_INACTIVITY_DAYS,
    );
    const discountPercent = parsePositiveInt(
      legacyPercentRaw,
      DEFAULT_WINBACK_DISCOUNT_PERCENT,
      MIN_DISCOUNT_PERCENT,
      MAX_DISCOUNT_PERCENT,
    );
    return [{ days, discountPercent }];
  }

  return [...DEFAULT_WINBACK_STEPS];
}

async function loadMilestoneSteps(): Promise<MilestoneStep[]> {
  const stepsJson = await readRawSetting(SETTING_KEYS.milestoneSteps);
  const fromJson = parseMilestoneStepsJson(stepsJson);
  if (fromJson) return fromJson;
  return [...DEFAULT_MILESTONE_STEPS];
}

export async function getRewardCampaignSettings(): Promise<RewardCampaignSettings> {
  const [
    winbackEnabled,
    birthdayEnabled,
    milestoneEnabled,
    winbackSteps,
    birthdayDiscountRaw,
    birthdayValidDaysRaw,
    milestoneSteps,
  ] = await Promise.all([
    readFlag(SETTING_KEYS.winback, true),
    readFlag(SETTING_KEYS.birthday, true),
    readFlag(SETTING_KEYS.milestone, true),
    loadWinbackSteps(),
    readRawSetting(SETTING_KEYS.birthdayDiscountPercent),
    readRawSetting(SETTING_KEYS.birthdayValidDays),
    loadMilestoneSteps(),
  ]);

  return {
    winbackEnabled,
    birthdayEnabled,
    milestoneEnabled,
    winbackSteps,
    birthdayDiscountPercent: parsePositiveInt(
      birthdayDiscountRaw,
      DEFAULT_BIRTHDAY_DISCOUNT_PERCENT,
      MIN_DISCOUNT_PERCENT,
      MAX_DISCOUNT_PERCENT,
    ),
    birthdayValidDays: parsePositiveInt(
      birthdayValidDaysRaw,
      DEFAULT_BIRTHDAY_VALID_DAYS,
      MIN_VALID_DAYS,
      MAX_VALID_DAYS,
    ),
    milestoneSteps,
  };
}

export async function updateRewardCampaignSettings(input: {
  winbackEnabled?: boolean;
  birthdayEnabled?: boolean;
  milestoneEnabled?: boolean;
  winbackSteps?: WinbackStep[];
  birthdayDiscountPercent?: number;
  birthdayValidDays?: number;
  milestoneSteps?: MilestoneStep[];
}) {
  const updates: Array<{ key: string; value: string }> = [];

  if (typeof input.winbackEnabled === "boolean") {
    updates.push({ key: SETTING_KEYS.winback, value: String(input.winbackEnabled) });
  }
  if (typeof input.birthdayEnabled === "boolean") {
    updates.push({ key: SETTING_KEYS.birthday, value: String(input.birthdayEnabled) });
  }
  if (typeof input.milestoneEnabled === "boolean") {
    updates.push({
      key: SETTING_KEYS.milestone,
      value: String(input.milestoneEnabled),
    });
  }
  if (input.winbackSteps !== undefined) {
    const normalized = normalizeWinbackSteps(input.winbackSteps);
    updates.push({
      key: SETTING_KEYS.steps,
      value: JSON.stringify(normalized),
    });
  }
  if (input.birthdayDiscountPercent !== undefined) {
    updates.push({
      key: SETTING_KEYS.birthdayDiscountPercent,
      value: String(validateWinbackDiscountPercent(input.birthdayDiscountPercent)),
    });
  }
  if (input.birthdayValidDays !== undefined) {
    updates.push({
      key: SETTING_KEYS.birthdayValidDays,
      value: String(validateRewardValidDays(input.birthdayValidDays)),
    });
  }
  if (input.milestoneSteps !== undefined) {
    const normalized = normalizeMilestoneSteps(input.milestoneSteps);
    updates.push({
      key: SETTING_KEYS.milestoneSteps,
      value: JSON.stringify(normalized),
    });
  }

  if (updates.length === 0) {
    throw new Error("No reward campaign settings to update.");
  }

  await Promise.all(
    updates.map((item) =>
      db.studioSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value },
        update: { value: item.value },
      }),
    ),
  );

  return getRewardCampaignSettings();
}
