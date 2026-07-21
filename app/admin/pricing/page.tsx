import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminPricingPanel } from "@/app/components/admin-pricing-panel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getStudioPricingSettings,
  listAdminClassPacks,
} from "@/lib/studio-pricing-service";

export const metadata: Metadata = {
  title: "Admin Passes & Pricing",
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const [settings, packs] = await Promise.all([
    getStudioPricingSettings(),
    listAdminClassPacks(),
  ]);

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">
            Passes &amp; pricing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Update drop-in and membership prices, plus class pass prices, credit volume,
            and validity. Schedule sessions separately under Schedule.
          </p>
          <AdminNav active="pricing" />
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <AdminLogoutButton />
          <Link
            href="/membership"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View membership page
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <AdminPricingPanel initialSettings={settings} initialPacks={packs} />
      </div>
    </div>
  );
}
