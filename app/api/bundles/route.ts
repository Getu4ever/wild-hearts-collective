import { NextResponse } from "next/server";
import { formatMoneyFromPence } from "@/lib/booking-config";
import { db } from "@/lib/db";

export async function GET() {
  const packs = await db.classPack.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    packs.map((pack) => ({
      id: pack.id,
      slug: pack.slug,
      name: pack.name,
      description: pack.description,
      credits: pack.credits,
      priceLabel: formatMoneyFromPence(pack.pricePence),
      pricePence: pack.pricePence,
      validDays: pack.validDays,
    })),
  );
}
