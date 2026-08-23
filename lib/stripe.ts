import Stripe from "stripe";
import {
  formatMoneyFromPence,
  formatSessionDateTime,
  getAppBaseUrl,
} from "@/lib/booking-config";
import {
  getStripeSecretKey,
  getStripeWebhookSecret,
} from "@/lib/stripe-env";
import { formatCredits } from "@/lib/credit-units";
import { resolveClassPaymentAmountPence } from "@/lib/studio-pricing-service";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

type CheckoutBooking = {
  id: string;
  email: string;
  name: string;
  classTitle: string;
  startsAt: Date;
};

export async function createBookingCheckoutSession(
  booking: CheckoutBooking,
  options?: { amountPence?: number; giftCardId?: string; giftAmountApplied?: number },
) {
  if (!getStripeSecretKey()) {
    throw new Error("Stripe is not configured.");
  }

  const stripe = getStripeClient();
  const amount = options?.amountPence ?? (await resolveClassPaymentAmountPence());
  const baseUrl = getAppBaseUrl();

  if (amount <= 0) {
    throw new Error("Checkout amount must be greater than zero.");
  }

  return stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "payment",
    customer_email: booking.email,
    client_reference_id: booking.id,
    metadata: {
      bookingId: booking.id,
      ...(options?.giftCardId
        ? {
            giftCardId: options.giftCardId,
            giftAmountApplied: String(options.giftAmountApplied ?? 0),
          }
        : {}),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: amount,
          product_data: {
            name: `${booking.classTitle} — class booking`,
            description: formatSessionDateTime(booking.startsAt),
          },
        },
      },
    ],
    return_url: `${baseUrl}/book/success?booking=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
  });
}

export function verifyStripeWebhook(payload: string, signature: string) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function classPaymentLabel() {
  return formatMoneyFromPence(await resolveClassPaymentAmountPence());
}

/** @deprecated Use classPaymentLabel — classes are paid in full in advance. */
export async function depositLabel() {
  return classPaymentLabel();
}

type ClassPackCheckout = {
  purchaseId: string;
  userId: string;
  packId: string;
  email: string;
  name: string;
  packName: string;
  credits: number;
  pricePence: number;
};

export async function createClassPackCheckoutSession(
  pack: ClassPackCheckout,
  options?: { amountPence?: number; giftCardId?: string; giftAmountApplied?: number },
) {
  if (!getStripeSecretKey()) {
    throw new Error("Stripe is not configured.");
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const amount = options?.amountPence ?? pack.pricePence;

  if (amount <= 0) {
    throw new Error("Checkout amount must be greater than zero.");
  }

  return stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "payment",
    customer_email: pack.email,
    client_reference_id: pack.purchaseId,
    metadata: {
      type: "class_pack",
      purchaseId: pack.purchaseId,
      userId: pack.userId,
      packId: pack.packId,
      ...(options?.giftCardId
        ? {
            giftCardId: options.giftCardId,
            giftAmountApplied: String(options.giftAmountApplied ?? 0),
          }
        : {}),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: amount,
          product_data: {
            name: `${pack.packName} — ${formatCredits(pack.credits)} class credits`,
            description: options?.giftAmountApplied
              ? `Class credit bundle — ${formatMoneyFromPence(options.giftAmountApplied)} applied from gift card`
              : "Class credit bundle for Wild Hearts Collective",
          },
        },
      },
    ],
    return_url: `${baseUrl}/account/credits/success?purchase=${pack.purchaseId}&session_id={CHECKOUT_SESSION_ID}`,
  });
}

type ShopCheckoutItem = {
  productId: string;
  productName: string;
  productSlug: string;
  /** Public path under the site, e.g. /shop/art-kit-class-bundle.svg */
  image: string;
  pricePence: number;
  description: string;
  quantity: number;
  digitalDelivery: boolean;
};

type ShopCheckoutOptions = {
  fulfillmentMethod?: "collection" | "delivery";
  shippingPence?: number;
  totalWeightGrams?: number;
};

/**
 * Hosted Stripe Checkout for any purchasable shop basket.
 * Gift vouchers stay digital-only. Physical items: collect from studio (default)
 * or UK delivery with one parcel fee from total basket weight.
 */
export async function createShopCheckoutSession(
  items: ShopCheckoutItem[],
  options: ShopCheckoutOptions = {},
) {
  if (!getStripeSecretKey()) {
    throw new Error("Stripe is not configured.");
  }

  if (items.length === 0) {
    throw new Error("Basket is empty.");
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const summary = items
    .map((item) => `${item.quantity}× ${item.productName}`)
    .join(", ");
  const hasPhysical = items.some((item) => !item.digitalDelivery);
  const hasGiftVoucher = items.some((item) => item.digitalDelivery);
  const fulfillmentMethod = hasPhysical
    ? options.fulfillmentMethod ?? "collection"
    : null;
  const wantsDelivery = fulfillmentMethod === "delivery";
  const shippingPence = wantsDelivery
    ? Math.max(0, Math.round(options.shippingPence ?? 0))
    : 0;
  const totalWeightGrams = wantsDelivery
    ? Math.max(0, Math.round(options.totalWeightGrams ?? 0))
    : 0;

  const productLineItems = items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "gbp" as const,
      unit_amount: item.pricePence,
      product_data: {
        name: item.productName,
        description: item.digitalDelivery
          ? `${item.description} — Digital delivery by email (no shipping).`
          : wantsDelivery
            ? `${item.description} — UK delivery.`
            : `${item.description} — Collect from studio.`,
        // Stripe needs absolute, publicly reachable HTTPS URLs.
        images: [
          `${baseUrl}${item.image.startsWith("/") ? item.image : `/${item.image}`}`,
        ],
      },
    },
  }));

  const lineItems =
    shippingPence > 0
      ? [
          ...productLineItems,
          {
            quantity: 1,
            price_data: {
              currency: "gbp" as const,
              unit_amount: shippingPence,
              product_data: {
                name: "UK delivery",
                description:
                  totalWeightGrams > 0
                    ? `One parcel fee for basket weight (${totalWeightGrams}g).`
                    : "One parcel fee for your basket.",
              },
            },
          },
        ]
      : productLineItems;

  return stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "auto",
    customer_creation: "if_required",
    ...(wantsDelivery
      ? {
          shipping_address_collection: {
            allowed_countries: ["GB"],
          },
        }
      : {}),
    metadata: {
      // shop_voucher = gift cards only; shop_product = any physical / mixed catalog sale
      type: hasPhysical ? "shop_product" : "shop_voucher",
      emailDelivered: "false",
      hasPhysical: hasPhysical ? "true" : "false",
      hasGiftVoucher: hasGiftVoucher ? "true" : "false",
      fulfillmentMethod: fulfillmentMethod ?? "",
      shippingPence: String(shippingPence),
      totalWeightGrams: String(totalWeightGrams),
      // Stripe metadata values max 500 chars — keep a compact cart payload.
      cart: JSON.stringify(
        items.map((item) => ({
          id: item.productId,
          q: item.quantity,
          n: item.productName.slice(0, 40),
          d: item.digitalDelivery ? 1 : 0,
        })),
      ),
      productName: summary.slice(0, 450),
    },
    line_items: lineItems,
    success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/shop?cancelled=1`,
  });
}

/** @deprecated Prefer createShopCheckoutSession. */
export async function createShopVoucherCheckoutSession(
  items: Omit<ShopCheckoutItem, "digitalDelivery">[],
) {
  return createShopCheckoutSession(
    items.map((item) => ({ ...item, digitalDelivery: true })),
  );
}
