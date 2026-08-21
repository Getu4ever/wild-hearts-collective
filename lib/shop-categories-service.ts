/**
 * Shop categories — editable in Admin → Shop → Categories.
 * Stored as JSON in StudioSetting key `shop_categories`. Seeds from
 * DEFAULT_SHOP_CATEGORIES when the key is empty.
 */

import { db } from "@/lib/db";
import {
  DEFAULT_SHOP_CATEGORIES,
  shopCategoryListFromRecord,
  slugifyCategoryId,
  type ShopCategory,
  type ShopCategoryId,
  type ShopCategoryRecord,
} from "@/lib/shop-data";

export const SHOP_CATEGORIES_SETTING_KEY = "shop_categories";

function cloneDefaults(): ShopCategoryRecord {
  return Object.fromEntries(
    Object.entries(DEFAULT_SHOP_CATEGORIES).map(([id, category]) => [
      id,
      { ...category },
    ]),
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCategory(raw: unknown): ShopCategory | null {
  if (!isPlainObject(raw)) return null;

  const id =
    typeof raw.id === "string" ? slugifyCategoryId(raw.id) : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!id || !label) return null;

  const shortLabel =
    typeof raw.shortLabel === "string" && raw.shortLabel.trim()
      ? raw.shortLabel.trim()
      : label;
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";

  return { id, label, shortLabel, description };
}

export function parseShopCategoriesJson(
  raw: string | null | undefined,
): ShopCategoryRecord | null {
  if (!raw?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const record: ShopCategoryRecord = {};
      for (const item of parsed) {
        const category = parseCategory(item);
        if (category) record[category.id] = category;
      }
      return Object.keys(record).length > 0 ? record : null;
    }
    if (!isPlainObject(parsed)) return null;

    const record: ShopCategoryRecord = {};
    for (const [key, value] of Object.entries(parsed)) {
      const category = parseCategory(
        isPlainObject(value) ? { ...value, id: value.id ?? key } : null,
      );
      if (category) record[category.id] = category;
    }
    return Object.keys(record).length > 0 ? record : null;
  } catch {
    return null;
  }
}

export function normalizeShopCategories(raw: unknown): ShopCategory[] {
  const list: ShopCategory[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const category = parseCategory(item);
      if (!category) {
        throw new Error("Each category needs an id and label.");
      }
      if (list.some((existing) => existing.id === category.id)) {
        throw new Error(`Duplicate category id “${category.id}”.`);
      }
      list.push(category);
    }
  } else if (isPlainObject(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      const category = parseCategory(
        isPlainObject(value) ? { ...value, id: value.id ?? key } : null,
      );
      if (!category) {
        throw new Error("Each category needs an id and label.");
      }
      if (list.some((existing) => existing.id === category.id)) {
        throw new Error(`Duplicate category id “${category.id}”.`);
      }
      list.push(category);
    }
  } else {
    throw new Error("Categories payload must be a list or object.");
  }

  if (list.length === 0) {
    throw new Error("Add at least one shop category.");
  }

  return list;
}

function toRecord(categories: ShopCategory[]): ShopCategoryRecord {
  return Object.fromEntries(categories.map((category) => [category.id, category]));
}

async function readStoredCategories(): Promise<ShopCategoryRecord | null> {
  try {
    const row = await db.studioSetting.findUnique({
      where: { key: SHOP_CATEGORIES_SETTING_KEY },
    });
    return parseShopCategoriesJson(row?.value);
  } catch (error) {
    console.error("[shop-categories] failed to read categories:", error);
    return null;
  }
}

export async function getShopCategories(): Promise<ShopCategory[]> {
  const stored = await readStoredCategories();
  if (stored) return shopCategoryListFromRecord(stored);
  return shopCategoryListFromRecord(cloneDefaults());
}

export async function getShopCategoryRecord(): Promise<ShopCategoryRecord> {
  const stored = await readStoredCategories();
  return stored ?? cloneDefaults();
}

export async function getShopCategoryById(
  id: string,
): Promise<ShopCategory | null> {
  const record = await getShopCategoryRecord();
  return record[id] ?? null;
}

export async function assertValidShopCategory(id: string): Promise<ShopCategoryId> {
  const category = await getShopCategoryById(id);
  if (!category) {
    throw new Error("Choose a valid category.");
  }
  return category.id;
}

export async function getOrSeedShopCategories(): Promise<{
  categories: ShopCategory[];
  source: "database" | "default";
}> {
  const stored = await readStoredCategories();
  if (stored) {
    return {
      categories: shopCategoryListFromRecord(stored),
      source: "database",
    };
  }

  const categories = shopCategoryListFromRecord(cloneDefaults());
  try {
    await db.studioSetting.upsert({
      where: { key: SHOP_CATEGORIES_SETTING_KEY },
      create: {
        key: SHOP_CATEGORIES_SETTING_KEY,
        value: JSON.stringify(categories),
      },
      update: { value: JSON.stringify(categories) },
    });
    return { categories, source: "database" };
  } catch (error) {
    console.error("[shop-categories] failed to seed categories:", error);
    return { categories, source: "default" };
  }
}

export async function saveShopCategories(raw: unknown): Promise<ShopCategory[]> {
  const categories = normalizeShopCategories(raw);

  await db.studioSetting.upsert({
    where: { key: SHOP_CATEGORIES_SETTING_KEY },
    create: {
      key: SHOP_CATEGORIES_SETTING_KEY,
      value: JSON.stringify(categories),
    },
    update: { value: JSON.stringify(categories) },
  });

  return categories;
}

export async function countProductsInCategory(categoryId: string) {
  try {
    if (!("shopProduct" in db) || !db.shopProduct) return 0;
    return db.shopProduct.count({
      where: { category: categoryId, isArchived: false },
    });
  } catch {
    return 0;
  }
}

export function categoryLabelFromRecord(
  record: ShopCategoryRecord,
  categoryId: string | null | undefined,
  fallback = "Shop",
) {
  if (!categoryId) return fallback;
  return record[categoryId]?.label ?? categoryId;
}

export function categoryShortLabelFromRecord(
  record: ShopCategoryRecord,
  categoryId: string | null | undefined,
  fallback = "Shop",
) {
  if (!categoryId) return fallback;
  return record[categoryId]?.shortLabel ?? categoryId;
}

export { toRecord as shopCategoriesToRecord };
