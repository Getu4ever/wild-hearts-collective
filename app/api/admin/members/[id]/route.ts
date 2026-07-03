import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/admin-api";
import {
  profileSelectFields,
  serializeDisciplineInterests,
  toMemberProfile,
} from "@/lib/member-profile-service";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

type AdminMemberBody = {
  name?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  medicalNotes?: string | null;
  injuriesLimitations?: string | null;
  allergiesSafetyAlerts?: string | null;
  experienceLevel?: string | null;
  disciplineInterests?: string[];
  internalNotes?: string | null;
  membershipPlan?: string;
  membershipStatus?: string;
  creditsRemaining?: number;
  accountStatus?: string;
};

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      ...profileSelectFields,
      internalNotes: true,
      updatedAt: true,
      oauthAccounts: { select: { provider: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const [timeline, recentBookings, auditLogs] = await Promise.all([
    db.membershipEvent.findMany({
      where: { userId: id },
      orderBy: { effectiveAt: "desc" },
      take: 20,
    }),
    db.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { session: { include: { class: true } } },
    }),
    db.adminAuditLog.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    member: {
      ...toMemberProfile(user),
      internalNotes: user.internalNotes,
      signupMethod: user.oauthAccounts.some((account) => account.provider === "google")
        ? "Google"
        : "Email",
      bookingCount: user._count.bookings,
      updatedAt: user.updatedAt.toISOString(),
    },
    timeline: timeline.map((event) => ({
      id: event.id,
      type: event.type,
      note: event.note,
      effectiveAt: event.effectiveAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      createdBy: event.createdBy,
    })),
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      attendance: booking.attendance,
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt.toISOString(),
    })),
    auditLogs: auditLogs.map((entry) => ({
      id: entry.id,
      action: entry.action,
      details: entry.details,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let body: AdminMemberBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.emergencyContactName !== undefined) {
    data.emergencyContactName = body.emergencyContactName?.trim() || null;
  }
  if (body.emergencyContactRelationship !== undefined) {
    data.emergencyContactRelationship = body.emergencyContactRelationship?.trim() || null;
  }
  if (body.emergencyContactPhone !== undefined) {
    data.emergencyContactPhone = body.emergencyContactPhone?.trim() || null;
  }
  if (body.medicalNotes !== undefined) data.medicalNotes = body.medicalNotes?.trim() || null;
  if (body.injuriesLimitations !== undefined) {
    data.injuriesLimitations = body.injuriesLimitations?.trim() || null;
  }
  if (body.allergiesSafetyAlerts !== undefined) {
    data.allergiesSafetyAlerts = body.allergiesSafetyAlerts?.trim() || null;
  }
  if (body.experienceLevel !== undefined) data.experienceLevel = body.experienceLevel || null;
  if (body.disciplineInterests !== undefined) {
    data.disciplineInterests = serializeDisciplineInterests(body.disciplineInterests);
  }
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes?.trim() || null;
  if (body.membershipPlan !== undefined) data.membershipPlan = body.membershipPlan;
  if (body.membershipStatus !== undefined) data.membershipStatus = body.membershipStatus;
  if (body.creditsRemaining !== undefined) data.creditsRemaining = body.creditsRemaining;
  if (body.accountStatus !== undefined) data.accountStatus = body.accountStatus;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes submitted." }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: profileSelectFields,
  });

  await logAdminAction({
    action: "member.updated",
    targetUserId: id,
    details: { fields: Object.keys(data) },
  });

  return NextResponse.json({ member: toMemberProfile(updated) });
}
