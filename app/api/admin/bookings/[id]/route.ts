import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { updateBookingStatus } from "@/lib/booking-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let status = "";

  try {
    const body = await request.json();
    status = typeof body.status === "string" ? body.status : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
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
