import type { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { formatMoneyFromPence } from "@/lib/booking-config";
import { db } from "@/lib/db";

export const GIFT_REDEMPTION_REASON = {
  booking: "booking",
  classPack: "class_pack",
  restore: "restore",
} as const;

export type GiftRedemptionReason =
  (typeof GIFT_REDEMPTION_REASON)[keyof typeof GIFT_REDEMPTION_REASON];

type Tx = Prisma.TransactionClient;

export function generateGiftCardCode() {
  return `GIFT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function looksLikeGiftCardCode(code: string) {
  return code.trim().toUpperCase().startsWith("GIFT-");
}

export type IssueGiftCardInput = {
  code?: string;
  balancePence: number;
  productId?: string | null;
  productName: string;
  purchaserEmail?: string | null;
  purchaserName?: string | null;
  stripeSessionId?: string | null;
  /** Defaults to 2 years from issue. */
  validDays?: number;
};

export async function issueGiftCard(input: IssueGiftCardInput, tx: Tx = db) {
  if (input.balancePence <= 0) {
    throw new Error("Gift card balance must be greater than zero.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.validDays ?? 365 * 2));

  return tx.giftCard.create({
    data: {
      code: (input.code ?? generateGiftCardCode()).trim().toUpperCase(),
      initialBalancePence: input.balancePence,
      balancePence: input.balancePence,
      productId: input.productId ?? null,
      productName: input.productName,
      purchaserEmail: input.purchaserEmail?.trim().toLowerCase() || null,
      purchaserName: input.purchaserName?.trim() || null,
      stripeSessionId: input.stripeSessionId ?? null,
      expiresAt,
    },
  });
}

export async function findGiftCardByCode(code: string) {
  return db.giftCard.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
}

export async function getGiftCardPreview(code: string) {
  const giftCard = await findGiftCardByCode(code);

  if (!giftCard) {
    throw new Error("This gift card code is invalid.");
  }

  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    throw new Error("This gift card has expired.");
  }

  if (giftCard.balancePence <= 0) {
    throw new Error("This gift card has no remaining balance.");
  }

  return {
    id: giftCard.id,
    code: giftCard.code,
    balancePence: giftCard.balancePence,
    balanceLabel: formatMoneyFromPence(giftCard.balancePence),
    initialBalancePence: giftCard.initialBalancePence,
    productName: giftCard.productName,
    expiresAt: giftCard.expiresAt,
  };
}

/**
 * Spend up to `amountPence` from the card. Returns what was actually taken
 * and the remaining balance (e.g. £25 card on a £10 class → spent 1000, left 1500).
 */
export async function redeemGiftCardBalance(
  giftCardId: string,
  amountPence: number,
  options: {
    reason: GiftRedemptionReason;
    bookingId?: string | null;
    packPurchaseId?: string | null;
    userId?: string | null;
  },
  tx: Tx = db,
) {
  if (amountPence <= 0) {
    throw new Error("Redemption amount must be greater than zero.");
  }

  const giftCard = await tx.giftCard.findUnique({ where: { id: giftCardId } });

  if (!giftCard) {
    throw new Error("This gift card code is invalid.");
  }

  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    throw new Error("This gift card has expired.");
  }

  if (giftCard.balancePence <= 0) {
    throw new Error("This gift card has no remaining balance.");
  }

  const appliedPence = Math.min(giftCard.balancePence, amountPence);

  const updatedRows = await tx.giftCard.updateMany({
    where: {
      id: giftCardId,
      balancePence: { gte: appliedPence },
    },
    data: { balancePence: { decrement: appliedPence } },
  });

  if (updatedRows.count !== 1) {
    throw new Error("This gift card no longer has enough balance. Please try again.");
  }

  const updated = await tx.giftCard.findUniqueOrThrow({ where: { id: giftCardId } });

  await tx.giftCardRedemption.create({
    data: {
      giftCardId,
      amountPence: -appliedPence,
      balanceAfter: updated.balancePence,
      reason: options.reason,
      bookingId: options.bookingId ?? null,
      packPurchaseId: options.packPurchaseId ?? null,
      userId: options.userId ?? null,
    },
  });

  return {
    giftCard: updated,
    appliedPence,
    balanceAfter: updated.balancePence,
    fullyCovered: appliedPence >= amountPence,
  };
}

/** Put money back on a card when a pending checkout is abandoned. */
export async function restoreGiftCardBalance(
  giftCardId: string,
  amountPence: number,
  options: {
    bookingId?: string | null;
    packPurchaseId?: string | null;
    userId?: string | null;
  },
  tx: Tx = db,
) {
  if (amountPence <= 0) return null;

  const giftCard = await tx.giftCard.findUnique({ where: { id: giftCardId } });
  if (!giftCard) return null;

  const balanceAfter = giftCard.balancePence + amountPence;

  const updated = await tx.giftCard.update({
    where: { id: giftCardId },
    data: { balancePence: balanceAfter },
  });

  await tx.giftCardRedemption.create({
    data: {
      giftCardId,
      amountPence,
      balanceAfter,
      reason: GIFT_REDEMPTION_REASON.restore,
      bookingId: options.bookingId ?? null,
      packPurchaseId: options.packPurchaseId ?? null,
      userId: options.userId ?? null,
    },
  });

  return updated;
}

/**
 * Applies a gift code toward a charge. Deducts immediately so the balance
 * cannot be double-spent while Stripe checkout is open.
 */
export async function applyGiftCodeToCharge(
  code: string,
  chargePence: number,
  options: {
    reason: typeof GIFT_REDEMPTION_REASON.booking | typeof GIFT_REDEMPTION_REASON.classPack;
    bookingId?: string | null;
    packPurchaseId?: string | null;
    userId?: string | null;
  },
) {
  const giftCard = await findGiftCardByCode(code);

  if (!giftCard) {
    throw new Error("This gift card code is invalid.");
  }

  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    throw new Error("This gift card has expired.");
  }

  if (giftCard.balancePence <= 0) {
    throw new Error("This gift card has no remaining balance.");
  }

  return db.$transaction(async (tx) => {
    const result = await redeemGiftCardBalance(giftCard.id, chargePence, options, tx);

    return {
      giftCardId: giftCard.id,
      code: giftCard.code,
      appliedPence: result.appliedPence,
      balanceAfter: result.balanceAfter,
      amountDuePence: Math.max(0, chargePence - result.appliedPence),
      fullyCovered: result.appliedPence >= chargePence,
      balanceAfterLabel: formatMoneyFromPence(result.balanceAfter),
      appliedLabel: formatMoneyFromPence(result.appliedPence),
    };
  });
}
