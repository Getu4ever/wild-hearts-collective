/** Used when a physical product has no weight set yet. */
export const DEFAULT_PHYSICAL_WEIGHT_GRAMS = 250;

export const SHOP_FULFILLMENT_METHOD = {
  collection: "collection",
  delivery: "delivery",
} as const;

export type ShopFulfillmentMethod =
  (typeof SHOP_FULFILLMENT_METHOD)[keyof typeof SHOP_FULFILLMENT_METHOD];

export type ShopShippingBand = {
  /** Inclusive upper bound for this band (grams). */
  maxWeightGrams: number;
  /** Delivery fee in pence for baskets at or under this weight. */
  feePence: number;
};

/**
 * Starter UK parcel bands — illustrative starting points for the studio to edit.
 * Not live Royal Mail rates; update in Admin → Shop → Shipping.
 */
export const DEFAULT_SHOP_SHIPPING_BANDS: ShopShippingBand[] = [
  { maxWeightGrams: 100, feePence: 165 },
  { maxWeightGrams: 250, feePence: 220 },
  { maxWeightGrams: 500, feePence: 300 },
  { maxWeightGrams: 750, feePence: 350 },
  { maxWeightGrams: 1000, feePence: 420 },
  { maxWeightGrams: 2000, feePence: 550 },
  { maxWeightGrams: 5000, feePence: 890 },
  { maxWeightGrams: 10000, feePence: 1290 },
  { maxWeightGrams: 20000, feePence: 1890 },
];

export function isShopFulfillmentMethod(
  value: unknown,
): value is ShopFulfillmentMethod {
  return (
    value === SHOP_FULFILLMENT_METHOD.collection ||
    value === SHOP_FULFILLMENT_METHOD.delivery
  );
}

export function normalizeShippingBands(
  bands: ShopShippingBand[],
): ShopShippingBand[] {
  return [...bands]
    .filter(
      (band) =>
        Number.isFinite(band.maxWeightGrams) &&
        band.maxWeightGrams > 0 &&
        Number.isFinite(band.feePence) &&
        band.feePence >= 0,
    )
    .map((band) => ({
      maxWeightGrams: Math.round(band.maxWeightGrams),
      feePence: Math.round(band.feePence),
    }))
    .sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
}

export function parseShippingBandsJson(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const bands = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const maxWeightGrams =
          typeof record.maxWeightGrams === "number"
            ? record.maxWeightGrams
            : Number.parseInt(String(record.maxWeightGrams ?? ""), 10);
        const feePence =
          typeof record.feePence === "number"
            ? record.feePence
            : Number.parseInt(String(record.feePence ?? ""), 10);
        if (!Number.isFinite(maxWeightGrams) || !Number.isFinite(feePence)) {
          return null;
        }
        return { maxWeightGrams, feePence };
      })
      .filter((band): band is ShopShippingBand => band !== null);

    const normalized = normalizeShippingBands(bands);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

export function effectiveProductWeightGrams(product: {
  digitalDelivery: boolean;
  weightGrams?: number | null;
}) {
  if (product.digitalDelivery) return 0;
  if (
    product.weightGrams != null &&
    Number.isFinite(product.weightGrams) &&
    product.weightGrams > 0
  ) {
    return Math.round(product.weightGrams);
  }
  return DEFAULT_PHYSICAL_WEIGHT_GRAMS;
}

export function sumBasketWeightGrams(
  lines: Array<{
    quantity: number;
    digitalDelivery: boolean;
    weightGrams?: number | null;
  }>,
) {
  return lines.reduce((sum, line) => {
    if (line.digitalDelivery) return sum;
    return sum + effectiveProductWeightGrams(line) * Math.max(0, line.quantity);
  }, 0);
}

/**
 * One parcel fee from total basket weight (option A).
 * Returns null if weight exceeds the heaviest configured band.
 */
export function shippingFeeForWeightGrams(
  totalWeightGrams: number,
  bands: ShopShippingBand[] = DEFAULT_SHOP_SHIPPING_BANDS,
): number | null {
  if (totalWeightGrams <= 0) return 0;
  const sorted = normalizeShippingBands(bands);
  for (const band of sorted) {
    if (totalWeightGrams <= band.maxWeightGrams) {
      return band.feePence;
    }
  }
  return null;
}
