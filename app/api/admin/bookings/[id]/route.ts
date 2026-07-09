import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { removeBookingAsAdmin, deleteBookingAsAdmin } from "@/lib/admin-booking-service";
import { ATTENDANCE_STATUS } from "@/lib/booking-advanced-config";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { updateBookingStatus } from "@/lib/booking-service";
import { flagNoShowEngagement } from "@/lib/engagement-service";
import { recordAttendanceAndAwardMilestones } from "@/lib/voucher-service";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let status = "";
  let attendance = "";
  let action = "";
  let refundCredit = false;

  try {
    const body = await request.json();
    status = typeof body.status === "string" ? body.status : "";
    attendance = typeof body.attendance === "string" ? body.attendance : "";
    action = typeof body.action === "string" ? body.action : "";
    refundCredit = body.refundCredit === true;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (action === "remove") {
    try {
      const result = await removeBookingAsAdmin(id, { refundCredit });
      if (!result) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove booking.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === "delete") {
    try {
      const result = await deleteBookingAsAdmin(id, { refundCredit });
      if (!result) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete booking.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (attendance) {
    if (
      attendance !== ATTENDANCE_STATUS.attended &&
      attendance !== ATTENDANCE_STATUS.noShow
    ) {
      return NextResponse.json({ error: "Invalid attendance value." }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, attendance: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (attendance === ATTENDANCE_STATUS.attended && booking.userId) {
      const result = await recordAttendanceAndAwardMilestones(booking.userId, booking.id);
      return NextResponse.json({
        id: booking.id,
        attendance: ATTENDANCE_STATUS.attended,
        milestonesAwarded: result.milestonesAwarded,
      });
    }

    await db.booking.update({
      where: { id },
      data: { attendance },
    });

    if (attendance === ATTENDANCE_STATUS.noShow && booking.userId) {
      await flagNoShowEngagement(booking.userId, booking.id);
    }

    return NextResponse.json({ id: booking.id, attendance });
  }

  if (
    status !== BOOKING_STATUS.pending &&
    status !== BOOKING_STATUS.confirmed &&
    status !== BOOKING_STATUS.cancelled
  ) {
    return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
  }

  try {
    const booking = await updateBookingStatus(id, status);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update booking.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
