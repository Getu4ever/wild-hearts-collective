import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const SHOP_ORDER_STATUS = {
  paid: "paid",
  fulfilled: "fulfilled",
  refunded: "refunded",
} as const;

export const SHOP_ORDER_SOURCE = {
  voucher: "shop_voucher",
  product: "shop_product",
} as const;

export const SHOP_FULFILLMENT_TYPE = {
  giftCard: "gift_card",
  physical: "physical",
  digital: "digital",
} as const;

type Tx = Prisma.TransactionClient;

export type ShopOrderLineInput = {
  productId?: string | null;
  productName: string;
  productSlug?: string | null;
  category?: string | null;
  quantity: number;
  unitPricePence: number;
  fulfillmentType?: string;
  giftCardId?: string | null;
};

/**
 * Idempotent: if this Stripe session already has a ShopOrder, return it.
 * Used for gift vouchers today; physical / other catalog sales later.
 */
export async function recordShopOrder(
  input: {
    stripeSessionId: string;
    sourceType?: string;
    status?: string;
    purchaserEmail?: string | null;
    purchaserName?: string | null;
    totalPence: number;
    currency?: string;
    items: ShopOrderLineInput[];
  },
  tx: Tx = db,
) {
  const existing = await tx.shopOrder.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
    include: { items: true },
  });

  if (existing) return existing;

  return tx.shopOrder.create({
    data: {
      stripeSessionId: input.stripeSessionId,
      sourceType: input.sourceType ?? SHOP_ORDER_SOURCE.voucher,
      status: input.status ?? SHOP_ORDER_STATUS.fulfilled,
      purchaserEmail: input.purchaserEmail?.trim().toLowerCase() || null,
      purchaserName: input.purchaserName?.trim() || null,
      totalPence: input.totalPence,
      currency: input.currency ?? "gbp",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId ?? null,
          productName: item.productName,
          productSlug: item.productSlug ?? null,
          category: item.category ?? null,
          quantity: item.quantity,
          unitPricePence: item.unitPricePence,
          lineTotalPence: item.unitPricePence * item.quantity,
          fulfillmentType: item.fulfillmentType ?? SHOP_FULFILLMENT_TYPE.giftCard,
          giftCardId: item.giftCardId ?? null,
        })),
      },
    },
    include: { items: true },
  });
}
