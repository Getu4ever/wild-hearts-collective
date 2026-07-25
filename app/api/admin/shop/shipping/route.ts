import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import type { ShopShippingBand } from "@/lib/shop-shipping";
import {
  getShopShippingBands,
  saveShopShippingBands,
} from "@/lib/shop-shipping-service";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const bands = await getShopShippingBands();
  return NextResponse.json({ bands });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const rawBands = Array.isArray(body.bands) ? body.bands : [];

    const bands: ShopShippingBand[] = rawBands.map(
      (band: {
        maxWeightGrams?: unknown;
        feePence?: unknown;
        feePounds?: unknown;
      }) => {
        const maxWeightGrams =
          typeof band.maxWeightGrams === "number"
            ? band.maxWeightGrams
            : Number.parseInt(String(band.maxWeightGrams ?? ""), 10);
        let feePence =
          typeof band.feePence === "number"
            ? band.feePence
            : Number.parseInt(String(band.feePence ?? ""), 10);
        if (!Number.isFinite(feePence) && band.feePounds != null) {
          const pounds =
            typeof band.feePounds === "number"
              ? band.feePounds
              : Number.parseFloat(String(band.feePounds));
          feePence = Math.round(pounds * 100);
        }
        return { maxWeightGrams, feePence };
      },
    );

    const saved = await saveShopShippingBands(bands);
    return NextResponse.json({ bands: saved });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save shipping bands.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
