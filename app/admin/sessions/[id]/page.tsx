import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminCapacityBadge } from "@/app/components/admin-capacity-badge";
import { AdminSessionForm } from "@/app/components/admin-session-form";
import {
  AdminCancelSessionButton,
  AdminForceBookForm,
  AdminSessionRosterPanel,
} from "@/app/components/admin-session-roster-panel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSessionTimeRange, SESSION_STATUS } from "@/lib/admin-studio-config";
import { formatSessionDateTime, UK_TIMEZONE } from "@/lib/booking-config";
import { getAdminSessionRoster } from "@/lib/admin-session-service";

export const metadata: Metadata = {
  title: "Session Roster",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function toUkDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: UK_TIMEZONE }).format(date);
}

function toUkTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function AdminSessionDetailPage({ params }: PageProps) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { id } = await params;
  const roster = await getAdminSessionRoster(id);

  if (!roster) notFound();

  const { session } = roster;
  const startsAt = new Date(session.startsAt);
  const endsAt = session.endsAt ? new Date(session.endsAt) : null;
  const cancelled = session.status === SESSION_STATUS.cancelled;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Session roster
          </p>
          <h1 className="font-display text-4xl text-plum sm:text-5xl">{session.classTitle}</h1>
          <p className="mt-3 text-sm text-muted">
            {formatSessionDateTime(startsAt)} ·{" "}
            {formatSessionTimeRange(startsAt, endsAt)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Tutor:{" "}
            <span className="font-medium text-plum">
              {session.tutor?.name ?? "Unassigned"}
            </span>
          </p>
          <div className="mt-3">
            <AdminCapacityBadge
              confirmed={session.confirmedCount}
              capacity={session.capacity}
              status={session.status}
            />
          </div>
          <AdminNav active="schedule" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 space-y-10">
        <AdminSessionRosterPanel
          sessionId={id}
          bookings={roster.bookings}
          waitlist={roster.waitlist}
        />

        {!cancelled && (
          <>
            <section id="edit">
              <h2 className="font-display text-3xl text-plum">Edit session</h2>
              <p className="mt-2 text-sm text-muted">
                Update the time, capacity, tutor assignment, or admin notes.
              </p>
              <div className="mt-4">
                <AdminSessionForm
                  mode="edit"
                  sessionId={id}
                  initial={{
                    classSlug: session.classSlug,
                    date: toUkDate(startsAt),
                    startTime: toUkTime(startsAt),
                    endTime: endsAt ? toUkTime(endsAt) : "",
                    capacity: session.capacity,
                    tutorId: session.tutor?.id ?? null,
                    adminNotes: session.adminNotes,
                  }}
                />
              </div>
            </section>

            <AdminForceBookForm sessionId={id} />
            <AdminCancelSessionButton sessionId={id} />
          </>
        )}
      </div>

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin/schedule" className="font-medium text-plum hover:text-brand hover:underline">
          Back to schedule
        </Link>
      </p>
    </div>
  );
}
