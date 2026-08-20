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
} as const;

export type RewardCampaignSettings = {
  winbackEnabled: boolean;
  birthdayEnabled: boolean;
  milestoneEnabled: boolean;
  inactivityDays: number;
  birthdayValidDays: number;
  milestoneThresholds: readonly number[];
};

function parseBooleanSetting(value: string | null | undefined, defaultValue: boolean) {
  if (value == null || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
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

export async function getRewardCampaignSettings(): Promise<RewardCampaignSettings> {
  const [winbackEnabled, birthdayEnabled, milestoneEnabled] = await Promise.all([
    readFlag(SETTING_KEYS.winback, true),
    readFlag(SETTING_KEYS.birthday, true),
    readFlag(SETTING_KEYS.milestone, true),
  ]);

  return {
    winbackEnabled,
    birthdayEnabled,
    milestoneEnabled,
    inactivityDays: INACTIVITY_DAYS,
    birthdayValidDays: BIRTHDAY_VOUCHER_VALID_DAYS,
    milestoneThresholds: MILESTONE_THRESHOLDS,
  };
}

export async function updateRewardCampaignSettings(input: {
  winbackEnabled?: boolean;
  birthdayEnabled?: boolean;
  milestoneEnabled?: boolean;
}) {
  const updates: Array<{ key: string; value: boolean }> = [];
  if (typeof input.winbackEnabled === "boolean") {
    updates.push({ key: SETTING_KEYS.winback, value: input.winbackEnabled });
  }
  if (typeof input.birthdayEnabled === "boolean") {
    updates.push({ key: SETTING_KEYS.birthday, value: input.birthdayEnabled });
  }
  if (typeof input.milestoneEnabled === "boolean") {
    updates.push({ key: SETTING_KEYS.milestone, value: input.milestoneEnabled });
  }

  await Promise.all(
    updates.map((item) =>
      db.studioSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: String(item.value) },
        update: { value: String(item.value) },
      }),
    ),
  );

  return getRewardCampaignSettings();
}
