import { BOOKING_STATUS, WAITLIST_STATUS, getAppBaseUrl } from "@/lib/booking-config";
import { db } from "@/lib/db";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmails,
  sendWaitlistSpotAvailableEmail,
} from "@/lib/email";

type BookingWithSession = {
  id: string;
  name: string;
  email: string;
  status: string;
  session: {
    id: string;
    startsAt: Date;
    capacity: number;
    class: { title: string };
    _count?: { bookings: number };
  };
};

export async function countConfirmedBookings(sessionId: string) {
  return db.booking.count({
    where: {
      sessionId,
      status: BOOKING_STATUS.confirmed,
    },
  });
}

export async function sessionHasCapacity(sessionId: string, capacity: number) {
  const confirmed = await countConfirmedBookings(sessionId);
  return confirmed < capacity;
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

  const confirmed = await countConfirmedBookings(sessionId);
  if (confirmed >= session.capacity) return null;

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

    const hasCapacity = await sessionHasCapacity(
      existing.sessionId,
      sessionRecord.capacity,
    );

    if (
      !hasCapacity &&
      existing.status !== BOOKING_STATUS.confirmed
    ) {
      throw new Error("This session is fully booked.");
    }

    if (existing.status !== BOOKING_STATUS.confirmed) {
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
