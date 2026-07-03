import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDashboardStats } from "@/lib/admin-dashboard-service";
import { formatSessionDateTime } from "@/lib/booking-config";
import {
  membershipPlanLabel,
  membershipStatusLabel,
} from "@/lib/membership-config";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminDashboardPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const stats = await getAdminDashboardStats();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Studio operations at a glance — membership health, today&apos;s classes, and
            safety alerts.
          </p>
          <AdminNav active="dashboard" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active members" value={stats.statusCounts.active} />
        <StatCard label="Paused" value={stats.statusCounts.paused} />
        <StatCard label="Cancelled" value={stats.statusCounts.cancelled} />
        <StatCard label="Total members" value={stats.statusCounts.total} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="New today" value={stats.signUps.today} compact />
        <StatCard label="New (7 days)" value={stats.signUps.week} compact />
        <StatCard label="New (30 days)" value={stats.signUps.month} compact />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-plum">Today&apos;s classes</h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-brand hover:underline">
              All bookings
            </Link>
          </div>
          {stats.todaysSessions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No classes scheduled today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {stats.todaysSessions.map((session) => (
                <li key={session.id} className="py-4">
                  <p className="font-semibold text-plum">{session.class.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatSessionDateTime(session.startsAt)}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {session._count.bookings} booking
                    {session._count.bookings === 1 ? "" : "s"} · capacity {session.capacity}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Safety alerts today</h2>
          <p className="mt-2 text-sm text-muted">
            Members with medical or safety notes booked into today&apos;s sessions.
          </p>
          {stats.safetyAlerts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No safety alerts for today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {stats.safetyAlerts.map((booking) => (
                <li key={booking.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/members/${booking.user?.id}`}
                        className="font-semibold text-plum hover:text-brand hover:underline"
                      >
                        {booking.user?.name ?? booking.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {booking.session.class.title} ·{" "}
                        {formatSessionDateTime(booking.session.startsAt)}
                      </p>
                      <p className="mt-2 text-xs text-brand">
                        {[
                          booking.user?.medicalNotes && "Medical notes",
                          booking.user?.injuriesLimitations && "Injuries/limitations",
                          booking.user?.allergiesSafetyAlerts && "Allergies/alerts",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Upcoming renewals</h2>
          <p className="mt-2 text-sm text-muted">Next 30 days</p>
          {stats.upcomingRenewals.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No renewals due in the next 30 days.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {stats.upcomingRenewals.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="font-semibold text-plum hover:text-brand hover:underline"
                    >
                      {member.name}
                    </Link>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-plum">
                      {member.membershipRenewsAt
                        ? formatDate(member.membershipRenewsAt)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted">
                      {membershipPlanLabel(member.membershipPlan)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Operational notes</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-plum/10 pb-3">
              <dt className="text-muted">Pending booking payments</dt>
              <dd className="font-display text-xl text-plum">{stats.pendingBookings}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-plum/10 pb-3">
              <dt className="text-muted">Expired memberships</dt>
              <dd className="font-display text-xl text-plum">{stats.statusCounts.expired}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Inactive accounts</dt>
              <dd className="font-display text-xl text-plum">{stats.statusCounts.inactive}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-2xl text-plum">Recent admin activity</h2>
        {stats.recentAudit.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No admin actions logged yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-plum/10">
            {stats.recentAudit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold text-plum">{entry.action}</p>
                  {entry.targetUser && (
                    <Link
                      href={`/admin/members/${entry.targetUser.id}`}
                      className="text-brand hover:underline"
                    >
                      {entry.targetUser.name}
                    </Link>
                  )}
                </div>
                <time className="text-xs text-muted">{formatDateTime(entry.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  compact,
}: {
  label: string;
  value: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-plum/10 bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{label}</p>
      <p className={`mt-2 font-display text-plum ${compact ? "text-2xl" : "text-3xl"}`}>
        {value}
      </p>
    </div>
  );
}
