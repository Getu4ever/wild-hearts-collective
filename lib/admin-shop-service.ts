import { formatMoneyFromPence } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { SHOP_CATEGORIES, type ShopCategoryId } from "@/lib/shop-data";

export type GiftCardStatus = "active" | "partial" | "redeemed" | "expired";

export function getGiftCardStatus(card: {
  balancePence: number;
  initialBalancePence: number;
  expiresAt: Date | null;
}): GiftCardStatus {
  const now = new Date();
  if (card.expiresAt && card.expiresAt < now && card.balancePence > 0) {
    return "expired";
  }
  if (card.balancePence <= 0) return "redeemed";
  if (card.balancePence < card.initialBalancePence) return "partial";
  return "active";
}

export function giftCardStatusLabel(status: GiftCardStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "partial":
      return "Partially used";
    case "redeemed":
      return "Fully redeemed";
    case "expired":
      return "Expired";
  }
}

export function redemptionReasonLabel(reason: string) {
  switch (reason) {
    case "booking":
      return "Class booking";
    case "class_pack":
      return "Class pack";
    case "restore":
      return "Balance restored";
    default:
      return reason;
  }
}

function categoryLabel(category: string | null | undefined) {
  if (!category) return "Shop";
  if (category in SHOP_CATEGORIES) {
    return SHOP_CATEGORIES[category as ShopCategoryId].label;
  }
  return category;
}

function fulfillmentLabel(type: string) {
  switch (type) {
    case "gift_card":
      return "Gift voucher";
    case "physical":
      return "Physical item";
    case "digital":
      return "Digital";
    default:
      return type;
  }
}

function sourceLabel(sourceType: string) {
  switch (sourceType) {
    case "shop_voucher":
      return "Gift voucher";
    case "shop_product":
      return "Shop product";
    default:
      return "Shop sale";
  }
}

export async function getAdminShopOverview() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    giftCards,
    recentRedemptions,
    shopOrders,
    redeemedSpendLast30Days,
  ] = await Promise.all([
    db.giftCard.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        redemptions: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.giftCardRedemption.findMany({
      where: { amountPence: { lt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        giftCard: {
          select: {
            code: true,
            productName: true,
            purchaserEmail: true,
            purchaserName: true,
          },
        },
      },
    }),
    db.shopOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    db.giftCardRedemption.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        amountPence: { lt: 0 },
      },
      _sum: { amountPence: true },
    }),
  ]);

  const orderSessionIds = new Set(
    shopOrders
      .map((order) => order.stripeSessionId)
      .filter((id): id is string => Boolean(id)),
  );

  // Historical gift-card sales that pre-date the ShopOrder ledger.
  const legacySalesBySession = new Map<
    string,
    {
      id: string;
      stripeSessionId: string | null;
      purchaserEmail: string | null;
      purchaserName: string | null;
      totalPence: number;
      createdAt: Date;
      items: Array<{
        productName: string;
        quantity: number;
        unitPricePence: number;
        lineTotalPence: number;
        category: string | null;
        fulfillmentType: string;
      }>;
    }
  >();

  for (const card of giftCards) {
    const key = card.stripeSessionId ?? `legacy:${card.id}`;
    if (card.stripeSessionId && orderSessionIds.has(card.stripeSessionId)) {
      continue;
    }

    const existing = legacySalesBySession.get(key);
    if (existing) {
      existing.totalPence += card.initialBalancePence;
      existing.items.push({
        productName: card.productName,
        quantity: 1,
        unitPricePence: card.initialBalancePence,
        lineTotalPence: card.initialBalancePence,
        category: "gift-vouchers",
        fulfillmentType: "gift_card",
      });
      continue;
    }

    legacySalesBySession.set(key, {
      id: `legacy-${card.id}`,
      stripeSessionId: card.stripeSessionId,
      purchaserEmail: card.purchaserEmail,
      purchaserName: card.purchaserName,
      totalPence: card.initialBalancePence,
      createdAt: card.createdAt,
      items: [
        {
          productName: card.productName,
          quantity: 1,
          unitPricePence: card.initialBalancePence,
          lineTotalPence: card.initialBalancePence,
          category: "gift-vouchers",
          fulfillmentType: "gift_card",
        },
      ],
    });
  }

  const sales = [
    ...shopOrders.map((order) => ({
      id: order.id,
      stripeSessionId: order.stripeSessionId,
      status: order.status,
      sourceType: order.sourceType,
      sourceLabel: sourceLabel(order.sourceType),
      purchaserEmail: order.purchaserEmail,
      purchaserName: order.purchaserName,
      totalPence: order.totalPence,
      totalLabel: formatMoneyFromPence(order.totalPence),
      createdAt: order.createdAt.toISOString(),
      isLegacy: false,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      summary: order.items
        .map((item) => `${item.quantity}× ${item.productName}`)
        .join(", "),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        categoryLabel: categoryLabel(item.category),
        quantity: item.quantity,
        unitPriceLabel: formatMoneyFromPence(item.unitPricePence),
        lineTotalLabel: formatMoneyFromPence(item.lineTotalPence),
        fulfillmentLabel: fulfillmentLabel(item.fulfillmentType),
      })),
    })),
    ...Array.from(legacySalesBySession.values()).map((sale) => ({
      id: sale.id,
      stripeSessionId: sale.stripeSessionId,
      status: "fulfilled",
      sourceType: "shop_voucher",
      sourceLabel: sourceLabel("shop_voucher"),
      purchaserEmail: sale.purchaserEmail,
      purchaserName: sale.purchaserName,
      totalPence: sale.totalPence,
      totalLabel: formatMoneyFromPence(sale.totalPence),
      createdAt: sale.createdAt.toISOString(),
      isLegacy: true,
      itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      summary: sale.items
        .map((item) => `${item.quantity}× ${item.productName}`)
        .join(", "),
      items: sale.items.map((item, index) => ({
        id: `${sale.id}-${index}`,
        productName: item.productName,
        categoryLabel: categoryLabel(item.category),
        quantity: item.quantity,
        unitPriceLabel: formatMoneyFromPence(item.unitPricePence),
        lineTotalLabel: formatMoneyFromPence(item.lineTotalPence),
        fulfillmentLabel: fulfillmentLabel(item.fulfillmentType),
      })),
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const salesLast30Days = sales.filter(
    (sale) => new Date(sale.createdAt) >= thirtyDaysAgo,
  );
  const revenueLast30DaysPence = salesLast30Days.reduce(
    (sum, sale) => sum + sale.totalPence,
    0,
  );

  const outstandingBalancePence = giftCards.reduce((sum, card) => {
    if (card.expiresAt && card.expiresAt < now) return sum;
    return sum + Math.max(0, card.balancePence);
  }, 0);

  const redeemedLast30DaysPence = Math.abs(
    redeemedSpendLast30Days._sum.amountPence ?? 0,
  );

  const statusCounts = {
    active: 0,
    partial: 0,
    redeemed: 0,
    expired: 0,
  };

  const vouchers = giftCards.map((card) => {
    const status = getGiftCardStatus(card);
    statusCounts[status] += 1;

    return {
      id: card.id,
      code: card.code,
      productName: card.productName,
      productId: card.productId,
      purchaserName: card.purchaserName,
      purchaserEmail: card.purchaserEmail,
      initialBalancePence: card.initialBalancePence,
      initialBalanceLabel: formatMoneyFromPence(card.initialBalancePence),
      balancePence: card.balancePence,
      balanceLabel: formatMoneyFromPence(card.balancePence),
      spentPence: card.initialBalancePence - card.balancePence,
      spentLabel: formatMoneyFromPence(
        Math.max(0, card.initialBalancePence - card.balancePence),
      ),
      stripeSessionId: card.stripeSessionId,
      expiresAt: card.expiresAt?.toISOString() ?? null,
      createdAt: card.createdAt.toISOString(),
      status,
      statusLabel: giftCardStatusLabel(status),
      redemptionCount: card.redemptions.length,
      redemptions: card.redemptions.map((redemption) => ({
        id: redemption.id,
        amountPence: redemption.amountPence,
        amountLabel: formatMoneyFromPence(Math.abs(redemption.amountPence)),
        isRestore: redemption.amountPence > 0,
        balanceAfterLabel: formatMoneyFromPence(redemption.balanceAfter),
        reason: redemption.reason,
        reasonLabel: redemptionReasonLabel(redemption.reason),
        bookingId: redemption.bookingId,
        packPurchaseId: redemption.packPurchaseId,
        createdAt: redemption.createdAt.toISOString(),
      })),
    };
  });

  return {
    summary: {
      ordersCount: sales.length,
      ordersLast30Days: salesLast30Days.length,
      itemsSoldLast30Days: salesLast30Days.reduce(
        (sum, sale) => sum + sale.itemCount,
        0,
      ),
      vouchersSold: giftCards.length,
      revenueLast30DaysPence,
      revenueLast30DaysLabel: formatMoneyFromPence(revenueLast30DaysPence),
      outstandingBalancePence,
      outstandingBalanceLabel: formatMoneyFromPence(outstandingBalancePence),
      redeemedLast30DaysPence,
      redeemedLast30DaysLabel: formatMoneyFromPence(redeemedLast30DaysPence),
      statusCounts,
    },
    sales,
    vouchers,
    recentActivity: recentRedemptions.map((redemption) => ({
      id: redemption.id,
      amountLabel: formatMoneyFromPence(Math.abs(redemption.amountPence)),
      reasonLabel: redemptionReasonLabel(redemption.reason),
      code: redemption.giftCard.code,
      productName: redemption.giftCard.productName,
      purchaserName: redemption.giftCard.purchaserName,
      purchaserEmail: redemption.giftCard.purchaserEmail,
      createdAt: redemption.createdAt.toISOString(),
    })),
  };
}

export type AdminShopOverview = Awaited<ReturnType<typeof getAdminShopOverview>>;
export type AdminShopVoucher = AdminShopOverview["vouchers"][number];
export type AdminShopSale = AdminShopOverview["sales"][number];
