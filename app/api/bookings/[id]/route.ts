import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionPublicTitle } from "@/lib/session-display";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    name: booking.name,
    email: booking.email,
    status: booking.status,
    classTitle: sessionPublicTitle(booking.session),
    startsAt: booking.session.startsAt.toISOString(),
    amountPaid: booking.amountPaid,
  });
}
