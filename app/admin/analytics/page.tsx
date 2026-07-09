import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAnalyticsDashboard } from "@/app/components/admin-analytics-dashboard";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Analytics</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Studio performance for the founders — occupancy, class popularity, peak hours,
            retention, and engagement activity over the last 30 days.
          </p>
          <AdminNav active="analytics" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminAnalyticsDashboard />
      </div>
    </div>
  );
}
