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

export type StockStatus = "unlimited" | "in_stock" | "low" | "out";

export function getProductStockStatus(product: {
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
}): StockStatus {
  if (!product.trackStock) return "unlimited";
  if (product.stockQuantity <= 0) return "out";
  if (product.stockQuantity <= product.lowStockThreshold) return "low";
  return "in_stock";
}

export function stockStatusLabel(status: StockStatus) {
  switch (status) {
    case "unlimited":
      return "Unlimited";
    case "in_stock":
      return "In stock";
    case "low":
      return "Low stock";
    case "out":
      return "Out of stock";
  }
}

export function productHasStock(product: {
  trackStock: boolean;
  stockQuantity: number;
  isAvailable: boolean;
  isArchived?: boolean;
}) {
  if (product.isArchived || !product.isAvailable) return false;
  if (!product.trackStock) return true;
  return product.stockQuantity > 0;
}

export function productCanFulfillQuantity(
  product: {
    trackStock: boolean;
    stockQuantity: number;
    isAvailable: boolean;
    isArchived?: boolean;
  },
  quantity: number,
) {
  if (!productHasStock(product)) return false;
  if (!product.trackStock) return true;
  return product.stockQuantity >= quantity;
}

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
  trackStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
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
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}): ShopProduct & {
  isArchived: boolean;
  sortOrder: number;
  updatedAt: string;
  stockStatus: StockStatus;
  stockStatusLabel: string;
  unitsSold: number;
} {
  const stockStatus = getProductStockStatus(record);
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
    trackStock: record.trackStock,
    stockQuantity: record.stockQuantity,
    lowStockThreshold: record.lowStockThreshold,
    createdAt: record.createdAt.toISOString(),
    isArchived: record.isArchived,
    sortOrder: record.sortOrder,
    updatedAt: record.updatedAt.toISOString(),
    stockStatus,
    stockStatusLabel: stockStatusLabel(stockStatus),
    unitsSold: 0,
  };
}

async function attachUnitsSold<T extends { id: string; unitsSold: number }>(
  products: T[],
): Promise<T[]> {
  if (products.length === 0) return products;

  const sold = await db.shopOrderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((product) => product.id) } },
    _sum: { quantity: true },
  });

  const soldByProductId = new Map(
    sold
      .filter((row) => row.productId)
      .map((row) => [row.productId!, row._sum.quantity ?? 0]),
  );

  return products.map((product) => ({
    ...product,
    unitsSold: soldByProductId.get(product.id) ?? 0,
  }));
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
  if (input.trackStock) {
    if (
      input.stockQuantity != null &&
      (!Number.isFinite(input.stockQuantity) || input.stockQuantity < 0)
    ) {
      throw new Error("Stock quantity cannot be negative.");
    }
    if (
      input.lowStockThreshold != null &&
      (!Number.isFinite(input.lowStockThreshold) || input.lowStockThreshold < 0)
    ) {
      throw new Error("Low stock threshold cannot be negative.");
    }
  }
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
        trackStock: !product.digitalDelivery,
        stockQuantity: product.digitalDelivery ? 0 : 0,
        lowStockThreshold: 5,
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
  return attachUnitsSold(records.map((record) => mapShopProduct(record)));
}

export async function getAdminShopInventoryOverview() {
  const products = await listAdminShopProducts({ includeArchived: true });
  const tracked = products.filter((product) => product.trackStock && !product.isArchived);

  return {
    summary: {
      trackedProducts: tracked.length,
      totalUnitsInStock: tracked.reduce((sum, product) => sum + product.stockQuantity, 0),
      lowStockCount: tracked.filter((product) => product.stockStatus === "low").length,
      outOfStockCount: tracked.filter((product) => product.stockStatus === "out").length,
      unitsSold: products.reduce((sum, product) => sum + product.unitsSold, 0),
    },
    products: products
      .filter((product) => !product.isArchived)
      .sort((a, b) => {
        const rank = (status: StockStatus) => {
          if (status === "out") return 0;
          if (status === "low") return 1;
          if (status === "in_stock") return 2;
          return 3;
        };
        const diff = rank(a.stockStatus) - rank(b.stockStatus);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      }),
  };
}

export async function getShopProductById(id: string) {
  const record = await shopProductClient().findUnique({ where: { id } });
  return record ? mapShopProduct(record) : null;
}

export async function getPurchasableShopProduct(id: string, quantity = 1) {
  const product = await getShopProductById(id);
  if (!product || product.isArchived || !product.isAvailable) return null;
  if (!productCanFulfillQuantity(product, quantity)) return null;
  return product;
}

export async function validateCheckoutStock(
  items: Array<{ productId: string; quantity: number }>,
) {
  for (const item of items) {
    const product = await getShopProductById(item.productId);
    if (!product || !product.isAvailable || product.isArchived) {
      throw new Error("One or more items are not available for online purchase yet.");
    }
    if (!productCanFulfillQuantity(product, item.quantity)) {
      throw new Error(
        product.trackStock
          ? `Not enough stock for ${product.name}. Only ${product.stockQuantity} left.`
          : `Unable to purchase ${product.name} right now.`,
      );
    }
  }
}

export async function decrementProductStock(
  productId: string,
  quantity: number,
  tx: Prisma.TransactionClient = db,
) {
  if (quantity <= 0) return;

  const product = await tx.shopProduct.findUnique({ where: { id: productId } });
  if (!product?.trackStock) return;

  const updated = await tx.shopProduct.updateMany({
    where: {
      id: productId,
      trackStock: true,
      stockQuantity: { gte: quantity },
    },
    data: { stockQuantity: { decrement: quantity } },
  });

  if (updated.count !== 1) {
    throw new Error(`Not enough stock remaining for ${product.name}.`);
  }
}

export async function createAdminShopProduct(input: AdminShopProductInput) {
  validateProductInput(input);
  const baseSlug = slugifyProductName(input.slug?.trim() || input.name);
  const slug = await ensureUniqueSlug(baseSlug);
  const maxSort = await shopProductClient().aggregate({ _max: { sortOrder: true } });

  const trackStock = input.trackStock ?? !input.digitalDelivery;
  const stockQuantity = trackStock
    ? Math.max(0, Math.round(input.stockQuantity ?? 0))
    : 0;
  const lowStockThreshold = Math.max(
    0,
    Math.round(input.lowStockThreshold ?? 5),
  );

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
      trackStock,
      stockQuantity,
      lowStockThreshold,
    },
  });

  return attachUnitsSold([mapShopProduct(record)]).then(([product]) => product);
}

export async function updateAdminShopProduct(
  id: string,
  input: Partial<AdminShopProductInput> & { isArchived?: boolean },
) {
  const existing = await shopProductClient().findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found.");

  const nextName = input.name?.trim() ?? existing.name;
  const nextCategory = (input.category ?? existing.category) as ShopCategoryId;

  const nextDigital = input.digitalDelivery ?? existing.digitalDelivery;
  const nextTrackStock = input.trackStock ?? existing.trackStock;
  const nextStockQuantity =
    input.stockQuantity != null
      ? Math.max(0, Math.round(input.stockQuantity))
      : existing.stockQuantity;
  const nextLowStockThreshold =
    input.lowStockThreshold != null
      ? Math.max(0, Math.round(input.lowStockThreshold))
      : existing.lowStockThreshold;

  validateProductInput({
    name: nextName,
    description: input.description ?? existing.description,
    category: nextCategory,
    pricePence: input.pricePence ?? existing.pricePence,
    isAvailable: input.isAvailable ?? existing.isAvailable,
    digitalDelivery: nextDigital,
    image: input.image ?? existing.image,
    imageGradient: input.imageGradient ?? existing.imageGradient,
    variants:
      input.variants === undefined
        ? parseVariants(existing.variants ?? null)
        : input.variants ?? undefined,
    trackStock: nextTrackStock,
    stockQuantity: nextStockQuantity,
    lowStockThreshold: nextLowStockThreshold,
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
      digitalDelivery: nextDigital,
      image: (input.image ?? existing.image).trim(),
      imageGradient:
        input.imageGradient?.trim() ?? existing.imageGradient,
      variants:
        input.variants === undefined
          ? undefined
          : input.variants ?? PrismaNamespace.JsonNull,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isArchived: input.isArchived ?? existing.isArchived,
      trackStock: nextTrackStock,
      stockQuantity: nextTrackStock ? nextStockQuantity : 0,
      lowStockThreshold: nextLowStockThreshold,
    },
  });

  return attachUnitsSold([mapShopProduct(record)]).then(([product]) => product);
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
