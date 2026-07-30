/**
 * Marketing weekly timetable editor — NOT the live bookable schedule.
 * Live sessions are managed under Admin → Schedule. This page edits the
 * homepage /#timetable pattern stored in StudioSetting `marketing_timetable`.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminTimetablePanel } from "@/app/components/admin-timetable-panel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrSeedMarketingTimetable } from "@/lib/marketing-timetable-service";

export const metadata: Metadata = {
  title: "Admin Timetable",
  robots: { index: false, follow: false },
};

export default async function AdminTimetablePage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { days, source } = await getOrSeedMarketingTimetable();

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">
            Timetable
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Edit the marketing weekly pattern shown on the homepage. Add promotions
            beneath the seven-day pattern for dated courses or special events. This is
            separate from live bookable sessions — manage those under Schedule.
          </p>
          <AdminNav active="timetable" />
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <AdminLogoutButton />
          <Link
            href="/#timetable"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View homepage timetable
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <AdminTimetablePanel initialDays={days} initialSource={source} />
      </div>
    </div>
  );
}
