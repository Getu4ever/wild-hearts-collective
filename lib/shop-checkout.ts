import { randomBytes } from "crypto";
import type Stripe from "stripe";
import { formatMoneyFromPence, getAppBaseUrl } from "@/lib/booking-config";
import {
  sendShopGiftVoucherEmail,
  sendShopProductOrderEmail,
} from "@/lib/email";
import { generateGiftCardCode, issueGiftCard } from "@/lib/gift-card-service";
import { db } from "@/lib/db";
import {
  decrementProductStock,
  getShopProductById,
} from "@/lib/shop-catalog-service";
import { notifyAdminOfLowStockBatch } from "@/lib/shop-stock-notifications";
import {
  getShopFulfillmentType,
  isGiftVoucherProduct,
} from "@/lib/shop-data";
import {
  recordShopOrder,
  SHOP_FULFILLMENT_TYPE,
  SHOP_ORDER_SOURCE,
  SHOP_ORDER_STATUS,
} from "@/lib/shop-order-service";
import { getStripeClient } from "@/lib/stripe";

type CartMetaItem = {
  id: string;
  q: number;
  n?: string;
  /** 1 = digital gift voucher, 0 = physical catalog item */
  d?: number;
};

type FulfilledLine = {
  productName: string;
  giftCode?: string;
  priceLabel: string;
  quantity: number;
  balanceLabel?: string;
  /** Public path under the site, e.g. /shop/art-kit-class-bundle.svg */
  image?: string;
  productId?: string;
  giftCardId?: string;
  unitPricePence?: number;
  fulfillmentType: "gift_card" | "physical";
};

function parseCartMetadata(session: Stripe.Checkout.Session): CartMetaItem[] {
  if (session.metadata?.cart) {
    try {
      const parsed = JSON.parse(session.metadata.cart) as CartMetaItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to legacy single-product metadata
    }
  }

  if (session.metadata?.productId) {
    return [
      {
        id: session.metadata.productId,
        q: 1,
        n: session.metadata.productName,
        d: session.metadata.type === "shop_product" ? 0 : 1,
      },
    ];
  }

  return [];
}

import type { ShopProduct } from "@/lib/shop-data";

function resolveDigitalDelivery(
  item: CartMetaItem,
  product: ShopProduct | null,
) {
  if (typeof item.d === "number") return item.d === 1;
  if (product) return isGiftVoucherProduct(product);
  // Legacy carts without `d` were gift vouchers only.
  return true;
}

async function resolveCartProducts(cart: CartMetaItem[]) {
  return Promise.all(
    cart.map(async (item) => ({
      item,
      product: await getShopProductById(item.id),
    })),
  );
}

/**
 * After Stripe payment: record the shop order, issue gift cards when needed,
 * and email the customer. Idempotent via metadata.emailDelivered / ShopOrder.
 */
export async function fulfillShopVoucherCheckout(sessionInput: Stripe.Checkout.Session) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionInput.id);

  if (
    session.metadata?.type !== "shop_voucher" &&
    session.metadata?.type !== "shop_product"
  ) {
    return null;
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return null;
  }

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (session.metadata.emailDelivered === "true") {
    return loadAlreadyFulfilledResult(session, email);
  }

  const cart = parseCartMetadata(session);
  if (cart.length === 0) {
    throw new Error("Checkout session is missing basket details.");
  }

  if (!email) {
    throw new Error("Checkout session is missing a customer email.");
  }

  const name = session.customer_details?.name?.trim() || "Friend";
  const giftLines: FulfilledLine[] = [];
  const physicalLines: FulfilledLine[] = [];
  const orderItems: Array<{
    productId: string | null;
    productName: string;
    productSlug: string | null;
    category: string | null;
    quantity: number;
    unitPricePence: number;
    fulfillmentType: string;
    giftCardId: string | null;
  }> = [];

  const orderSourceType =
    session.metadata?.type === "shop_product"
      ? SHOP_ORDER_SOURCE.product
      : SHOP_ORDER_SOURCE.voucher;

  const resolvedCart = await resolveCartProducts(cart);
  const stockAlertInputs: Array<{
    productId: string;
    productName: string;
    previousStock: number;
    newStock: number;
    lowStockThreshold: number;
    trackStock: boolean;
  }> = [];

  await db.$transaction(async (tx) => {
    for (const { item, product } of resolvedCart) {
      const quantity = Math.max(1, Math.floor(item.q || 1));
      const productName = product?.name ?? item.n ?? "Shop item";
      const pricePence = product?.pricePence ?? 0;
      const digital = resolveDigitalDelivery(item, product);

      if (pricePence <= 0) {
        throw new Error(`Unable to fulfill ${productName}.`);
      }

      if (digital) {
        for (let i = 0; i < quantity; i += 1) {
          const giftCard = await issueGiftCard(
            {
              code: generateGiftCardCode(),
              balancePence: pricePence,
              productId: product?.id ?? item.id,
              productName,
              purchaserEmail: email,
              purchaserName: name,
              stripeSessionId: session.id,
            },
            tx,
          );

          const line: FulfilledLine = {
            productName,
            giftCode: giftCard.code,
            priceLabel: formatMoneyFromPence(pricePence),
            balanceLabel: formatMoneyFromPence(giftCard.balancePence),
            quantity: 1,
            image: product?.image,
            productId: product?.id ?? item.id,
            giftCardId: giftCard.id,
            unitPricePence: pricePence,
            fulfillmentType: "gift_card",
          };
          giftLines.push(line);
          orderItems.push({
            productId: product?.id ?? item.id,
            productName,
            productSlug: product?.slug ?? null,
            category: product?.category ?? "gift-vouchers",
            quantity: 1,
            unitPricePence: pricePence,
            fulfillmentType: SHOP_FULFILLMENT_TYPE.giftCard,
            giftCardId: giftCard.id,
          });
        }
      } else {
        const line: FulfilledLine = {
          productName,
          priceLabel: formatMoneyFromPence(pricePence * quantity),
          quantity,
          image: product?.image,
          productId: product?.id ?? item.id,
          unitPricePence: pricePence,
          fulfillmentType: "physical",
        };
        physicalLines.push(line);
        orderItems.push({
          productId: product?.id ?? item.id,
          productName,
          productSlug: product?.slug ?? null,
          category: product?.category ?? null,
          quantity,
          unitPricePence: pricePence,
          fulfillmentType:
            product != null
              ? getShopFulfillmentType(product) === "gift_card"
                ? SHOP_FULFILLMENT_TYPE.giftCard
                : SHOP_FULFILLMENT_TYPE.physical
              : SHOP_FULFILLMENT_TYPE.physical,
          giftCardId: null,
        });
      }
    }

    await recordShopOrder(
      {
        stripeSessionId: session.id,
        sourceType: orderSourceType,
        status: SHOP_ORDER_STATUS.fulfilled,
        purchaserEmail: email,
        purchaserName: name,
        totalPence:
          session.amount_total ??
          orderItems.reduce(
            (sum, line) => sum + line.unitPricePence * line.quantity,
            0,
          ),
        items: orderItems,
      },
      tx,
    );

    for (const { item, product } of resolvedCart) {
      if (!product?.trackStock || !product.id) continue;
      const quantity = Math.max(1, Math.floor(item.q || 1));
      const stockChange = await decrementProductStock(product.id, quantity, tx);
      if (stockChange) {
        stockAlertInputs.push(stockChange);
      }
    }
  });

  if (stockAlertInputs.length > 0) {
    void notifyAdminOfLowStockBatch(stockAlertInputs);
  }

  const totalLabel = formatMoneyFromPence(session.amount_total ?? 0);
  const summary = [...giftLines, ...physicalLines]
    .map((line) =>
      line.fulfillmentType === "gift_card"
        ? `1× ${line.productName}`
        : `${line.quantity}× ${line.productName}`,
    )
    .join(", ");

  const giftCodesPayload = JSON.stringify(
    giftLines.map((line) => ({
      productName: line.productName,
      giftCode: line.giftCode,
      priceLabel: line.priceLabel,
      quantity: line.quantity,
      balanceLabel: line.balanceLabel,
      image: line.image,
    })),
  ).slice(0, 500);

  await stripe.checkout.sessions.update(session.id, {
    metadata: {
      ...session.metadata,
      emailDelivered: "true",
      giftCode: giftLines[0]?.giftCode ?? "",
      giftCodes: giftCodesPayload,
      productName: summary.slice(0, 450),
    },
  });

  try {
    if (giftLines.length > 0) {
      await sendShopGiftVoucherEmail(
        { name, email },
        {
          lines: giftLines.map((line) => ({
            productName: line.productName,
            giftCode: line.giftCode!,
            priceLabel: line.priceLabel,
            quantity: line.quantity,
            balanceLabel: line.balanceLabel,
            image: line.image,
          })),
          totalLabel,
          shopUrl: `${getAppBaseUrl()}/shop`,
          bookUrl: `${getAppBaseUrl()}/book`,
          creditsUrl: `${getAppBaseUrl()}/account/credits`,
        },
      );
    }

    if (physicalLines.length > 0) {
      await sendShopProductOrderEmail(
        { name, email },
        {
          lines: physicalLines.map((line) => ({
            productName: line.productName,
            priceLabel: line.priceLabel,
            quantity: line.quantity,
            image: line.image,
          })),
          totalLabel,
          shopUrl: `${getAppBaseUrl()}/shop`,
          hasGiftVouchers: giftLines.length > 0,
        },
      );
    }
  } catch (error) {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        emailDelivered: "false",
        giftCode: giftLines[0]?.giftCode ?? "",
        giftCodes: giftCodesPayload,
      },
    });
    throw error;
  }

  return {
    alreadyDelivered: false as const,
    productName: summary,
    giftCode: giftLines[0]?.giftCode ?? null,
    lines: giftLines,
    physicalLines,
    email,
    hasGiftVouchers: giftLines.length > 0,
    hasPhysical: physicalLines.length > 0,
  };
}

async function loadAlreadyFulfilledResult(
  session: Stripe.Checkout.Session,
  email: string | null,
) {
  let giftLines: FulfilledLine[] = [];
  if (session.metadata?.giftCodes) {
    try {
      const parsed = JSON.parse(session.metadata.giftCodes) as Array<{
        productName: string;
        giftCode: string;
        priceLabel: string;
        quantity: number;
        balanceLabel?: string;
        image?: string;
      }>;
      giftLines = parsed.map((line) => ({
        ...line,
        fulfillmentType: "gift_card" as const,
      }));
    } catch {
      giftLines = [];
    }
  }

  if (giftLines.length === 0 && session.metadata?.giftCode) {
    giftLines = [
      {
        productName: session.metadata.productName ?? "Gift voucher",
        giftCode: session.metadata.giftCode,
        priceLabel: formatMoneyFromPence(session.amount_total ?? 0),
        quantity: 1,
        fulfillmentType: "gift_card",
      },
    ];
  }

  for (const line of giftLines) {
    if (!line.giftCode) continue;
    const code = line.giftCode.trim().toUpperCase();
    const existing = await db.giftCard.findUnique({ where: { code } });
    if (existing) continue;

    const parsedPence = Math.round(
      Number.parseFloat((line.priceLabel || "").replace(/[^0-9.]/g, "")) * 100,
    );
    const balancePence =
      Number.isFinite(parsedPence) && parsedPence > 0
        ? parsedPence
        : session.amount_total && giftLines.length === 1
          ? session.amount_total
          : 0;

    if (balancePence <= 0) continue;

    try {
      await issueGiftCard({
        code,
        balancePence,
        productName: line.productName || "Gift voucher",
        purchaserEmail: email,
        stripeSessionId: session.id,
      });
    } catch {
      // Unique conflicts / partial metadata — ignore
    }
  }

  const cards = await db.giftCard.findMany({
    where: { stripeSessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  if (cards.length > 0) {
    giftLines = cards.map((card) => ({
      productName: card.productName,
      giftCode: card.code,
      priceLabel: formatMoneyFromPence(card.initialBalancePence),
      balanceLabel: formatMoneyFromPence(card.balancePence),
      quantity: 1,
      productId: card.productId ?? undefined,
      giftCardId: card.id,
      unitPricePence: card.initialBalancePence,
      fulfillmentType: "gift_card" as const,
    }));
  }

  const existingOrder = await db.shopOrder.findUnique({
    where: { stripeSessionId: session.id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  let physicalLines: FulfilledLine[] =
    existingOrder?.items
      .filter((item) => item.fulfillmentType !== "gift_card")
      .map((item) => ({
        productName: item.productName,
        priceLabel: formatMoneyFromPence(item.lineTotalPence),
        quantity: item.quantity,
        productId: item.productId ?? undefined,
        unitPricePence: item.unitPricePence,
        fulfillmentType: "physical" as const,
      })) ?? [];

  if (!existingOrder && cards.length > 0) {
    const cardProducts = await Promise.all(
      cards.map(async (card) => ({
        card,
        product: card.productId ? await getShopProductById(card.productId) : null,
      })),
    );

    await recordShopOrder({
      stripeSessionId: session.id,
      sourceType:
        session.metadata?.type === "shop_product"
          ? SHOP_ORDER_SOURCE.product
          : SHOP_ORDER_SOURCE.voucher,
      status: SHOP_ORDER_STATUS.fulfilled,
      purchaserEmail: email,
      purchaserName: session.customer_details?.name,
      totalPence:
        session.amount_total ??
        cards.reduce((sum, card) => sum + card.initialBalancePence, 0),
      items: cardProducts.map(({ card, product }) => ({
        productId: card.productId,
        productName: card.productName,
        productSlug: product?.slug ?? null,
        category: product?.category ?? "gift-vouchers",
        quantity: 1,
        unitPricePence: card.initialBalancePence,
        fulfillmentType: SHOP_FULFILLMENT_TYPE.giftCard,
        giftCardId: card.id,
      })),
    });
  }

  if (!existingOrder && physicalLines.length === 0) {
    const cart = parseCartMetadata(session);
    const resolvedLegacyCart = await resolveCartProducts(cart);
    physicalLines = resolvedLegacyCart
      .filter(({ item, product }) => !resolveDigitalDelivery(item, product))
      .map(({ item, product }) => {
        const quantity = Math.max(1, Math.floor(item.q || 1));
        const pricePence = product?.pricePence ?? 0;
        return {
          productName: product?.name ?? item.n ?? "Shop item",
          priceLabel: formatMoneyFromPence(pricePence * quantity),
          quantity,
          productId: product?.id ?? item.id,
          unitPricePence: pricePence,
          fulfillmentType: "physical" as const,
          image: product?.image,
        };
      });
  }

  return {
    alreadyDelivered: true as const,
    productName: session.metadata?.productName ?? "Shop order",
    giftCode: giftLines[0]?.giftCode ?? session.metadata?.giftCode ?? null,
    lines: giftLines,
    physicalLines,
    email,
    hasGiftVouchers: giftLines.length > 0,
    hasPhysical: physicalLines.length > 0,
  };
}

export async function fulfillShopVoucherBySessionId(sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return fulfillShopVoucherCheckout(session);
}

/** @deprecated Prefer generateGiftCardCode from gift-card-service. */
export function generateGiftCode() {
  return `GIFT-${randomBytes(4).toString("hex").toUpperCase()}`;
}
