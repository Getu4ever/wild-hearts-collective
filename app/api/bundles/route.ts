import { NextResponse } from "next/server";
import { listActiveClassPacks } from "@/lib/studio-pricing-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  const packs = await listActiveClassPacks();

  return NextResponse.json(
    packs.map((pack) => ({
      id: pack.id,
      slug: pack.slug,
      name: pack.name,
      description: pack.description,
      credits: pack.credits,
      priceLabel: pack.priceLabel,
      pricePence: pack.pricePence,
      validDays: pack.validDays,
    })),
    { headers: NO_STORE_HEADERS },
  );
}
