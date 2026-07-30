import {
  clampCapacity,
  computeEndsAt,
  getClassTypeOption,
  getOccupancyLevel,
  occupancyLabel,
  SESSION_STATUS,
} from "@/lib/admin-studio-config";
import { logAdminAction } from "@/lib/admin-audit";
import { BOOKING_STATUS, ukLocalToUtc, UK_TIMEZONE } from "@/lib/booking-config";
import { CANCELLATION_TYPE, requiresParQ } from "@/lib/booking-advanced-config";
import {
  expireStalePendingBookings,
  paymentHoldCutoff,
} from "@/lib/booking-service";
import { parseCreditInput } from "@/lib/credit-units";
import { refundCreditForCancellation } from "@/lib/credit-service";
import { db } from "@/lib/db";
import { sendSessionCancelledEmail } from "@/lib/email";
import { ensureStudioClassTypes } from "@/lib/seed-database";
import { resolveSessionCreditCost } from "@/lib/studio-pricing-service";

export type AdminScheduleRange = "schedule" | "today" | "past";

function ukYmdParts(date = new Date()) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: UK_TIMEZONE,
  })
    .format(date)
    .split("-")
    .map(Number);
  return { year, month, day };
}

/** Start of a UK calendar day as UTC Date. */
export function ukStartOfDay(date = new Date()) {
  const { year, month, day } = ukYmdParts(date);
  return ukLocalToUtc(year, month, day, 0, 0);
}

/** Exclusive end bound: start of the next UK calendar day. */
export function ukEndOfDayExclusive(date = new Date()) {
  const start = ukStartOfDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function resolveAdminScheduleRange(range: AdminScheduleRange = "schedule") {
  const now = new Date();
  const todayStart = ukStartOfDay(now);

  if (range === "today") {
    return {
      range,
      from: todayStart,
      to: ukEndOfDayExclusive(now),
    };
  }

  if (range === "past") {
    return {
      range,
      from: new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }

  // Default "schedule": from start of today (so finished classes today stay visible)
  // through the next 6 weeks.
  return {
    range: "schedule" as const,
    from: todayStart,
    to: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000),
  };
}

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
      select: { id: true, status: true, attendance: true },
    },
    waitlist: {
      where: { status: { in: ["waiting", "notified"] as string[] } },
      select: { id: true },
    },
  };
}

function durationMinutesFromSession(startsAt: Date, endsAt: Date | null, fallback: number) {
  if (!endsAt) return fallback;
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  return minutes > 0 ? minutes : fallback;
}

function mapSessionRecord(session: {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
  capacity: number;
  status: string;
  adminNotes: string | null;
  publicDescription: string | null;
  pricePence: number | null;
  creditCost: number | null;
  class: {
    id: string;
    slug: string;
    title: string;
    description: string;
    duration: number;
    pricePence: number | null;
    creditCost: number;
  };
  tutor: { id: string; name: string } | null;
  bookings: { id: string; status?: string; attendance?: string | null }[];
  waitlist: { id: string }[];
}) {
  const confirmedCount = session.bookings.length;
  const level = getOccupancyLevel(confirmedCount, session.capacity, session.status);
  const durationMinutes = durationMinutesFromSession(
    session.startsAt,
    session.endsAt,
    session.class.duration,
  );
  const creditCost = resolveSessionCreditCost({
    sessionCreditCost: session.creditCost,
    classCreditCost: session.class.creditCost,
  });
  const unmarkedCount = session.bookings.filter(
    (booking) =>
      booking.status === BOOKING_STATUS.confirmed && !booking.attendance,
  ).length;
  const now = Date.now();
  const hasStarted = session.startsAt.getTime() <= now;
  const hasEnded =
    (session.endsAt?.getTime() ??
      session.startsAt.getTime() + durationMinutes * 60_000) <= now;

  return {
    id: session.id,
    classId: session.class.id,
    classSlug: session.class.slug,
    classTitle: session.class.title,
    classDescription: session.class.description,
    publicDescription: session.publicDescription,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt?.toISOString() ?? null,
    durationMinutes,
    capacity: session.capacity,
    confirmedCount,
    waitlistCount: session.waitlist.length,
    spotsLeft: Math.max(session.capacity - confirmedCount, 0),
    occupancyLabel: occupancyLabel(confirmedCount, session.capacity),
    occupancyLevel: level,
    status: session.status,
    adminNotes: session.adminNotes,
    pricePence: session.pricePence,
    creditCost: session.creditCost,
    resolvedCreditCost: creditCost,
    unmarkedAttendanceCount: unmarkedCount,
    needsCheckIn: hasStarted && unmarkedCount > 0,
    hasStarted,
    hasEnded,
    tutor: session.tutor
      ? { id: session.tutor.id, name: session.tutor.name }
      : null,
  };
}

function parseOptionalPricePence(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const pounds =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(pounds) || pounds <= 0) {
    throw new Error("Price must be greater than zero, or leave blank for the studio default.");
  }
  return Math.round(pounds * 100);
}

function parseOptionalCreditCost(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return parseCreditInput(value);
}

export async function listAdminSessions(options?: {
  from?: Date;
  to?: Date;
  range?: AdminScheduleRange;
}) {
  await ensureStudioClassTypes();
  await expireStalePendingBookings();

  const resolved =
    options?.from && options?.to
      ? { from: options.from, to: options.to }
      : resolveAdminScheduleRange(options?.range ?? "schedule");

  const sessions = await db.session.findMany({
    where: {
      startsAt: { gte: resolved.from, lt: resolved.to },
    },
    include: sessionInclude(),
    orderBy: { startsAt: options?.range === "past" ? "desc" : "asc" },
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
              image: true,
              parQCompletedAt: true,
              parQData: true,
              medicalNotes: true,
              injuriesLimitations: true,
              allergiesSafetyAlerts: true,
              creditsRemaining: true,
              oauthAccounts: {
                select: { profileImageUrl: true },
                take: 1,
              },
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
            image:
              booking.user.image ??
              booking.user.oauthAccounts[0]?.profileImageUrl ??
              null,
            creditsRemaining: booking.user.creditsRemaining,
            parQCompleted: Boolean(booking.user.parQCompletedAt),
            parQRequired: requiresParQ(session.class.slug),
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
  publicDescription?: string;
  /** Price in pounds (e.g. 15.50), or null/omit for studio default. */
  pricePounds?: number | string | null;
  creditCost?: number | string | null;
};

export async function createAdminSession(input: CreateSessionInput) {
  await ensureStudioClassTypes();

  if (!getClassTypeOption(input.classSlug)) {
    throw new Error("Unknown class type.");
  }

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
  const pricePence =
    input.pricePounds === undefined
      ? null
      : parseOptionalPricePence(input.pricePounds);
  const creditCost =
    input.creditCost === undefined
      ? null
      : parseOptionalCreditCost(input.creditCost);

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
      publicDescription: input.publicDescription?.trim() || null,
      pricePence,
      creditCost,
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
  publicDescription?: string | null;
  pricePounds?: number | string | null;
  creditCost?: number | string | null;
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
    publicDescription?: string | null;
    pricePence?: number | null;
    creditCost?: number | null;
  } = {};

  if (input.capacity != null) {
    data.capacity = clampCapacity(existing.class.slug, input.capacity);
  }

  if (input.clearTutor) {
    data.tutorId = null;
  } else if (input.tutorId !== undefined) {
    if (input.tutorId) {
      // Allow re-saving an already-assigned tutor even if they were deactivated.
      const keepingCurrent = input.tutorId === existing.tutorId;
      const tutor = await db.tutor.findFirst({
        where: keepingCurrent
          ? { id: input.tutorId }
          : { id: input.tutorId, active: true },
      });
      if (!tutor) throw new Error("Tutor not found.");
    }
    data.tutorId = input.tutorId || null;
  }

  if (input.adminNotes !== undefined) {
    data.adminNotes = input.adminNotes?.trim() || null;
  }

  if (input.publicDescription !== undefined) {
    data.publicDescription = input.publicDescription?.trim() || null;
  }

  if (input.pricePounds !== undefined) {
    data.pricePence = parseOptionalPricePence(input.pricePounds);
  }

  if (input.creditCost !== undefined) {
    data.creditCost = parseOptionalCreditCost(input.creditCost);
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

const tutorAdminSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { sessions: true } },
} as const;

/** Active tutors only — used by session assignment dropdowns. */
export async function listAdminTutors() {
  await ensureDefaultTutors();
  return db.tutor.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, bio: true },
  });
}

/** All tutors including inactive — used by staff management page. */
export async function listAllAdminTutors() {
  await ensureDefaultTutors();
  return db.tutor.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: tutorAdminSelect,
  });
}

export async function getAdminTutor(id: string) {
  return db.tutor.findUnique({
    where: { id },
    select: tutorAdminSelect,
  });
}

type TutorInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  active?: boolean;
};

function normalizeTutorInput(input: TutorInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required.");

  return {
    name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    bio: input.bio?.trim() || null,
    active: input.active ?? true,
  };
}

export async function createAdminTutor(input: TutorInput) {
  const data = normalizeTutorInput(input);
  return db.tutor.create({
    data,
    select: tutorAdminSelect,
  });
}

export async function updateAdminTutor(id: string, input: Partial<TutorInput>) {
  const existing = await db.tutor.findUnique({ where: { id } });
  if (!existing) throw new Error("Instructor not found.");

  const data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;
    active?: boolean;
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Name is required.");
    data.name = name;
  }
  if (input.email !== undefined) data.email = input.email?.trim() || null;
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
  if (input.bio !== undefined) data.bio = input.bio?.trim() || null;
  if (input.active !== undefined) data.active = input.active;

  return db.tutor.update({
    where: { id },
    data,
    select: tutorAdminSelect,
  });
}

/**
 * Soft-deactivate when the tutor has sessions; otherwise hard-delete.
 * Returns `{ deleted: true }` or `{ deactivated: true }`.
 */
export async function removeAdminTutor(id: string) {
  const existing = await db.tutor.findUnique({
    where: { id },
    include: { _count: { select: { sessions: true } } },
  });
  if (!existing) throw new Error("Instructor not found.");

  if (existing._count.sessions > 0) {
    const tutor = await db.tutor.update({
      where: { id },
      data: { active: false },
      select: tutorAdminSelect,
    });
    return { deactivated: true as const, tutor };
  }

  await db.tutor.delete({ where: { id } });
  return { deleted: true as const };
}

export async function listAdminClasses() {
  await ensureStudioClassTypes();
  return db.class.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      duration: true,
      maxCapacity: true,
      pricePence: true,
      creditCost: true,
    },
  });
}

type UpsertClassInput = {
  slug: string;
  title: string;
  description: string;
  duration?: number;
  maxCapacity?: number;
  pricePence?: number | null;
  creditCost?: number;
};

export async function upsertAdminClass(input: UpsertClassInput) {
  const maxCapacity = input.maxCapacity ?? 12;
  const creditCost =
    input.creditCost != null ? parseCreditInput(input.creditCost) : undefined;
  return db.class.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      duration: input.duration ?? 60,
      maxCapacity,
      ...(input.pricePence !== undefined ? { pricePence: input.pricePence } : {}),
      ...(creditCost !== undefined ? { creditCost } : {}),
    },
    create: {
      slug: input.slug,
      title: input.title,
      description: input.description,
      duration: input.duration ?? 60,
      maxCapacity,
      pricePence: input.pricePence ?? null,
      creditCost: creditCost ?? 1,
    },
  });
}
