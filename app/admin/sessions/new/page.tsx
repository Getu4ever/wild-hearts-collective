import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminSessionForm } from "@/app/components/admin-session-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Schedule New Class",
  robots: { index: false, follow: false },
};

export default async function AdminNewSessionPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(tomorrow);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Schedule class</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Add a new session to the studio timetable. Capacity is capped by equipment limits
            for each class type.
          </p>
          <AdminNav active="schedule" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminSessionForm
          mode="create"
          initial={{ date: defaultDate, startTime: "18:00", capacity: 12 }}
        />
      </div>

      <p className="mt-8 text-sm text-muted">
        <Link href="/admin/schedule" className="font-medium text-plum hover:text-brand hover:underline">
          Back to schedule
        </Link>
      </p>
    </div>
  );
}
