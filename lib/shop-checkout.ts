import { randomBytes } from "crypto";
import type Stripe from "stripe";
import { formatMoneyFromPence, getAppBaseUrl } from "@/lib/booking-config";
import { sendShopGiftVoucherEmail } from "@/lib/email";
import { generateGiftCardCode, issueGiftCard } from "@/lib/gift-card-service";
import { db } from "@/lib/db";
import { getPurchasableShopProduct } from "@/lib/shop-data";
import { getStripeClient } from "@/lib/stripe";

type CartMetaItem = {
  id: string;
  q: number;
  n?: string;
};

type FulfilledLine = {
  productName: string;
  giftCode: string;
  priceLabel: string;
  quantity: number;
  balanceLabel?: string;
  /** Public path under the site, e.g. /shop/art-kit-class-bundle.svg */
  image?: string;
};

function parseCartMetadata(session: Stripe.Checkout.Session): CartMetaItem[] {
  if (session.metadata?.cart) {
    try {
      const parsed = JSON.parse(session.metadata.cart) as CartMetaItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to legacy single-product metadata
    }
  }

  if (session.metadata?.productId) {
    return [
      {
        id: session.metadata.productId,
        q: 1,
        n: session.metadata.productName,
      },
    ];
  }

  return [];
}

/**
 * After Stripe payment: create redeemable gift cards, mark session fulfilled,
 * and send digital voucher email. Idempotent via metadata.emailDelivered.
 */
export async function fulfillShopVoucherCheckout(sessionInput: Stripe.Checkout.Session) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionInput.id);

  if (session.metadata?.type !== "shop_voucher") {
    return null;
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return null;
  }

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (session.metadata.emailDelivered === "true") {
    let lines: FulfilledLine[] = [];
    if (session.metadata.giftCodes) {
      try {
        lines = JSON.parse(session.metadata.giftCodes) as FulfilledLine[];
      } catch {
        lines = [];
      }
    }

    if (lines.length === 0 && session.metadata.giftCode) {
      lines = [
        {
          productName: session.metadata.productName ?? "Gift voucher",
          giftCode: session.metadata.giftCode,
          priceLabel: formatMoneyFromPence(session.amount_total ?? 0),
          quantity: 1,
        },
      ];
    }

    // Backfill redeemable cards for purchases completed before gift cards were stored in DB.
    for (const line of lines) {
      if (!line.giftCode) continue;
      const code = line.giftCode.trim().toUpperCase();
      const existing = await db.giftCard.findUnique({ where: { code } });
      if (existing) continue;

      const parsedPence = Math.round(
        Number.parseFloat((line.priceLabel || "").replace(/[^0-9.]/g, "")) * 100,
      );
      const balancePence =
        Number.isFinite(parsedPence) && parsedPence > 0
          ? parsedPence
          : session.amount_total && lines.length === 1
            ? session.amount_total
            : 0;

      if (balancePence <= 0) continue;

      try {
        await issueGiftCard({
          code,
          balancePence,
          productName: line.productName || "Gift voucher",
          purchaserEmail: email,
          stripeSessionId: session.id,
        });
      } catch {
        // Unique conflicts / partial metadata — ignore
      }
    }

    const cards = await db.giftCard.findMany({
      where: { stripeSessionId: session.id },
      orderBy: { createdAt: "asc" },
    });

    if (cards.length > 0) {
      lines = cards.map((card) => ({
        productName: card.productName,
        giftCode: card.code,
        priceLabel: formatMoneyFromPence(card.initialBalancePence),
        balanceLabel: formatMoneyFromPence(card.balancePence),
        quantity: 1,
      }));
    }

    return {
      alreadyDelivered: true as const,
      productName: session.metadata.productName ?? "Gift voucher",
      giftCode: lines[0]?.giftCode ?? session.metadata.giftCode ?? null,
      lines,
      email,
    };
  }

  const cart = parseCartMetadata(session);
  if (cart.length === 0) {
    throw new Error("Checkout session is missing basket details.");
  }

  if (!email) {
    throw new Error("Checkout session is missing a customer email for digital delivery.");
  }

  const name = session.customer_details?.name?.trim() || "Friend";
  const lines: FulfilledLine[] = [];

  await db.$transaction(async (tx) => {
    for (const item of cart) {
      const product = getPurchasableShopProduct(item.id);
      const quantity = Math.max(1, Math.floor(item.q || 1));
      const productName = product?.name ?? item.n ?? "Gift voucher";
      const pricePence = product?.pricePence ?? 0;

      if (pricePence <= 0) {
        throw new Error(`Unable to issue gift card for ${productName}.`);
      }

      // One redeemable code per purchased unit, each with its own balance.
      for (let i = 0; i < quantity; i += 1) {
        const giftCard = await issueGiftCard(
          {
            code: generateGiftCardCode(),
            balancePence: pricePence,
            productId: product?.id ?? item.id,
            productName,
            purchaserEmail: email,
            purchaserName: name,
            stripeSessionId: session.id,
          },
          tx,
        );

        lines.push({
          productName,
          giftCode: giftCard.code,
          priceLabel: formatMoneyFromPence(pricePence),
          balanceLabel: formatMoneyFromPence(giftCard.balancePence),
          quantity: 1,
          image: product?.image,
        });
      }
    }
  });

  const totalLabel = formatMoneyFromPence(session.amount_total ?? 0);
  const summary = cart
    .map((item) => {
      const product = getPurchasableShopProduct(item.id);
      const quantity = Math.max(1, Math.floor(item.q || 1));
      return `${quantity}× ${product?.name ?? item.n ?? "Gift voucher"}`;
    })
    .join(", ");

  const giftCodesPayload = JSON.stringify(lines).slice(0, 500);

  await stripe.checkout.sessions.update(session.id, {
    metadata: {
      ...session.metadata,
      emailDelivered: "true",
      giftCode: lines[0]?.giftCode ?? "",
      giftCodes: giftCodesPayload,
      productName: summary.slice(0, 450),
    },
  });

  try {
    await sendShopGiftVoucherEmail(
      { name, email },
      {
        lines,
        totalLabel,
        shopUrl: `${getAppBaseUrl()}/shop`,
        bookUrl: `${getAppBaseUrl()}/book`,
        creditsUrl: `${getAppBaseUrl()}/account/credits`,
      },
    );
  } catch (error) {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        emailDelivered: "false",
        giftCode: lines[0]?.giftCode ?? "",
        giftCodes: giftCodesPayload,
      },
    });
    throw error;
  }

  return {
    alreadyDelivered: false as const,
    productName: summary,
    giftCode: lines[0]?.giftCode ?? null,
    lines,
    email,
  };
}

export async function fulfillShopVoucherBySessionId(sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return fulfillShopVoucherCheckout(session);
}

/** @deprecated Prefer generateGiftCardCode from gift-card-service. */
export function generateGiftCode() {
  return `GIFT-${randomBytes(4).toString("hex").toUpperCase()}`;
}
