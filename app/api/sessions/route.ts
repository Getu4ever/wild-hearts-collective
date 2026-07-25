import { ensureSeededDatabase } from "@/lib/seed-database";
import { NextResponse } from "next/server";
import { BOOKING_STATUS, formatMoneyFromPence } from "@/lib/booking-config";
import { expireStalePendingBookings, paymentHoldCutoff } from "@/lib/booking-service";
import { db } from "@/lib/db";
import { getMemberSession } from "@/lib/member-auth";
import { resolveBookingPaymentAmountPence } from "@/lib/studio-pricing-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classSlug = searchParams.get("class");

  try {
    await ensureSeededDatabase();
    await expireStalePendingBookings();
    return NextResponse.json(await loadSessions(classSlug));
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return NextResponse.json(
      { error: "Unable to load sessions. Check the database connection." },
      { status: 503 },
    );
  }
}

async function loadSessions(classSlug: string | null) {
  const cutoff = paymentHoldCutoff();
  const memberSession = await getMemberSession();

  const sessions = await db.session.findMany({
    where: {
      startsAt: { gte: new Date() },
      ...(classSlug ? { class: { slug: classSlug } } : {}),
    },
    include: {
      class: true,
      bookings: {
        where: {
          OR: [
            { status: BOOKING_STATUS.confirmed },
            {
              status: BOOKING_STATUS.pending,
              createdAt: { gte: cutoff },
            },
          ],
        },
        select: { id: true, email: true, userId: true },
      },
      waitlist: {
        where: { status: { in: ["waiting", "notified"] } },
        select: { id: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  let memberEmail: string | null = null;
  if (memberSession?.userId) {
    const member = await db.user.findUnique({
      where: { id: memberSession.userId },
      select: { email: true },
    });
    memberEmail = member?.email?.toLowerCase() ?? null;
  }

  const priceBySlug = new Map<string, number>();
  for (const session of sessions) {
    if (!priceBySlug.has(session.class.slug)) {
      priceBySlug.set(
        session.class.slug,
        await resolveBookingPaymentAmountPence(session.class.slug),
      );
    }
  }

  return sessions.map((session) => {
    const heldCount = session.bookings.length;
    const spotsLeft = session.capacity - heldCount;
    const alreadyBooked = Boolean(
      memberSession?.userId &&
        session.bookings.some(
          (booking) =>
            booking.userId === memberSession.userId ||
            (memberEmail != null && booking.email.toLowerCase() === memberEmail),
        ),
    );
    const pricePence = priceBySlug.get(session.class.slug) ?? 0;

    return {
      id: session.id,
      classId: session.classId,
      classSlug: session.class.slug,
      classTitle: session.class.title,
      startsAt: session.startsAt.toISOString(),
      capacity: session.capacity,
      spotsLeft,
      isFull: spotsLeft <= 0,
      waitlistCount: session.waitlist.length,
      alreadyBooked,
      pricePence,
      priceLabel: formatMoneyFromPence(pricePence),
    };
  });
}
