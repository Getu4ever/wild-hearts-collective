import type { Metadata } from "next";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import {
  AdminScheduleBoard,
  type AdminScheduleSession,
} from "@/app/components/admin-schedule-board";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  type AdminScheduleRange,
  listAdminSessions,
} from "@/lib/admin-session-service";

export const metadata: Metadata = {
  title: "Admin Schedule",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ range?: string }>;
};

function parseRange(value: string | undefined): AdminScheduleRange {
  if (value === "today" || value === "past" || value === "schedule") return value;
  return "schedule";
}

export default async function AdminSchedulePage({ searchParams }: PageProps) {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.schedule);

  const params = await searchParams;
  const range = parseRange(params.range);
  const sessions = (await listAdminSessions({ range })) as AdminScheduleSession[];

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Schedule</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Live studio monitor — today&apos;s classes stay visible after they finish so
            you can complete check-in. Use Past to reopen earlier sessions.
          </p>
          <AdminNav active="schedule" permissions={session.permissions} />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 space-y-6">
        <div className="rounded-lg border border-plum/10 bg-pink-soft/30 px-5 py-4 text-sm text-muted">
          <p className="font-semibold text-plum">Check-in &amp; past classes</p>
          <p className="mt-1">
            Finished classes no longer disappear at the end time. Mark attendance from{" "}
            <strong>View roster</strong> once the class has started. Attendance cannot be
            set on future classes by accident.
          </p>
        </div>
        <AdminScheduleBoard sessions={sessions} range={range} />
      </div>
    </div>
  );
}
