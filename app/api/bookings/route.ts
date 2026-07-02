import { NextResponse } from "next/server";
import { BOOKING_STATUS, isStripeConfigured } from "@/lib/booking-config";
import {
  countConfirmedBookings,
  confirmBooking,
} from "@/lib/booking-service";
import { db } from "@/lib/db";
import {
  sendBookingReceivedEmails,
  sendWaitlistJoinedEmails,
} from "@/lib/email";
import { getMemberSession } from "@/lib/member-auth";
import { createBookingCheckoutSession, depositLabel } from "@/lib/stripe";

type BookingBody = {
  sessionId?: string;
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  joinWaitlist?: boolean;
};

export async function POST(request: Request) {
  let body: BookingBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { sessionId, name, email, phone, notes, joinWaitlist } = body;

  if (!sessionId || !name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Session, name, and email are required." },
      { status: 400 },
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session || session.startsAt < new Date()) {
    return NextResponse.json({ error: "This session is no longer available." }, { status: 404 });
  }

  const confirmedCount = await countConfirmedBookings(sessionId);
  const spotsLeft = session.capacity - confirmedCount;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const memberSession = await getMemberSession();
  const userId = memberSession?.userId ?? null;

  if (spotsLeft <= 0) {
    if (!joinWaitlist) {
      return NextResponse.json(
        {
          error: "This session is fully booked.",
          waitlistAvailable: true,
        },
        { status: 409 },
      );
    }

    const existingWaitlist = await db.waitlistEntry.findFirst({
      where: {
        sessionId,
        email: normalizedEmail,
        status: { in: ["waiting", "notified"] },
      },
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { error: "You are already on the waitlist for this session." },
        { status: 409 },
      );
    }

    const waitlistEntry = await db.waitlistEntry.create({
      data: {
        sessionId,
        userId,
        name: normalizedName,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        session: { include: { class: true } },
      },
    });

    await sendWaitlistJoinedEmails(
      { name: waitlistEntry.name, email: waitlistEntry.email },
      {
        classTitle: waitlistEntry.session.class.title,
        startsAt: waitlistEntry.session.startsAt,
      },
    );

    return NextResponse.json({
      type: "waitlist",
      id: waitlistEntry.id,
      name: waitlistEntry.name,
      email: waitlistEntry.email,
      classTitle: waitlistEntry.session.class.title,
      startsAt: waitlistEntry.session.startsAt.toISOString(),
    });
  }

  const booking = await db.booking.create({
    data: {
      sessionId,
      userId,
      name: normalizedName,
      email: normalizedEmail,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
      status: BOOKING_STATUS.pending,
    },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!isStripeConfigured()) {
    const confirmed = await confirmBooking(booking.id);

    return NextResponse.json({
      type: "booking",
      id: confirmed.id,
      name: confirmed.name,
      email: confirmed.email,
      status: confirmed.status,
      classTitle: confirmed.session.class.title,
      startsAt: confirmed.session.startsAt.toISOString(),
      paymentSkipped: true,
    });
  }

  const checkout = await createBookingCheckoutSession({
    id: booking.id,
    email: booking.email,
    name: booking.name,
    classTitle: booking.session.class.title,
    startsAt: booking.session.startsAt,
  });

  await db.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: checkout.id },
  });

  await sendBookingReceivedEmails(
    { name: booking.name, email: booking.email },
    {
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt,
    },
  );

  return NextResponse.json({
    type: "booking",
    id: booking.id,
    name: booking.name,
    email: booking.email,
    status: booking.status,
    classTitle: booking.session.class.title,
    startsAt: booking.session.startsAt.toISOString(),
    checkoutUrl: checkout.url,
    depositLabel: depositLabel(),
  });
}
