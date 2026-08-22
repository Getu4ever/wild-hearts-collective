import type { Metadata } from "next";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminShopNav } from "@/app/components/admin-shop-nav";
import { AdminShopShippingForm } from "@/app/components/admin-shop-shipping-form";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { getShopShippingBands } from "@/lib/shop-shipping-service";

export const metadata: Metadata = {
  title: "Admin Shop Shipping",
  robots: { index: false, follow: false },
};

export default async function AdminShopShippingPage() {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.shop);

  const bands = await getShopShippingBands();

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Shipping</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Set UK delivery rates by total basket weight. Customers can still choose
            free Collect from studio at checkout.
          </p>
          <AdminNav active="shop" permissions={session.permissions} />
          <AdminShopNav active="shipping" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminShopShippingForm initialBands={bands} />
      </div>
    </div>
  );
}
