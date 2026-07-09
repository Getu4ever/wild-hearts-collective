import type { Prisma } from "@prisma/client";
import {
  CLASS_PACK_STATUS,
  CREDIT_REASON,
} from "@/lib/booking-advanced-config";
import { db } from "@/lib/db";
import { sendClassPackPurchaseEmails } from "@/lib/email";

type TransactionClient = Prisma.TransactionClient;

async function expireStalePurchases(tx: TransactionClient, userId: string) {
  const now = new Date();

  await tx.classPackPurchase.updateMany({
    where: {
      userId,
      status: CLASS_PACK_STATUS.active,
      expiresAt: { lt: now },
    },
    data: { status: CLASS_PACK_STATUS.expired },
  });
}

export async function getUserCreditBalance(userId: string) {
  await expireStalePurchases(db, userId);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true },
  });

  return user?.creditsRemaining ?? 0;
}

export async function grantCreditsFromPackPurchase(
  userId: string,
  packId: string,
  credits: number,
  validDays: number,
  stripePaymentId?: string,
  stripeSessionId?: string,
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);

  return db.$transaction(async (tx) => {
    const purchase = await tx.classPackPurchase.create({
      data: {
        userId,
        packId,
        creditsGranted: credits,
        creditsRemaining: credits,
        expiresAt,
        stripePaymentId: stripePaymentId ?? null,
        stripeSessionId: stripeSessionId ?? null,
        status: CLASS_PACK_STATUS.active,
      },
    });

    const user = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { increment: credits } },
      select: { creditsRemaining: true },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        purchaseId: purchase.id,
        amount: credits,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.packPurchase,
      },
    });

    return { purchase, balance: user.creditsRemaining };
  });
}

export async function createPendingClassPackPurchase(userId: string, packId: string) {
  const pack = await db.classPack.findUnique({ where: { id: packId } });

  if (!pack || !pack.active) {
    throw new Error("Class pack not available.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pack.validDays);

  return db.classPackPurchase.create({
    data: {
      userId,
      packId: pack.id,
      creditsGranted: pack.credits,
      creditsRemaining: 0,
      expiresAt,
      status: "pending",
    },
    include: { pack: true },
  });
}

export async function fulfillPendingClassPackPurchase(
  purchaseId: string,
  stripePaymentId?: string,
  stripeSessionId?: string,
) {
  const result = await db.$transaction(async (tx) => {
    const purchase = await tx.classPackPurchase.findUnique({
      where: { id: purchaseId },
      include: { pack: true },
    });

    if (!purchase || purchase.status !== "pending") {
      return null;
    }

    const user = await tx.user.update({
      where: { id: purchase.userId },
      data: { creditsRemaining: { increment: purchase.creditsGranted } },
      select: { creditsRemaining: true, name: true, email: true },
    });

    const fulfilled = await tx.classPackPurchase.update({
      where: { id: purchaseId },
      data: {
        status: CLASS_PACK_STATUS.active,
        creditsRemaining: purchase.creditsGranted,
        stripePaymentId: stripePaymentId ?? null,
        stripeSessionId: stripeSessionId ?? null,
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: purchase.userId,
        purchaseId: purchase.id,
        amount: purchase.creditsGranted,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.packPurchase,
      },
    });

    return {
      purchase: fulfilled,
      pack: purchase.pack,
      balance: user.creditsRemaining,
      customer: { name: user.name, email: user.email },
    };
  });

  if (result) {
    try {
      await sendClassPackPurchaseEmails(result.customer, {
        packName: result.pack.name,
        credits: result.purchase.creditsGranted,
        pricePence: result.pack.pricePence,
        expiresAt: result.purchase.expiresAt,
        balanceAfter: result.balance,
      });
    } catch (error) {
      console.error("[email:class-pack]", purchaseId, error);
    }
  }

  return result
    ? { purchase: result.purchase, balance: result.balance }
    : null;
}

export async function deductCreditForBooking(
  userId: string,
  bookingId: string,
) {
  return db.$transaction(async (tx) => {
    await expireStalePurchases(tx, userId);

    const user = await tx.user.update({
      where: {
        id: userId,
        creditsRemaining: { gte: 1 },
      },
      data: { creditsRemaining: { decrement: 1 } },
      select: { creditsRemaining: true },
    });

    const purchase = await tx.classPackPurchase.findFirst({
      where: {
        userId,
        status: CLASS_PACK_STATUS.active,
        creditsRemaining: { gte: 1 },
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: "asc" },
    });

    if (purchase) {
      const nextRemaining = purchase.creditsRemaining - 1;
      await tx.classPackPurchase.update({
        where: { id: purchase.id },
        data: {
          creditsRemaining: nextRemaining,
          status: nextRemaining <= 0 ? CLASS_PACK_STATUS.exhausted : CLASS_PACK_STATUS.active,
        },
      });
    }

    await tx.creditTransaction.create({
      data: {
        userId,
        bookingId,
        purchaseId: purchase?.id ?? null,
        amount: -1,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.bookingDeduction,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        paidWithCredit: true,
        packPurchaseId: purchase?.id ?? null,
      },
    });

    return { balance: user.creditsRemaining, purchaseId: purchase?.id ?? null };
  });
}

export async function refundCreditForCancellation(
  userId: string,
  bookingId: string,
) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { paidWithCredit: true, packPurchaseId: true },
    });

    if (!booking?.paidWithCredit) {
      return { refunded: false as const };
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { increment: 1 } },
      select: { creditsRemaining: true },
    });

    if (booking.packPurchaseId) {
      const purchase = await tx.classPackPurchase.findUnique({
        where: { id: booking.packPurchaseId },
      });

      if (purchase) {
        const nextRemaining = purchase.creditsRemaining + 1;
        await tx.classPackPurchase.update({
          where: { id: purchase.id },
          data: {
            creditsRemaining: nextRemaining,
            status: CLASS_PACK_STATUS.active,
          },
        });
      }
    }

    await tx.creditTransaction.create({
      data: {
        userId,
        bookingId,
        purchaseId: booking.packPurchaseId,
        amount: 1,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.cancellationRefund,
      },
    });

    return { refunded: true as const, balance: user.creditsRemaining };
  });
}
