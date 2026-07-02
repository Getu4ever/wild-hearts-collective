import { getAppBaseUrl } from "@/lib/booking-config";
import { confirmBooking } from "@/lib/booking-service";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

function stripePaymentsEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function finalizeBookingPayment(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { session: { include: { class: true } } },
  });

  if (!booking) {
    return null;
  }

  if (booking.status === BOOKING_STATUS.confirmed) {
    return booking;
  }

  if (!stripePaymentsEnabled() || !booking.stripeSessionId) {
    return booking;
  }

  const stripe = getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(
    booking.stripeSessionId,
  );

  if (checkoutSession.payment_status !== "paid") {
    return booking;
  }

  return confirmBooking(bookingId, {
    stripePaymentId:
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id,
    amountPaid: checkoutSession.amount_total ?? undefined,
  });
}

export function getBookingPageUrl() {
  return `${getAppBaseUrl()}/book`;
}
