import Stripe from "stripe";
import {
  formatMoneyFromPence,
  formatSessionDateTime,
  getAppBaseUrl,
  getDepositAmountPence,
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
  const deposit = getDepositAmountPence();
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
          unit_amount: deposit,
          product_data: {
            name: `${booking.classTitle} — class deposit`,
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

export function depositLabel() {
  return formatMoneyFromPence(getDepositAmountPence());
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
