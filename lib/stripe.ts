import Stripe from "stripe";
import {
  formatMoneyFromPence,
  formatSessionDateTime,
  getAppBaseUrl,
  getClassPaymentAmountPence,
  isStripeConfigured,
} from "@/lib/booking-config";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
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

export async function createBookingCheckoutSession(booking: CheckoutBooking) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }

  const stripe = getStripeClient();
  const amount = getClassPaymentAmountPence();
  const baseUrl = getAppBaseUrl();

  return stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "payment",
    customer_email: booking.email,
    client_reference_id: booking.id,
    metadata: {
      bookingId: booking.id,
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
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}

export function classPaymentLabel() {
  return formatMoneyFromPence(getClassPaymentAmountPence());
}

/** @deprecated Use classPaymentLabel — classes are paid in full in advance. */
export function depositLabel() {
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

export async function createClassPackCheckoutSession(pack: ClassPackCheckout) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();

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
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: pack.pricePence,
          product_data: {
            name: `${pack.packName} — ${pack.credits} class credits`,
            description: "Class credit bundle for Wild Hearts Collective",
          },
        },
      },
    ],
    return_url: `${baseUrl}/account/credits/success?purchase=${pack.purchaseId}&session_id={CHECKOUT_SESSION_ID}`,
  });
}

type ShopVoucherCheckoutItem = {
  productId: string;
  productName: string;
  productSlug: string;
  pricePence: number;
  description: string;
  quantity: number;
};

/**
 * Hosted Stripe Checkout for one or more digital gift vouchers.
 * No shipping — digital delivery only.
 */
export async function createShopVoucherCheckoutSession(
  items: ShopVoucherCheckoutItem[],
) {
  if (!process.env.STRIPE_SECRET_KEY) {
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

  return stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "auto",
    customer_creation: "if_required",
    metadata: {
      type: "shop_voucher",
      emailDelivered: "false",
      // Stripe metadata values max 500 chars — keep a compact cart payload.
      cart: JSON.stringify(
        items.map((item) => ({
          id: item.productId,
          q: item.quantity,
          n: item.productName.slice(0, 40),
        })),
      ),
      productName: summary.slice(0, 450),
    },
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: item.pricePence,
        product_data: {
          name: item.productName,
          description: `${item.description} — Digital delivery by email (no shipping).`,
        },
      },
    })),
    success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/shop?cancelled=1`,
  });
}
