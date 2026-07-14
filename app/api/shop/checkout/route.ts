import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { getPurchasableShopProduct } from "@/lib/shop-data";
import { createShopVoucherCheckoutSession } from "@/lib/stripe";

type CheckoutBodyItem = {
  productId?: unknown;
  quantity?: unknown;
};

/**
 * Starts Stripe Checkout for purchasable digital gift vouchers in the basket.
 * Physical / Coming soon categories are rejected server-side.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online payments are not configured yet. Please contact the studio." },
      { status: 503 },
    );
  }

  let body: { items?: CheckoutBodyItem[]; productId?: unknown } = {};

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

    const product = getPurchasableShopProduct(productId);
    if (!product) {
      return NextResponse.json(
        {
          error:
            "One or more items are not available for online purchase. Physical products are coming soon.",
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
    });
  }

  try {
    const checkout = await createShopVoucherCheckoutSession(checkoutItems);

    if (!checkout.url) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 503 });
    }

    return NextResponse.json({
      url: checkout.url,
      sessionId: checkout.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
