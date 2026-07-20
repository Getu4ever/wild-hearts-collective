import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminShopInventoryPanel } from "@/app/components/admin-shop-inventory-panel";
import { AdminShopNav } from "@/app/components/admin-shop-nav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminShopInventoryOverview } from "@/lib/shop-catalog-service";

export const metadata: Metadata = {
  title: "Admin Shop Inventory",
  robots: { index: false, follow: false },
};

export default async function AdminShopInventoryPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const data = await getAdminShopInventoryOverview();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Shop</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Track stock levels, see what has sold, and restock before items run out.
          </p>
          <AdminNav active="shop" />
          <AdminShopNav active="inventory" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminShopInventoryPanel data={data} />
      </div>
    </div>
  );
}
