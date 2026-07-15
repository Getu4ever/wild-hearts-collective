import {
  clampCapacity,
  computeEndsAt,
  getOccupancyLevel,
  occupancyLabel,
  SESSION_STATUS,
} from "@/lib/admin-studio-config";
import { logAdminAction } from "@/lib/admin-audit";
import { BOOKING_STATUS, ukLocalToUtc, UK_TIMEZONE } from "@/lib/booking-config";
import { CANCELLATION_TYPE } from "@/lib/booking-advanced-config";
import {
  expireStalePendingBookings,
  paymentHoldCutoff,
} from "@/lib/booking-service";
import { refundCreditForCancellation } from "@/lib/credit-service";
import { db } from "@/lib/db";
import { sendSessionCancelledEmail } from "@/lib/email";

function heldBookingsWhere() {
  return {
    OR: [
      { status: BOOKING_STATUS.confirmed },
      {
        status: BOOKING_STATUS.pending,
        createdAt: { gte: paymentHoldCutoff() },
      },
    ],
  };
}

function sessionInclude() {
  return {
    class: true,
    tutor: true,
    bookings: {
      where: heldBookingsWhere(),
      select: { id: true },
    },
    waitlist: {
      where: { status: { in: ["waiting", "notified"] as string[] } },
      select: { id: true },
    },
  };
}

function mapSessionRecord(session: {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
  capacity: number;
  status: string;
  adminNotes: string | null;
  class: { id: string; slug: string; title: string; duration: number };
  tutor: { id: string; name: string } | null;
  bookings: { id: string }[];
  waitlist: { id: string }[];
}) {
  const confirmedCount = session.bookings.length;
  const level = getOccupancyLevel(confirmedCount, session.capacity, session.status);

  return {
    id: session.id,
    classId: session.class.id,
    classSlug: session.class.slug,
    classTitle: session.class.title,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt?.toISOString() ?? null,
    capacity: session.capacity,
    confirmedCount,
    waitlistCount: session.waitlist.length,
    spotsLeft: Math.max(session.capacity - confirmedCount, 0),
    occupancyLabel: occupancyLabel(confirmedCount, session.capacity),
    occupancyLevel: level,
    status: session.status,
    adminNotes: session.adminNotes,
    tutor: session.tutor
      ? { id: session.tutor.id, name: session.tutor.name }
      : null,
  };
}

export async function listAdminSessions(options?: {
  from?: Date;
  to?: Date;
}) {
  await expireStalePendingBookings();

  const now = new Date();
  const from = options?.from ?? now;
  const to =
    options?.to ??
    new Date(now.getTime() + 1000 * 60 * 60 * 24 * 42);

  const sessions = await db.session.findMany({
    where: {
      startsAt: { gte: from, lte: to },
    },
    include: sessionInclude(),
    orderBy: { startsAt: "asc" },
  });

  return sessions.map(mapSessionRecord);
}

export async function getAdminSessionRoster(sessionId: string) {
  await expireStalePendingBookings({ sessionId });

  const cutoff = paymentHoldCutoff();
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      tutor: true,
      bookings: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              parQCompletedAt: true,
              parQData: true,
              medicalNotes: true,
              injuriesLimitations: true,
              allergiesSafetyAlerts: true,
              creditsRemaining: true,
            },
          },
        },
      },
      waitlist: {
        where: { status: { in: ["waiting", "notified"] } },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              parQCompletedAt: true,
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  const summary = mapSessionRecord({
    ...session,
    bookings: session.bookings.filter(
      (b) =>
        b.status === BOOKING_STATUS.confirmed ||
        (b.status === BOOKING_STATUS.pending && b.createdAt >= cutoff),
    ),
    waitlist: session.waitlist,
  });

  return {
    session: summary,
    bookings: session.bookings.map((booking) => ({
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      status: booking.status,
      attendance: booking.attendance,
      paidWithCredit: booking.paidWithCredit,
      giftAmountApplied: booking.giftAmountApplied,
      voucherId: booking.voucherId,
      amountPaid: booking.amountPaid,
      cancellationType: booking.cancellationType,
      createdAt: booking.createdAt.toISOString(),
      userId: booking.userId,
      user: booking.user
        ? {
            id: booking.user.id,
            name: booking.user.name,
            email: booking.user.email,
            phone: booking.user.phone,
            creditsRemaining: booking.user.creditsRemaining,
            parQCompleted: Boolean(booking.user.parQCompletedAt),
            parQRequired: ["pole", "aerial-hoop", "aerial-silks"].includes(
              session.class.slug,
            ),
            safetyNotes: [
              booking.user.medicalNotes,
              booking.user.injuriesLimitations,
              booking.user.allergiesSafetyAlerts,
            ].filter((note): note is string => Boolean(note)),
          }
        : null,
    })),
    waitlist: session.waitlist.map((entry, index) => ({
      id: entry.id,
      position: index + 1,
      name: entry.name,
      email: entry.email,
      status: entry.status,
      userId: entry.userId,
      parQCompleted: Boolean(entry.user?.parQCompletedAt),
    })),
  };
}

type CreateSessionInput = {
  classSlug: string;
  date: string;
  startTime: string;
  endTime?: string;
  capacity: number;
  tutorId?: string | null;
  adminNotes?: string;
};

export async function createAdminSession(input: CreateSessionInput) {
  const classRecord = await db.class.findUnique({
    where: { slug: input.classSlug },
  });

  if (!classRecord) {
    throw new Error("Class type not found.");
  }

  const [year, month, day] = input.date.split("-").map(Number);
  const [startHour, startMinute] = input.startTime.split(":").map(Number);
  const startsAt = ukLocalToUtc(year, month, day, startHour, startMinute);

  let endsAt: Date;
  if (input.endTime) {
    const [endHour, endMinute] = input.endTime.split(":").map(Number);
    endsAt = ukLocalToUtc(year, month, day, endHour, endMinute);
    if (endsAt <= startsAt) {
      throw new Error("End time must be after start time.");
    }
  } else {
    endsAt = computeEndsAt(startsAt, classRecord.duration);
  }

  const capacity = clampCapacity(classRecord.slug, input.capacity);

  if (input.tutorId) {
    const tutor = await db.tutor.findFirst({
      where: { id: input.tutorId, active: true },
    });
    if (!tutor) throw new Error("Tutor not found.");
  }

  const session = await db.session.create({
    data: {
      classId: classRecord.id,
      startsAt,
      endsAt,
      capacity,
      tutorId: input.tutorId || null,
      adminNotes: input.adminNotes?.trim() || null,
      status: SESSION_STATUS.scheduled,
    },
    include: sessionInclude(),
  });

  await logAdminAction({
    action: "session_created",
    details: {
      sessionId: session.id,
      classSlug: classRecord.slug,
      startsAt: startsAt.toISOString(),
    },
  });

  return mapSessionRecord(session);
}

type UpdateSessionInput = {
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  tutorId?: string | null;
  adminNotes?: string | null;
  clearTutor?: boolean;
};

export async function updateAdminSession(sessionId: string, input: UpdateSessionInput) {
  const existing = await db.session.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!existing) return null;
  if (existing.status === SESSION_STATUS.cancelled) {
    throw new Error("Cancelled sessions cannot be edited.");
  }

  const data: {
    startsAt?: Date;
    endsAt?: Date;
    capacity?: number;
    tutorId?: string | null;
    adminNotes?: string | null;
  } = {};

  if (input.capacity != null) {
    data.capacity = clampCapacity(existing.class.slug, input.capacity);
  }

  if (input.clearTutor) {
    data.tutorId = null;
  } else if (input.tutorId !== undefined) {
    if (input.tutorId) {
      const tutor = await db.tutor.findFirst({
        where: { id: input.tutorId, active: true },
      });
      if (!tutor) throw new Error("Tutor not found.");
    }
    data.tutorId = input.tutorId || null;
  }

  if (input.adminNotes !== undefined) {
    data.adminNotes = input.adminNotes?.trim() || null;
  }

  if (input.date && input.startTime) {
    const [year, month, day] = input.date.split("-").map(Number);
    const [startHour, startMinute] = input.startTime.split(":").map(Number);
    const startsAt = ukLocalToUtc(year, month, day, startHour, startMinute);
    data.startsAt = startsAt;

    if (input.endTime) {
      const [endHour, endMinute] = input.endTime.split(":").map(Number);
      data.endsAt = ukLocalToUtc(year, month, day, endHour, endMinute);
    } else {
      data.endsAt = computeEndsAt(startsAt, existing.class.duration);
    }
  } else if (input.endTime && existing.startsAt) {
    const ukDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: UK_TIMEZONE,
    }).format(existing.startsAt);
    const [year, month, day] = ukDate.split("-").map(Number);
    const [endHour, endMinute] = input.endTime.split(":").map(Number);
    data.endsAt = ukLocalToUtc(year, month, day, endHour, endMinute);
  }

  const session = await db.session.update({
    where: { id: sessionId },
    data,
    include: sessionInclude(),
  });

  await logAdminAction({
    action: "session_updated",
    details: { sessionId, changes: input },
  });

  return mapSessionRecord(session);
}

export async function cancelAdminSession(sessionId: string, reason?: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      bookings: {
        where: { status: BOOKING_STATUS.confirmed },
        include: { user: { select: { id: true } } },
      },
    },
  });

  if (!session) return null;
  if (session.status === SESSION_STATUS.cancelled) {
    throw new Error("This session is already cancelled.");
  }

  const cancelledBookings: string[] = [];

  for (const booking of session.bookings) {
    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.cancelled,
        cancellationType: CANCELLATION_TYPE.onTime,
      },
    });

    if (booking.paidWithCredit && booking.userId) {
      await refundCreditForCancellation(booking.userId, booking.id);
    }

    await sendSessionCancelledEmail(
      { name: booking.name, email: booking.email },
      {
        classTitle: session.class.title,
        startsAt: session.startsAt,
        reason: reason ?? "This class has been cancelled by the studio.",
      },
    );

    cancelledBookings.push(booking.id);
  }

  await db.waitlistEntry.updateMany({
    where: { sessionId, status: { in: ["waiting", "notified"] } },
    data: { status: "cancelled" },
  });

  await db.session.update({
    where: { id: sessionId },
    data: {
      status: SESSION_STATUS.cancelled,
      adminNotes: reason
        ? [session.adminNotes, `Cancelled: ${reason}`].filter(Boolean).join("\n")
        : session.adminNotes,
    },
  });

  await logAdminAction({
    action: "session_cancelled",
    details: {
      sessionId,
      reason: reason ?? null,
      bookingsCancelled: cancelledBookings.length,
    },
  });

  return {
    sessionId,
    bookingsCancelled: cancelledBookings.length,
  };
}

export async function ensureDefaultTutors() {
  for (const tutor of [
    { name: "Rosie", bio: "Co-founder & pole instructor" },
    { name: "Jacqui", bio: "Co-founder & aerial instructor" },
    { name: "Sarah", bio: "Aerial instructor" },
  ]) {
    const existing = await db.tutor.findFirst({ where: { name: tutor.name } });
    if (!existing) {
      await db.tutor.create({ data: tutor });
    }
  }
}

export async function listAdminTutors() {
  await ensureDefaultTutors();
  return db.tutor.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, bio: true },
  });
}

export async function listAdminClasses() {
  return db.class.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      duration: true,
      maxCapacity: true,
    },
  });
}

type UpsertClassInput = {
  slug: string;
  title: string;
  description: string;
  duration?: number;
  maxCapacity?: number;
};

export async function upsertAdminClass(input: UpsertClassInput) {
  const maxCapacity = input.maxCapacity ?? 12;
  return db.class.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      duration: input.duration ?? 60,
      maxCapacity,
    },
    create: {
      slug: input.slug,
      title: input.title,
      description: input.description,
      duration: input.duration ?? 60,
      maxCapacity,
    },
  });
}
