import { randomBytes } from "crypto";
import type Stripe from "stripe";
import { formatMoneyFromPence, getAppBaseUrl } from "@/lib/booking-config";
import { sendShopGiftVoucherEmail } from "@/lib/email";
import { getPurchasableShopProduct } from "@/lib/shop-data";
import { getStripeClient } from "@/lib/stripe";

function generateGiftCode() {
  return `GIFT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

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
 * After Stripe payment: mark session fulfilled and send digital voucher email.
 * Idempotent via metadata.emailDelivered. Always re-fetches the session so
 * success-page and webhook callers cannot double-send.
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

  for (const item of cart) {
    const product = getPurchasableShopProduct(item.id);
    const quantity = Math.max(1, Math.floor(item.q || 1));
    const productName = product?.name ?? item.n ?? "Gift voucher";
    const pricePence = product?.pricePence ?? 0;

    // One redeemable code per line (covers the purchased quantity).
    lines.push({
      productName,
      giftCode: generateGiftCode(),
      priceLabel: formatMoneyFromPence(pricePence),
      quantity,
      image: product?.image,
    });
  }

  const totalLabel = formatMoneyFromPence(session.amount_total ?? 0);
  const summary = lines
    .map((line) => `${line.quantity}× ${line.productName}`)
    .join(", ");

  await stripe.checkout.sessions.update(session.id, {
    metadata: {
      ...session.metadata,
      emailDelivered: "true",
      giftCode: lines[0]?.giftCode ?? "",
      giftCodes: JSON.stringify(lines).slice(0, 500),
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
      },
    );
  } catch (error) {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        emailDelivered: "false",
        giftCode: lines[0]?.giftCode ?? "",
        giftCodes: JSON.stringify(lines).slice(0, 500),
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
