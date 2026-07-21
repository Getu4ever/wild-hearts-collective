import { db } from "@/lib/db";
import {
  formatMoneyFromPence,
  getEnvClassPaymentAmountPence,
} from "@/lib/booking-config";
import { getEnvMonthlyMembershipPricePence } from "@/lib/membership-config";
import { seedClassPacks } from "@/lib/seed-database";

export const STUDIO_SETTING_KEYS = {
  dropInPricePence: "drop_in_price_pence",
  membershipPricePence: "membership_price_pence",
} as const;

export type AdminClassPack = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  pricePence: number;
  priceLabel: string;
  validDays: number;
  active: boolean;
  sortOrder: number;
};

export type AdminClassPackInput = {
  name: string;
  slug?: string;
  description?: string | null;
  credits: number;
  pricePence: number;
  validDays: number;
  active?: boolean;
  sortOrder?: number;
};

export type StudioPricingSettings = {
  dropInPricePence: number;
  dropInPriceLabel: string;
  dropInSource: "database" | "env";
  membershipPricePence: number;
  membershipPriceLabel: string;
  membershipSource: "database" | "env";
};

function parsePositiveInt(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function slugifyPackName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function readSettingPence(key: string) {
  try {
    const row = await db.studioSetting.findUnique({ where: { key } });
    return parsePositiveInt(row?.value);
  } catch (error) {
    console.error(`[studio-pricing] failed to read ${key}:`, error);
    return null;
  }
}

export async function resolveClassPaymentAmountPence() {
  const fromDb = await readSettingPence(STUDIO_SETTING_KEYS.dropInPricePence);
  return fromDb ?? getEnvClassPaymentAmountPence();
}

export async function resolveMonthlyMembershipPricePence() {
  const fromDb = await readSettingPence(STUDIO_SETTING_KEYS.membershipPricePence);
  return fromDb ?? getEnvMonthlyMembershipPricePence();
}

export async function getStudioPricingSettings(): Promise<StudioPricingSettings> {
  const [dropInFromDb, membershipFromDb] = await Promise.all([
    readSettingPence(STUDIO_SETTING_KEYS.dropInPricePence),
    readSettingPence(STUDIO_SETTING_KEYS.membershipPricePence),
  ]);

  const dropInPricePence = dropInFromDb ?? getEnvClassPaymentAmountPence();
  const membershipPricePence =
    membershipFromDb ?? getEnvMonthlyMembershipPricePence();

  return {
    dropInPricePence,
    dropInPriceLabel: formatMoneyFromPence(dropInPricePence),
    dropInSource: dropInFromDb != null ? "database" : "env",
    membershipPricePence,
    membershipPriceLabel: formatMoneyFromPence(membershipPricePence),
    membershipSource: membershipFromDb != null ? "database" : "env",
  };
}

export async function updateStudioPricingSettings(input: {
  dropInPricePence: number;
  membershipPricePence: number;
}) {
  if (!Number.isFinite(input.dropInPricePence) || input.dropInPricePence <= 0) {
    throw new Error("Drop-in class price must be greater than zero.");
  }
  if (
    !Number.isFinite(input.membershipPricePence) ||
    input.membershipPricePence <= 0
  ) {
    throw new Error("Membership price must be greater than zero.");
  }

  const dropIn = Math.round(input.dropInPricePence);
  const membership = Math.round(input.membershipPricePence);

  await Promise.all([
    db.studioSetting.upsert({
      where: { key: STUDIO_SETTING_KEYS.dropInPricePence },
      create: {
        key: STUDIO_SETTING_KEYS.dropInPricePence,
        value: String(dropIn),
      },
      update: { value: String(dropIn) },
    }),
    db.studioSetting.upsert({
      where: { key: STUDIO_SETTING_KEYS.membershipPricePence },
      create: {
        key: STUDIO_SETTING_KEYS.membershipPricePence,
        value: String(membership),
      },
      update: { value: String(membership) },
    }),
  ]);

  return getStudioPricingSettings();
}

function mapPack(pack: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  pricePence: number;
  validDays: number;
  active: boolean;
  sortOrder: number;
}): AdminClassPack {
  return {
    id: pack.id,
    slug: pack.slug,
    name: pack.name,
    description: pack.description,
    credits: pack.credits,
    pricePence: pack.pricePence,
    priceLabel: formatMoneyFromPence(pack.pricePence),
    validDays: pack.validDays,
    active: pack.active,
    sortOrder: pack.sortOrder,
  };
}

export async function listAdminClassPacks() {
  await seedClassPacks(db);
  const packs = await db.classPack.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return packs.map(mapPack);
}

function validatePackInput(input: AdminClassPackInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Pack name is required.");

  const credits = Math.round(input.credits);
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new Error("Credits must be at least 1.");
  }

  const pricePence = Math.round(input.pricePence);
  if (!Number.isFinite(pricePence) || pricePence <= 0) {
    throw new Error("Pack price must be greater than zero.");
  }

  const validDays = Math.round(input.validDays);
  if (!Number.isFinite(validDays) || validDays <= 0) {
    throw new Error("Validity must be at least 1 day.");
  }

  const slug = (input.slug?.trim() || slugifyPackName(name)).toLowerCase();
  if (!slug) throw new Error("Pack slug is required.");

  return {
    name,
    slug,
    description: input.description?.trim() || null,
    credits,
    pricePence,
    validDays,
    active: input.active ?? true,
    sortOrder: Math.max(0, Math.round(input.sortOrder ?? 0)),
  };
}

export async function createAdminClassPack(input: AdminClassPackInput) {
  const data = validatePackInput(input);
  const existing = await db.classPack.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new Error("A pack with that slug already exists.");
  }

  const pack = await db.classPack.create({ data });
  return mapPack(pack);
}

export async function updateAdminClassPack(
  id: string,
  input: Partial<AdminClassPackInput>,
) {
  const existing = await db.classPack.findUnique({ where: { id } });
  if (!existing) throw new Error("Class pack not found.");

  const merged = validatePackInput({
    name: input.name ?? existing.name,
    slug: input.slug ?? existing.slug,
    description:
      input.description !== undefined ? input.description : existing.description,
    credits: input.credits ?? existing.credits,
    pricePence: input.pricePence ?? existing.pricePence,
    validDays: input.validDays ?? existing.validDays,
    active: input.active ?? existing.active,
    sortOrder: input.sortOrder ?? existing.sortOrder,
  });

  if (merged.slug !== existing.slug) {
    const clash = await db.classPack.findUnique({ where: { slug: merged.slug } });
    if (clash) throw new Error("A pack with that slug already exists.");
  }

  const pack = await db.classPack.update({
    where: { id },
    data: merged,
  });
  return mapPack(pack);
}
