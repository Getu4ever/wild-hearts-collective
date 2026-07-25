import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { getPurchasableShopProduct, validateCheckoutStock } from "@/lib/shop-catalog-service";
import {
  isShopFulfillmentMethod,
  SHOP_FULFILLMENT_METHOD,
  sumBasketWeightGrams,
} from "@/lib/shop-shipping";
import { quoteShopDeliveryFee } from "@/lib/shop-shipping-service";
import { createShopCheckoutSession } from "@/lib/stripe";

type CheckoutBodyItem = {
  productId?: unknown;
  quantity?: unknown;
};

/**
 * Starts Stripe Checkout for any purchasable shop basket item.
 * Coming-soon products (isAvailable: false) are rejected server-side.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online payments are not configured yet. Please contact the studio." },
      { status: 503 },
    );
  }

  let body: {
    items?: CheckoutBodyItem[];
    productId?: unknown;
    fulfillmentMethod?: unknown;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Support legacy single-product payload and new multi-item basket payload.
  const rawItems: CheckoutBodyItem[] = Array.isArray(body.items)
    ? body.items
    : typeof body.productId === "string"
      ? [{ productId: body.productId, quantity: 1 }]
      : [];

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  const checkoutItems = [];

  for (const raw of rawItems) {
    const productId = typeof raw.productId === "string" ? raw.productId : "";
    const quantity =
      typeof raw.quantity === "number" && Number.isFinite(raw.quantity)
        ? Math.floor(raw.quantity)
        : 0;

    if (!productId || quantity < 1 || quantity > 20) {
      return NextResponse.json(
        { error: "Each basket item needs a valid product and quantity (1–20)." },
        { status: 400 },
      );
    }

    const product = await getPurchasableShopProduct(productId, quantity);
    if (!product) {
      return NextResponse.json(
        {
          error:
            "One or more items are not available for online purchase yet.",
        },
        { status: 400 },
      );
    }

    checkoutItems.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      image: product.image,
      pricePence: product.pricePence,
      description: product.description,
      quantity,
      digitalDelivery: product.digitalDelivery,
      weightGrams: product.weightGrams ?? null,
    });
  }

  const hasPhysical = checkoutItems.some((item) => !item.digitalDelivery);
  let fulfillmentMethod: "collection" | "delivery" | undefined;
  let shippingPence = 0;
  let totalWeightGrams = 0;

  if (hasPhysical) {
    fulfillmentMethod = isShopFulfillmentMethod(body.fulfillmentMethod)
      ? body.fulfillmentMethod
      : SHOP_FULFILLMENT_METHOD.collection;

    if (fulfillmentMethod === SHOP_FULFILLMENT_METHOD.delivery) {
      totalWeightGrams = sumBasketWeightGrams(checkoutItems);
      try {
        const quote = await quoteShopDeliveryFee(totalWeightGrams);
        shippingPence = quote.feePence;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to calculate delivery.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
  }

  try {
    await validateCheckoutStock(
      checkoutItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );

    const checkout = await createShopCheckoutSession(checkoutItems, {
      fulfillmentMethod,
      shippingPence,
      totalWeightGrams,
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 503 });
    }

    return NextResponse.json({
      url: checkout.url,
      sessionId: checkout.id,
      fulfillmentMethod: fulfillmentMethod ?? null,
      shippingPence,
      totalWeightGrams,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
