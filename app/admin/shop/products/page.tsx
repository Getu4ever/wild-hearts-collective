import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminShopNav } from "@/app/components/admin-shop-nav";
import { AdminShopProductsPanel } from "@/app/components/admin-shop-products-panel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAdminShopProducts } from "@/lib/shop-catalog-service";

export const metadata: Metadata = {
  title: "Admin Shop Products",
  robots: { index: false, follow: false },
};

export default async function AdminShopProductsPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const products = await listAdminShopProducts({ includeArchived: true });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Shop</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Manage your product catalog, pricing, and availability — then track sales in
            the sales dashboard.
          </p>
          <AdminNav active="shop" />
          <AdminShopNav active="products" />
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <AdminLogoutButton />
          <Link
            href="/shop"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View live shop
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <AdminShopProductsPanel initialProducts={products} />
      </div>
    </div>
  );
}
