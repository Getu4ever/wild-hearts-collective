import { db } from "@/lib/db";
import {
  DEFAULT_SHOP_SHIPPING_BANDS,
  normalizeShippingBands,
  parseShippingBandsJson,
  shippingFeeForWeightGrams,
  type ShopShippingBand,
} from "@/lib/shop-shipping";

export const SHOP_SHIPPING_BANDS_KEY = "shop_shipping_bands";

export async function getShopShippingBands(): Promise<ShopShippingBand[]> {
  try {
    const row = await db.studioSetting.findUnique({
      where: { key: SHOP_SHIPPING_BANDS_KEY },
    });
    return (
      parseShippingBandsJson(row?.value) ?? [...DEFAULT_SHOP_SHIPPING_BANDS]
    );
  } catch (error) {
    console.error("[shop-shipping] failed to read bands:", error);
    return [...DEFAULT_SHOP_SHIPPING_BANDS];
  }
}

export async function saveShopShippingBands(bands: ShopShippingBand[]) {
  const normalized = normalizeShippingBands(bands);
  if (normalized.length === 0) {
    throw new Error("Add at least one shipping weight band.");
  }

  await db.studioSetting.upsert({
    where: { key: SHOP_SHIPPING_BANDS_KEY },
    create: {
      key: SHOP_SHIPPING_BANDS_KEY,
      value: JSON.stringify(normalized),
    },
    update: {
      value: JSON.stringify(normalized),
    },
  });

  return normalized;
}

export async function quoteShopDeliveryFee(totalWeightGrams: number) {
  const bands = await getShopShippingBands();
  const feePence = shippingFeeForWeightGrams(totalWeightGrams, bands);
  if (feePence == null) {
    throw new Error(
      "This basket is too heavy for the shipping rates currently set. Please choose Collect from studio, or contact us.",
    );
  }
  return { bands, feePence, totalWeightGrams };
}
