import type { Metadata } from "next";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminStaffPanel } from "@/app/components/admin-staff-panel";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { listAdminUsers } from "@/lib/admin-staff-service";

export const metadata: Metadata = {
  title: "Staff accounts",
  robots: { index: false, follow: false },
};

export default async function AdminStaffPage() {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.staff);
  const users = await listAdminUsers();

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Staff accounts</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Create directors and employees, then limit what each person can access.
          </p>
          <AdminNav active="staff" permissions={session.permissions} />
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">{session.name}</p>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminStaffPanel
        initialUsers={users}
        actorId={session.id}
        actorRole={session.role}
      />
    </div>
  );
}
