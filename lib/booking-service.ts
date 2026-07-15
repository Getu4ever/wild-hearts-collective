import {
  BOOKING_STATUS,
  WAITLIST_STATUS,
  formatMoneyFromPence,
  getAppBaseUrl,
  isStripeConfigured,
} from "@/lib/booking-config";
import {
  CANCELLATION_TYPE,
  PAYMENT_HOLD_MS,
} from "@/lib/booking-advanced-config";
import { db } from "@/lib/db";
import {
  sendBookingCancelledEmails,
  sendBookingConfirmedEmails,
  sendUnpaidBookingExpiredAdminEmail,
  sendWaitlistSpotAvailableEmail,
} from "@/lib/email";
import { restoreGiftCardBalance } from "@/lib/gift-card-service";

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
 * Cancel a pending booking after unpaid checkout timed out.
 * Emails the studio only (not the member — they abandoned payment).
 */
export async function cancelBookingForPaymentExpiry(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!booking || booking.status !== BOOKING_STATUS.pending) {
    return null;
  }

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BOOKING_STATUS.cancelled,
      cancellationType: CANCELLATION_TYPE.paymentExpired,
    },
    include: {
      session: { include: { class: true } },
    },
  });

  if (booking.giftCardId && booking.giftAmountApplied && booking.giftAmountApplied > 0) {
    try {
      await restoreGiftCardBalance(booking.giftCardId, booking.giftAmountApplied, {
        bookingId: booking.id,
        userId: booking.userId,
      });
    } catch (error) {
      console.error("[gift-card:restore-on-expiry]", bookingId, error);
    }
  }

  try {
    await sendUnpaidBookingExpiredAdminEmail(
      { name: updated.name, email: updated.email },
      {
        classTitle: updated.session.class.title,
        startsAt: updated.session.startsAt,
      },
    );
  } catch (error) {
    console.error("[email:unpaid-booking-expired]", bookingId, error);
  }

  return updated;
}

/**
 * Cancel unpaid pending bookings older than the payment hold window and release
 * their spots. Notifies the studio; does not email the customer (abandoned checkout).
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

    const cancelled = await cancelBookingForPaymentExpiry(booking.id);

    if (booking.stripeSessionId) {
      await expireStripeCheckoutSession(booking.stripeSessionId);
    }

    if (cancelled) {
      expired += 1;
      releasedSessionIds.add(booking.sessionId);
    }
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
  options?: {
    stripePaymentId?: string;
    amountPaid?: number;
    /** Human-readable payment line for confirmation emails (gift card, credit, etc.). */
    paymentSummary?: string;
  },
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
      giftCard: { select: { code: true } },
    },
  });

  let paymentSummary = options?.paymentSummary;
  if (!paymentSummary) {
    if (booking.paidWithCredit) {
      paymentSummary = "Paid with 1 class credit";
    } else if (booking.giftAmountApplied && booking.giftAmountApplied > 0) {
      const giftLabel = formatMoneyFromPence(booking.giftAmountApplied);
      const cardPaid =
        options?.amountPaid && options.amountPaid > 0
          ? ` + ${formatMoneyFromPence(options.amountPaid)} card`
          : "";
      paymentSummary = `Gift card ${giftLabel}${cardPaid}${
        booking.giftCard?.code ? ` (${booking.giftCard.code})` : ""
      }`;
    } else if (booking.voucherId) {
      paymentSummary = "Complimentary (reward voucher)";
    }
  }

  await sendBookingConfirmedEmails(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
    options?.amountPaid ?? booking.amountPaid,
    paymentSummary,
  );

  return booking;
}

export async function cancelBooking(
  bookingId: string,
  options?: {
    cancelledBy?: "member" | "admin" | "system";
    creditRefunded?: boolean;
  },
) {
  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.cancelled },
    include: {
      session: { include: { class: true } },
    },
  });

  await sendBookingCancelledEmails(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
    {
      cancelledBy: options?.cancelledBy ?? "member",
      cancellationType: booking.cancellationType,
      creditRefunded: options?.creditRefunded,
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
    return cancelBooking(bookingId, { cancelledBy: "admin" });
  }

  return db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.pending },
    include: { session: { include: { class: true } } },
  });
}
