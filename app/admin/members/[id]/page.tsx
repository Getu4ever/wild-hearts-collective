import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminMemberDetail } from "@/app/components/admin-member-detail";
import { AdminNav } from "@/app/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { profileSelectFields, toMemberProfile } from "@/lib/member-profile-service";
import { getParQStatus } from "@/lib/parq-service";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Member details",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMemberDetailPage({ params }: PageProps) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      ...profileSelectFields,
      internalNotes: true,
      oauthAccounts: { select: { provider: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!user) notFound();

  const [timeline, recentBookings, auditLogs, parQStatus] = await Promise.all([
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
    getParQStatus(id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <Link href="/admin/members" className="text-sm font-semibold text-brand hover:underline">
            ← Back to members
          </Link>
          <h1 className="mt-3 font-display text-4xl text-plum sm:text-5xl">{user.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Full member profile, safety information, and membership lifecycle controls.
          </p>
          <AdminNav active="members" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminMemberDetail
          memberId={id}
          initialMember={{
            ...toMemberProfile(user),
            internalNotes: user.internalNotes,
            signupMethod: user.oauthAccounts.some((account) => account.provider === "google")
              ? "Google"
              : "Email",
            bookingCount: user._count.bookings,
          }}
          timeline={timeline.map((event) => ({
            id: event.id,
            type: event.type,
            note: event.note,
            effectiveAt: event.effectiveAt.toISOString(),
            endsAt: event.endsAt?.toISOString() ?? null,
            createdBy: event.createdBy,
          }))}
          recentBookings={recentBookings.map((booking) => ({
            id: booking.id,
            status: booking.status,
            attendance: booking.attendance,
            classTitle: booking.session.class.title,
            startsAt: booking.session.startsAt.toISOString(),
          }))}
          auditLogs={auditLogs.map((entry) => ({
            id: entry.id,
            action: entry.action,
            details: entry.details,
            createdAt: entry.createdAt.toISOString(),
          }))}
          parQStatus={{
            completed: parQStatus?.completed ?? false,
            completedAt: parQStatus?.completedAt ?? null,
            data: (parQStatus?.data as Record<string, unknown> | null) ?? null,
          }}
        />
      </div>
    </div>
  );
}
