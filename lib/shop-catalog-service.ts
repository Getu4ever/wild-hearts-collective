import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { db } from "@/lib/db";
import {
  productsData,
  SHOP_CATEGORIES,
  slugifyProductName,
  type ShopCategoryId,
  type ShopProduct,
} from "@/lib/shop-data";

export type ShopProductVariants = {
  sizes?: string[];
  colours?: string[];
};

export type AdminShopProductInput = {
  name: string;
  slug?: string;
  description: string;
  category: ShopCategoryId;
  pricePence: number;
  isAvailable: boolean;
  digitalDelivery: boolean;
  image: string;
  imageGradient?: string;
  variants?: ShopProductVariants | null;
  sortOrder?: number;
};

function parseVariants(value: Prisma.JsonValue | null): ShopProductVariants | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const sizes = Array.isArray(record.sizes)
    ? record.sizes.filter((item): item is string => typeof item === "string")
    : undefined;
  const colours = Array.isArray(record.colours)
    ? record.colours.filter((item): item is string => typeof item === "string")
    : undefined;
  if (!sizes?.length && !colours?.length) return undefined;
  return { sizes, colours };
}

export function mapShopProduct(record: {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  isAvailable: boolean;
  digitalDelivery: boolean;
  image: string;
  imageGradient: string;
  variants: Prisma.JsonValue | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ShopProduct & { isArchived: boolean; sortOrder: number; updatedAt: string } {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    category: record.category as ShopCategoryId,
    pricePence: record.pricePence,
    isAvailable: record.isAvailable,
    digitalDelivery: record.digitalDelivery,
    image: record.image,
    imageGradient: record.imageGradient,
    variants: parseVariants(record.variants),
    createdAt: record.createdAt.toISOString(),
    isArchived: record.isArchived,
    sortOrder: record.sortOrder,
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string) {
  let slug = baseSlug || "product";
  let suffix = 1;

  while (true) {
    const existing = await shopProductClient().findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

function validateProductInput(input: AdminShopProductInput) {
  if (!input.name.trim()) throw new Error("Product name is required.");
  if (!input.description.trim()) throw new Error("Description is required.");
  if (!(input.category in SHOP_CATEGORIES)) throw new Error("Choose a valid category.");
  if (!Number.isFinite(input.pricePence) || input.pricePence < 0) {
    throw new Error("Price must be zero or greater.");
  }
  if (!input.image.trim()) throw new Error("Product image path is required.");
}

function shopProductClient() {
  if (!("shopProduct" in db) || !db.shopProduct) {
    throw new Error(
      "Shop catalog is not ready. Run `npx prisma generate && npm run db:sync`, then restart the dev server.",
    );
  }
  return db.shopProduct;
}

export async function seedShopProductsIfEmpty() {
  const count = await shopProductClient().count();
  if (count > 0) return { seeded: false, count };

  for (const [index, product] of productsData.entries()) {
    await shopProductClient().create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        pricePence: product.pricePence,
        isAvailable: product.isAvailable,
        digitalDelivery: product.digitalDelivery,
        image: product.image,
        imageGradient: product.imageGradient,
        variants: product.variants ?? undefined,
        sortOrder: index,
        createdAt: new Date(product.createdAt),
      },
    });
  }

  return { seeded: true, count: productsData.length };
}

export async function listStorefrontShopProducts() {
  await seedShopProductsIfEmpty();
  const records = await shopProductClient().findMany({
    where: { isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return records.map((record) => mapShopProduct(record));
}

export async function listAdminShopProducts(options?: {
  includeArchived?: boolean;
}) {
  await seedShopProductsIfEmpty();
  const records = await shopProductClient().findMany({
    where: options?.includeArchived ? undefined : { isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return records.map((record) => mapShopProduct(record));
}

export async function getShopProductById(id: string) {
  const record = await shopProductClient().findUnique({ where: { id } });
  return record ? mapShopProduct(record) : null;
}

export async function getPurchasableShopProduct(id: string) {
  const product = await getShopProductById(id);
  if (!product || product.isArchived || !product.isAvailable) return null;
  return product;
}

export async function createAdminShopProduct(input: AdminShopProductInput) {
  validateProductInput(input);
  const baseSlug = slugifyProductName(input.slug?.trim() || input.name);
  const slug = await ensureUniqueSlug(baseSlug);
  const maxSort = await shopProductClient().aggregate({ _max: { sortOrder: true } });

  const record = await shopProductClient().create({
    data: {
      slug,
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      pricePence: Math.round(input.pricePence),
      isAvailable: input.isAvailable,
      digitalDelivery: input.digitalDelivery,
      image: input.image.trim(),
      imageGradient: input.imageGradient?.trim() || "from-pink-soft via-cream to-sage-light",
      variants: input.variants ?? undefined,
      sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  return mapShopProduct(record);
}

export async function updateAdminShopProduct(
  id: string,
  input: Partial<AdminShopProductInput> & { isArchived?: boolean },
) {
  const existing = await shopProductClient().findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found.");

  const nextName = input.name?.trim() ?? existing.name;
  const nextCategory = (input.category ?? existing.category) as ShopCategoryId;

  validateProductInput({
    name: nextName,
    description: input.description ?? existing.description,
    category: nextCategory,
    pricePence: input.pricePence ?? existing.pricePence,
    isAvailable: input.isAvailable ?? existing.isAvailable,
    digitalDelivery: input.digitalDelivery ?? existing.digitalDelivery,
    image: input.image ?? existing.image,
    imageGradient: input.imageGradient ?? existing.imageGradient,
    variants:
      input.variants === undefined
        ? parseVariants(existing.variants ?? null)
        : input.variants ?? undefined,
  });

  let slug = existing.slug;
  if (input.slug?.trim()) {
    slug = await ensureUniqueSlug(slugifyProductName(input.slug), id);
  }

  const record = await shopProductClient().update({
    where: { id },
    data: {
      slug,
      name: nextName,
      description: (input.description ?? existing.description).trim(),
      category: nextCategory,
      pricePence:
        input.pricePence != null ? Math.round(input.pricePence) : existing.pricePence,
      isAvailable: input.isAvailable ?? existing.isAvailable,
      digitalDelivery: input.digitalDelivery ?? existing.digitalDelivery,
      image: (input.image ?? existing.image).trim(),
      imageGradient:
        input.imageGradient?.trim() ?? existing.imageGradient,
      variants:
        input.variants === undefined
          ? undefined
          : input.variants ?? PrismaNamespace.JsonNull,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isArchived: input.isArchived ?? existing.isArchived,
    },
  });

  return mapShopProduct(record);
}

export async function archiveAdminShopProduct(id: string) {
  return updateAdminShopProduct(id, { isArchived: true, isAvailable: false });
}

export async function restoreAdminShopProduct(id: string) {
  return updateAdminShopProduct(id, { isArchived: false });
}

export async function deleteAdminShopProduct(id: string) {
  const existing = await shopProductClient().findUnique({
    where: { id },
    include: { orderItems: { take: 1 } },
  });
  if (!existing) throw new Error("Product not found.");
  if (existing.orderItems.length > 0) {
    throw new Error(
      "This product has sales history. Archive it instead of deleting permanently.",
    );
  }
  await shopProductClient().delete({ where: { id } });
  return { deleted: true };
}
