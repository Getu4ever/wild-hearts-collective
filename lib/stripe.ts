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
    success_url: `${baseUrl}/book/success?booking=${booking.id}`,
    cancel_url: `${baseUrl}/book?cancelled=1`,
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
