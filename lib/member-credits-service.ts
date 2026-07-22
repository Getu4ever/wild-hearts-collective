import { formatUkDateLong, formatUkDateTimeShort } from "@/lib/booking-config";
import { CREDIT_REASON } from "@/lib/booking-advanced-config";
import { getUserCreditBalance } from "@/lib/credit-service";
import { db } from "@/lib/db";
import { listActiveClassPacks } from "@/lib/studio-pricing-service";

const creditReasonLabels: Record<string, string> = {
  [CREDIT_REASON.packPurchase]: "Class pack purchased",
  [CREDIT_REASON.bookingDeduction]: "Used for class booking",
  [CREDIT_REASON.cancellationRefund]: "Refund — booking cancelled",
  [CREDIT_REASON.adminAdjustment]: "Studio adjustment",
};

function purchaseStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending payment";
    case "exhausted":
      return "Used up";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export async function getMemberCreditsOverview(userId: string) {
  const [balance, purchases, transactions, activePacks] = await Promise.all([
    getUserCreditBalance(userId),
    db.classPackPurchase.findMany({
      where: { userId },
      include: { pack: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        booking: {
          include: {
            session: { include: { class: true } },
          },
        },
        purchase: { include: { pack: true } },
      },
    }),
    listActiveClassPacks(),
  ]);

  return {
    balance,
    purchases: purchases.map((purchase) => ({
      id: purchase.id,
      packName: purchase.pack.name,
      creditsGranted: purchase.creditsGranted,
      creditsRemaining: purchase.creditsRemaining,
      status: purchase.status,
      statusLabel: purchaseStatusLabel(purchase.status),
      expiresAt: purchase.expiresAt.toISOString(),
      expiresLabel: formatUkDateLong(purchase.expiresAt),
      purchasedAt: purchase.createdAt.toISOString(),
      purchasedLabel: formatUkDateTimeShort(purchase.createdAt),
    })),
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      reason: transaction.reason,
      reasonLabel: creditReasonLabels[transaction.reason] ?? transaction.reason,
      createdAt: transaction.createdAt.toISOString(),
      createdLabel: formatUkDateTimeShort(transaction.createdAt),
      detail:
        transaction.booking?.session.class.title ??
        transaction.purchase?.pack.name ??
        null,
    })),
    packs: activePacks.map((pack) => ({
      id: pack.id,
      slug: pack.slug,
      name: pack.name,
      description: pack.description,
      credits: pack.credits,
      priceLabel: pack.priceLabel,
      validDays: pack.validDays,
    })),
  };
}

export type MemberCreditsOverview = Awaited<ReturnType<typeof getMemberCreditsOverview>>;
