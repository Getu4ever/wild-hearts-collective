import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminTutorsPanel } from "@/app/components/admin-tutors-panel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAllAdminTutors } from "@/lib/admin-session-service";

export const metadata: Metadata = {
  title: "Admin Instructors",
  robots: { index: false, follow: false },
};

export default async function AdminTutorsPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const tutors = await listAllAdminTutors();

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Instructors</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Add and manage teaching staff. Assign an instructor when creating or editing a
            session so their name appears on the public booking schedule.
          </p>
          <AdminNav active="tutors" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminTutorsPanel
          initialTutors={tutors.map((tutor) => ({
            ...tutor,
            createdAt: tutor.createdAt.toISOString(),
            updatedAt: tutor.updatedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
