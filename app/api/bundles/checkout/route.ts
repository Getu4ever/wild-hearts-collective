import { NextResponse } from "next/server";
import { createPendingClassPackPurchase } from "@/lib/credit-service";
import { db } from "@/lib/db";
import { getMemberSession } from "@/lib/member-auth";
import { createClassPackCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ error: "Please sign in to purchase a class pack." }, { status: 401 });
  }

  let packId = "";

  try {
    const body = await request.json();
    packId = typeof body.packId === "string" ? body.packId : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!packId) {
    return NextResponse.json({ error: "Pack ID is required." }, { status: 400 });
  }

  try {
    const member = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member account not found." }, { status: 404 });
    }

    const pending = await createPendingClassPackPurchase(session.userId, packId);
    const checkout = await createClassPackCheckoutSession({
      purchaseId: pending.id,
      userId: session.userId,
      packId: pending.packId,
      email: member.email,
      name: member.name,
      packName: pending.pack.name,
      credits: pending.pack.credits,
      pricePence: pending.pack.pricePence,
    });

    if (!checkout.client_secret) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 503 });
    }

    return NextResponse.json({
      purchaseId: pending.id,
      clientSecret: checkout.client_secret,
      packName: pending.pack.name,
      credits: pending.pack.credits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
