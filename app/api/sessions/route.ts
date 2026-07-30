import { ensureSeededDatabase } from "@/lib/seed-database";
import { NextResponse } from "next/server";
import { BOOKING_STATUS, formatMoneyFromPence } from "@/lib/booking-config";
import { formatCredits, formatCreditLabel } from "@/lib/credit-units";
import { expireStalePendingBookings, paymentHoldCutoff } from "@/lib/booking-service";
import { db } from "@/lib/db";
import { getMemberSession } from "@/lib/member-auth";
import {
  resolveBookingPaymentAmountPence,
  resolveSessionCreditCost,
} from "@/lib/studio-pricing-service";

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

function durationMinutes(startsAt: Date, endsAt: Date | null, fallback: number) {
  if (!endsAt) return fallback;
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  return minutes > 0 ? minutes : fallback;
}

function formatDurationLabel(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes === 90) return "1.5 hours";
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes} minutes`;
}

async function loadSessions(classSlug: string | null) {
  const cutoff = paymentHoldCutoff();
  const memberSession = await getMemberSession();

  const sessions = await db.session.findMany({
    where: {
      startsAt: { gte: new Date() },
      status: { not: "cancelled" },
      ...(classSlug ? { class: { slug: classSlug } } : {}),
    },
    include: {
      class: true,
      tutor: { select: { id: true, name: true } },
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

  const priced = await Promise.all(
    sessions.map(async (session) => {
      const pricePence = await resolveBookingPaymentAmountPence({
        classSlug: session.class.slug,
        sessionPricePence: session.pricePence,
        classPricePence: session.class.pricePence,
      });
      return { session, pricePence };
    }),
  );

  return priced.map(({ session, pricePence }) => {
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
    const minutes = durationMinutes(
      session.startsAt,
      session.endsAt,
      session.class.duration,
    );
    const creditCost = resolveSessionCreditCost({
      sessionCreditCost: session.creditCost,
      classCreditCost: session.class.creditCost,
    });
    const description =
      session.publicDescription?.trim() ||
      session.class.description?.trim() ||
      null;

    return {
      id: session.id,
      classId: session.classId,
      classSlug: session.class.slug,
      classTitle: session.class.title,
      tutor: session.tutor
        ? { id: session.tutor.id, name: session.tutor.name }
        : null,
      description,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt?.toISOString() ?? null,
      durationMinutes: minutes,
      durationLabel: formatDurationLabel(minutes),
      capacity: session.capacity,
      spotsLeft,
      isFull: spotsLeft <= 0,
      waitlistCount: session.waitlist.length,
      alreadyBooked,
      pricePence,
      priceLabel: formatMoneyFromPence(pricePence),
      creditCost,
      creditCostLabel: formatCreditLabel(creditCost),
      creditCostDisplay: formatCredits(creditCost),
    };
  });
}
