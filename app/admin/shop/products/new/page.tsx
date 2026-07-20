import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminShopNav } from "@/app/components/admin-shop-nav";
import { AdminShopProductForm } from "@/app/components/admin-shop-product-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Add Shop Product",
  robots: { index: false, follow: false },
};

export default async function AdminShopProductNewPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Add product</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Create a new shop item with pricing, description, and availability controls.
          </p>
          <AdminNav active="shop" />
          <AdminShopNav active="products" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminShopProductForm mode="create" />
      </div>
    </div>
  );
}
