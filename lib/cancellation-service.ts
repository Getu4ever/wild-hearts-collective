import {
  BOOKING_STATUS,
} from "@/lib/booking-config";
import {
  CANCELLATION_TYPE,
  isWithinCancellationWindow,
} from "@/lib/booking-advanced-config";
import { cancelBooking } from "@/lib/booking-service";
import { refundCreditForCancellation } from "@/lib/credit-service";
import { db } from "@/lib/db";
import { getMemberSession } from "@/lib/member-auth";

export class CancellationPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CancellationPolicyError";
  }
}

export async function cancelMemberBooking(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!booking || booking.userId !== userId) {
    throw new CancellationPolicyError("Booking not found.");
  }

  if (booking.status === BOOKING_STATUS.cancelled) {
    throw new CancellationPolicyError("This booking is already cancelled.");
  }

  if (booking.session.startsAt < new Date()) {
    throw new CancellationPolicyError("Past sessions cannot be cancelled online.");
  }

  const onTime = isWithinCancellationWindow(booking.session.startsAt);
  const cancellationType = onTime
    ? CANCELLATION_TYPE.onTime
    : CANCELLATION_TYPE.lateCancelled;

  await db.booking.update({
    where: { id: bookingId },
    data: { cancellationType },
  });

  let creditRefunded = false;

  if (onTime && booking.paidWithCredit) {
    const result = await refundCreditForCancellation(userId, bookingId);
    creditRefunded = result.refunded;
  }

  await cancelBooking(bookingId, {
    cancelledBy: "member",
    creditRefunded,
  });

  return {
    bookingId,
    cancellationType,
    creditRefunded,
    message: onTime
      ? creditRefunded
        ? "Your booking was cancelled and your class credit has been returned."
        : "Your booking was cancelled."
      : "Your booking was cancelled within 24 hours of the class start time. No credit refund applies under our cancellation policy.",
  };
}

export async function handleMemberCancelRequest(bookingId: string) {
  const session = await getMemberSession();

  if (!session) {
    throw new CancellationPolicyError("Please sign in to cancel a booking.");
  }

  return cancelMemberBooking(bookingId, session.userId);
}
