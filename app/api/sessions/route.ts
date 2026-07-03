import { ensureSeededDatabase } from "@/lib/seed-database";
import { NextResponse } from "next/server";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classSlug = searchParams.get("class");

  try {
    await ensureSeededDatabase();
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
  const sessions = await db.session.findMany({
    where: {
      startsAt: { gte: new Date() },
      ...(classSlug ? { class: { slug: classSlug } } : {}),
    },
    include: {
      class: true,
      bookings: {
        where: { status: BOOKING_STATUS.confirmed },
        select: { id: true },
      },
      waitlist: {
        where: { status: { in: ["waiting", "notified"] } },
        select: { id: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return sessions.map((session) => {
    const confirmedCount = session.bookings.length;
    const spotsLeft = session.capacity - confirmedCount;

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
    };
  });
}
