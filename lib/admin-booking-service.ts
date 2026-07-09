import { logAdminAction } from "@/lib/admin-audit";
import { countConfirmedBookings } from "@/lib/booking-service";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { CANCELLATION_TYPE } from "@/lib/booking-advanced-config";
import { refundCreditForCancellation } from "@/lib/credit-service";
import { db } from "@/lib/db";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmails,
} from "@/lib/email";

type RemoveBookingOptions = {
  refundCredit: boolean;
};

export async function removeBookingAsAdmin(
  bookingId: string,
  options: RemoveBookingOptions,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
      user: { select: { id: true } },
    },
  });

  if (!booking) return null;
  if (booking.status === BOOKING_STATUS.cancelled) {
    throw new Error("This booking is already cancelled.");
  }

  const cancellationType = options.refundCredit
    ? CANCELLATION_TYPE.onTime
    : CANCELLATION_TYPE.lateCancelled;

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BOOKING_STATUS.cancelled,
      cancellationType,
    },
  });

  let creditRefunded = false;

  if (options.refundCredit && booking.paidWithCredit && booking.userId) {
    const result = await refundCreditForCancellation(booking.userId, bookingId);
    creditRefunded = result.refunded;
  }

  await sendBookingCancelledEmail(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
  );

  await logAdminAction({
    action: "booking_removed",
    targetUserId: booking.userId ?? undefined,
    details: {
      bookingId,
      refundCredit: options.refundCredit,
      creditRefunded,
    },
  });

  return {
    bookingId,
    creditRefunded,
    cancellationType,
  };
}

export async function deleteBookingAsAdmin(
  bookingId: string,
  options?: { refundCredit?: boolean },
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
      user: { select: { id: true } },
    },
  });

  if (!booking) return null;

  const wasConfirmed = booking.status === BOOKING_STATUS.confirmed;
  let creditRefunded = false;

  if (options?.refundCredit && booking.paidWithCredit && booking.userId) {
    const result = await refundCreditForCancellation(booking.userId, bookingId);
    creditRefunded = result.refunded;
  }

  await db.booking.delete({ where: { id: bookingId } });

  if (wasConfirmed) {
    const { notifyNextWaitlistEntry } = await import("@/lib/booking-service");
    await notifyNextWaitlistEntry(booking.sessionId);
  }

  await logAdminAction({
    action: "booking_deleted",
    targetUserId: booking.userId ?? undefined,
    details: {
      bookingId,
      email: booking.email,
      refundCredit: Boolean(options?.refundCredit),
      creditRefunded,
    },
  });

  return { bookingId, deleted: true as const, creditRefunded };
}

type ForceBookInput = {
  sessionId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  deductCredit?: boolean;
};

export async function forceBookAsAdmin(input: ForceBookInput) {
  const session = await db.session.findUnique({
    where: { id: input.sessionId },
    include: { class: true },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  if (session.status === "cancelled") {
    throw new Error("Cannot book into a cancelled session.");
  }

  if (session.startsAt < new Date()) {
    throw new Error("Cannot force-book into a past session.");
  }

  let userId = input.userId ?? null;
  let name = input.name.trim();
  let email = input.email.trim().toLowerCase();
  let phone = input.phone?.trim() || null;

  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (!user) throw new Error("Member not found.");
    name = user.name;
    email = user.email;
    phone = user.phone;
  }

  const duplicate = await db.booking.findFirst({
    where: {
      sessionId: input.sessionId,
      email,
      status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.confirmed] },
    },
  });

  if (duplicate) {
    throw new Error("This student already has a booking for this session.");
  }

  const booking = await db.booking.create({
    data: {
      sessionId: input.sessionId,
      userId,
      name,
      email,
      phone,
      notes: input.notes?.trim() || null,
      status: BOOKING_STATUS.confirmed,
    },
    include: {
      session: { include: { class: true } },
    },
  });

  if (input.deductCredit && userId) {
    const { deductCreditForBooking } = await import("@/lib/credit-service");
    try {
      await deductCreditForBooking(userId, booking.id);
    } catch {
      await db.booking.delete({ where: { id: booking.id } });
      throw new Error("Unable to deduct credit — member may have zero credits.");
    }
  }

  await sendBookingConfirmedEmails(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
    booking.amountPaid,
  );

  await logAdminAction({
    action: "booking_force_created",
    targetUserId: userId ?? undefined,
    details: {
      bookingId: booking.id,
      sessionId: input.sessionId,
      deductCredit: Boolean(input.deductCredit),
      overrideCapacity: true,
    },
  });

  const confirmedCount = await countConfirmedBookings(input.sessionId);

  return {
    booking: {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      status: booking.status,
    },
    confirmedCount,
    capacity: session.capacity,
  };
}

export async function searchMembersForBooking(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  return db.user.findMany({
    where: {
      OR: [
        { email: { contains: trimmed, mode: "insensitive" } },
        { name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      creditsRemaining: true,
      parQCompletedAt: true,
    },
  });
}
