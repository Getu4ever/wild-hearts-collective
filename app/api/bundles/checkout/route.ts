import { NextResponse } from "next/server";
import { formatMoneyFromPence, isStripeConfigured } from "@/lib/booking-config";
import {
  createPendingClassPackPurchase,
  fulfillPendingClassPackPurchase,
} from "@/lib/credit-service";
import { db } from "@/lib/db";
import {
  applyGiftCodeToCharge,
  GIFT_REDEMPTION_REASON,
  restoreGiftCardBalance,
} from "@/lib/gift-card-service";
import { getMemberSession } from "@/lib/member-auth";
import { createClassPackCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ error: "Please sign in to purchase a class pack." }, { status: 401 });
  }

  let packId = "";
  let giftCode = "";

  try {
    const body = await request.json();
    packId = typeof body.packId === "string" ? body.packId : "";
    giftCode = typeof body.giftCode === "string" ? body.giftCode.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!packId) {
    return NextResponse.json({ error: "Pack ID is required." }, { status: 400 });
  }

  let pending: Awaited<ReturnType<typeof createPendingClassPackPurchase>> | null = null;
  let giftApplied: {
    giftCardId: string;
    appliedPence: number;
    balanceAfterLabel: string;
    appliedLabel: string;
    amountDuePence: number;
    fullyCovered: boolean;
  } | null = null;

  try {
    const member = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member account not found." }, { status: 404 });
    }

    pending = await createPendingClassPackPurchase(session.userId, packId);

    if (giftCode) {
      const applied = await applyGiftCodeToCharge(giftCode, pending.pack.pricePence, {
        reason: GIFT_REDEMPTION_REASON.classPack,
        packPurchaseId: pending.id,
        userId: session.userId,
      });

      giftApplied = {
        giftCardId: applied.giftCardId,
        appliedPence: applied.appliedPence,
        balanceAfterLabel: applied.balanceAfterLabel,
        appliedLabel: applied.appliedLabel,
        amountDuePence: applied.amountDuePence,
        fullyCovered: applied.fullyCovered,
      };

      await db.classPackPurchase.update({
        where: { id: pending.id },
        data: {
          giftCardId: applied.giftCardId,
          giftAmountApplied: applied.appliedPence,
        },
      });

      if (applied.fullyCovered) {
        const fulfilled = await fulfillPendingClassPackPurchase(pending.id);

        return NextResponse.json({
          purchaseId: pending.id,
          packName: pending.pack.name,
          credits: pending.pack.credits,
          paidWithGiftCard: true,
          giftAmountAppliedLabel: applied.appliedLabel,
          giftBalanceRemainingLabel: applied.balanceAfterLabel,
          balance: fulfilled?.balance ?? null,
        });
      }
    }

    if (!isStripeConfigured()) {
      if (giftApplied) {
        await restoreGiftCardBalance(giftApplied.giftCardId, giftApplied.appliedPence, {
          packPurchaseId: pending.id,
          userId: session.userId,
        });
        await db.classPackPurchase.delete({ where: { id: pending.id } });
      }
      return NextResponse.json(
        { error: "Online payments are not configured. Please contact the studio." },
        { status: 503 },
      );
    }

    const amountDue = giftApplied?.amountDuePence ?? pending.pack.pricePence;
    const checkout = await createClassPackCheckoutSession(
      {
        purchaseId: pending.id,
        userId: session.userId,
        packId: pending.packId,
        email: member.email,
        name: member.name,
        packName: pending.pack.name,
        credits: pending.pack.credits,
        pricePence: pending.pack.pricePence,
      },
      giftApplied
        ? {
            amountPence: amountDue,
            giftCardId: giftApplied.giftCardId,
            giftAmountApplied: giftApplied.appliedPence,
          }
        : undefined,
    );

    if (!checkout.client_secret) {
      if (giftApplied) {
        await restoreGiftCardBalance(giftApplied.giftCardId, giftApplied.appliedPence, {
          packPurchaseId: pending.id,
          userId: session.userId,
        });
      }
      await db.classPackPurchase.delete({ where: { id: pending.id } });
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 503 });
    }

    await db.classPackPurchase.update({
      where: { id: pending.id },
      data: { stripeSessionId: checkout.id },
    });

    return NextResponse.json({
      purchaseId: pending.id,
      clientSecret: checkout.client_secret,
      packName: pending.pack.name,
      credits: pending.pack.credits,
      amountDueLabel: formatMoneyFromPence(amountDue),
      giftCardApplied: Boolean(giftApplied),
      giftAmountAppliedLabel: giftApplied?.appliedLabel,
      giftBalanceRemainingLabel: giftApplied?.balanceAfterLabel,
    });
  } catch (error) {
    if (giftApplied && pending) {
      try {
        await restoreGiftCardBalance(giftApplied.giftCardId, giftApplied.appliedPence, {
          packPurchaseId: pending.id,
          userId: session.userId,
        });
      } catch (restoreError) {
        console.error("[gift-card:restore-pack-checkout]", restoreError);
      }
    }
    if (pending) {
      try {
        await db.classPackPurchase.delete({ where: { id: pending.id } });
      } catch {
        // may already be fulfilled or deleted
      }
    }
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
