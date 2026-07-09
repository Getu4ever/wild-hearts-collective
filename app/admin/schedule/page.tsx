import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import {
  AdminScheduleBoard,
  type AdminScheduleSession,
} from "@/app/components/admin-schedule-board";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAdminSessions } from "@/lib/admin-session-service";

export const metadata: Metadata = {
  title: "Admin Schedule",
  robots: { index: false, follow: false },
};

export default async function AdminSchedulePage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const sessions = (await listAdminSessions()) as AdminScheduleSession[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Schedule</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Live studio monitor — upcoming classes, tutor coverage, and real-time
            occupancy at a glance.
          </p>
          <AdminNav active="schedule" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 space-y-6">
        <div className="rounded-lg border border-plum/10 bg-pink-soft/30 px-5 py-4 text-sm text-muted">
          <p className="font-semibold text-plum">Changing slots, times & tutors</p>
          <p className="mt-1">
            Use <strong>Max slots</strong> on each card to update capacity quickly, or open{" "}
            <strong>View roster → Edit session</strong> to change date, time, tutor, and notes.
          </p>
        </div>
        <AdminScheduleBoard sessions={sessions} />
      </div>
    </div>
  );
}
