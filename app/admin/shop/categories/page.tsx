import type { Metadata } from "next";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminShopCategoriesForm } from "@/app/components/admin-shop-categories-form";
import { AdminShopNav } from "@/app/components/admin-shop-nav";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  countProductsInCategory,
  getOrSeedShopCategories,
} from "@/lib/shop-categories-service";

export const metadata: Metadata = {
  title: "Admin Shop Categories",
  robots: { index: false, follow: false },
};

export default async function AdminShopCategoriesPage() {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.shop);

  const { categories } = await getOrSeedShopCategories();
  const withCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      productCount: await countProductsInCategory(category.id),
    })),
  );

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Categories</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Full control over shop categories — add new ones or remove unused ones
            without a code deploy.
          </p>
          <AdminNav active="shop" permissions={session.permissions} />
          <AdminShopNav active="categories" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminShopCategoriesForm initialCategories={withCounts} />
      </div>
    </div>
  );
}
