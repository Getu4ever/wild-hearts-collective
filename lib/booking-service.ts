import {
  BOOKING_STATUS,
  WAITLIST_STATUS,
  getAppBaseUrl,
  isStripeConfigured,
} from "@/lib/booking-config";
import {
  CANCELLATION_TYPE,
  PAYMENT_HOLD_MS,
} from "@/lib/booking-advanced-config";
import { db } from "@/lib/db";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmails,
  sendWaitlistSpotAvailableEmail,
} from "@/lib/email";

export function paymentHoldCutoff(now = new Date()) {
  return new Date(now.getTime() - PAYMENT_HOLD_MS);
}

async function expireStripeCheckoutSession(stripeSessionId: string) {
  if (!isStripeConfigured()) return;

  try {
    const { getStripeClient } = await import("@/lib/stripe");
    await getStripeClient().checkout.sessions.expire(stripeSessionId);
  } catch {
    // Session may already be expired, completed, or unavailable.
  }
}

/**
 * Cancel unpaid pending bookings older than the payment hold window and release
 * their spots. Does not email the customer (they abandoned checkout).
 * If Stripe shows the checkout was already paid, confirm instead of cancelling.
 */
export async function expireStalePendingBookings(options?: {
  sessionId?: string;
}) {
  const cutoff = paymentHoldCutoff();
  const stale = await db.booking.findMany({
    where: {
      status: BOOKING_STATUS.pending,
      createdAt: { lt: cutoff },
      ...(options?.sessionId ? { sessionId: options.sessionId } : {}),
    },
    select: {
      id: true,
      sessionId: true,
      stripeSessionId: true,
    },
  });

  if (stale.length === 0) {
    return { expired: 0, confirmed: 0, sessionIds: [] as string[] };
  }

  let expired = 0;
  let confirmed = 0;
  const releasedSessionIds = new Set<string>();

  for (const booking of stale) {
    if (booking.stripeSessionId && isStripeConfigured()) {
      try {
        const { getStripeClient } = await import("@/lib/stripe");
        const checkout = await getStripeClient().checkout.sessions.retrieve(
          booking.stripeSessionId,
        );

        if (checkout.payment_status === "paid") {
          const paymentIntent =
            typeof checkout.payment_intent === "string"
              ? checkout.payment_intent
              : checkout.payment_intent?.id;

          await confirmBooking(booking.id, {
            stripePaymentId: paymentIntent,
            amountPaid: checkout.amount_total ?? undefined,
          });
          confirmed += 1;
          continue;
        }
      } catch {
        // Fall through to cancel if Stripe lookup fails.
      }
    }

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.cancelled,
        cancellationType: CANCELLATION_TYPE.paymentExpired,
      },
    });

    if (booking.stripeSessionId) {
      await expireStripeCheckoutSession(booking.stripeSessionId);
    }

    expired += 1;
    releasedSessionIds.add(booking.sessionId);
  }

  for (const sessionId of releasedSessionIds) {
    await notifyNextWaitlistEntry(sessionId);
  }

  return {
    expired,
    confirmed,
    sessionIds: [...releasedSessionIds],
  };
}

export async function countConfirmedBookings(sessionId: string) {
  return db.booking.count({
    where: {
      sessionId,
      status: BOOKING_STATUS.confirmed,
    },
  });
}

/** Confirmed bookings plus unpaid checkouts still inside the hold window. */
export async function countHeldBookings(sessionId: string) {
  await expireStalePendingBookings({ sessionId });

  const cutoff = paymentHoldCutoff();

  return db.booking.count({
    where: {
      sessionId,
      OR: [
        { status: BOOKING_STATUS.confirmed },
        {
          status: BOOKING_STATUS.pending,
          createdAt: { gte: cutoff },
        },
      ],
    },
  });
}

export async function sessionHasCapacity(sessionId: string, capacity: number) {
  const held = await countHeldBookings(sessionId);
  return held < capacity;
}

export async function confirmBooking(
  bookingId: string,
  options?: { stripePaymentId?: string; amountPaid?: number },
) {
  const booking = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BOOKING_STATUS.confirmed,
      stripePaymentId: options?.stripePaymentId,
      amountPaid: options?.amountPaid,
    },
    include: {
      session: { include: { class: true } },
    },
  });

  await sendBookingConfirmedEmails(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
    options?.amountPaid ?? booking.amountPaid,
  );

  return booking;
}

export async function cancelBooking(bookingId: string) {
  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.cancelled },
    include: {
      session: { include: { class: true } },
    },
  });

  await sendBookingCancelledEmail(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
  );

  await notifyNextWaitlistEntry(booking.sessionId);

  return booking;
}

export async function notifyNextWaitlistEntry(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session) return null;

  const held = await countHeldBookings(sessionId);
  if (held >= session.capacity) return null;

  const next = await db.waitlistEntry.findFirst({
    where: {
      sessionId,
      status: WAITLIST_STATUS.waiting,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!next) return null;

  const updated = await db.waitlistEntry.update({
    where: { id: next.id },
    data: { status: WAITLIST_STATUS.notified },
  });

  const bookUrl = `${getAppBaseUrl()}/book?class=${session.class.slug}`;

  await sendWaitlistSpotAvailableEmail(
    { name: updated.name, email: updated.email },
    {
      classTitle: session.class.title,
      startsAt: session.startsAt,
    },
    bookUrl,
  );

  return updated;
}

export async function updateBookingStatus(
  bookingId: string,
  status: string,
) {
  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    include: { session: { include: { class: true } } },
  });

  if (!existing) {
    return null;
  }

  if (status === BOOKING_STATUS.confirmed) {
    const sessionRecord = await db.session.findUnique({
      where: { id: existing.sessionId },
    });

    if (!sessionRecord) {
      return null;
    }

    if (existing.status !== BOOKING_STATUS.confirmed) {
      const held = await countHeldBookings(existing.sessionId);
      const cutoff = paymentHoldCutoff();
      const alreadyHoldsSpot =
        existing.status === BOOKING_STATUS.pending &&
        existing.createdAt >= cutoff;

      if (!alreadyHoldsSpot && held >= sessionRecord.capacity) {
        throw new Error("This session is fully booked.");
      }

      return confirmBooking(bookingId);
    }

    return db.booking.update({
      where: { id: bookingId },
      data: { status: BOOKING_STATUS.confirmed },
      include: { session: { include: { class: true } } },
    });
  }

  if (status === BOOKING_STATUS.cancelled) {
    if (existing.status === BOOKING_STATUS.cancelled) {
      return existing;
    }
    return cancelBooking(bookingId);
  }

  return db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.pending },
    include: { session: { include: { class: true } } },
  });
}
