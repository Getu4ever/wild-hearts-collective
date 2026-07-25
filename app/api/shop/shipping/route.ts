import { NextResponse } from "next/server";
import { sumBasketWeightGrams } from "@/lib/shop-shipping";
import {
  getShopShippingBands,
  quoteShopDeliveryFee,
} from "@/lib/shop-shipping-service";

/**
 * Public shipping quote helper for the shop basket.
 * GET returns bands; POST quotes a fee from product weights × quantities.
 */
export async function GET() {
  const bands = await getShopShippingBands();
  return NextResponse.json({ bands });
}

export async function POST(request: Request) {
  let body: {
    totalWeightGrams?: unknown;
    items?: Array<{
      digitalDelivery?: unknown;
      weightGrams?: unknown;
      quantity?: unknown;
    }>;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let totalWeightGrams =
    typeof body.totalWeightGrams === "number" && Number.isFinite(body.totalWeightGrams)
      ? Math.max(0, Math.round(body.totalWeightGrams))
      : null;

  if (totalWeightGrams == null && Array.isArray(body.items)) {
    totalWeightGrams = sumBasketWeightGrams(
      body.items.map((item) => ({
        digitalDelivery: Boolean(item.digitalDelivery),
        weightGrams:
          typeof item.weightGrams === "number" && Number.isFinite(item.weightGrams)
            ? item.weightGrams
            : null,
        quantity:
          typeof item.quantity === "number" && Number.isFinite(item.quantity)
            ? Math.max(0, Math.floor(item.quantity))
            : 0,
      })),
    );
  }

  if (totalWeightGrams == null) {
    return NextResponse.json(
      { error: "Provide totalWeightGrams or basket items." },
      { status: 400 },
    );
  }

  try {
    const quote = await quoteShopDeliveryFee(totalWeightGrams);
    return NextResponse.json(quote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to calculate delivery.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
