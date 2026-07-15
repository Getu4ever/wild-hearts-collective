import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { restoreGiftCardBalance } from "@/lib/gift-card-service";
import { getMemberSession } from "@/lib/member-auth";

/**
 * Cancels a pending class-pack checkout and restores any gift-card balance
 * that was reserved when checkout started.
 */
export async function POST(request: Request) {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let purchaseId = "";

  try {
    const body = await request.json();
    purchaseId = typeof body.purchaseId === "string" ? body.purchaseId : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!purchaseId) {
    return NextResponse.json({ error: "Purchase ID is required." }, { status: 400 });
  }

  const purchase = await db.classPackPurchase.findFirst({
    where: {
      id: purchaseId,
      userId: session.userId,
      status: "pending",
    },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Pending purchase not found." }, { status: 404 });
  }

  if (purchase.giftCardId && purchase.giftAmountApplied && purchase.giftAmountApplied > 0) {
    await restoreGiftCardBalance(purchase.giftCardId, purchase.giftAmountApplied, {
      packPurchaseId: purchase.id,
      userId: session.userId,
    });
  }

  await db.classPackPurchase.delete({ where: { id: purchase.id } });

  return NextResponse.json({ cancelled: true });
}
