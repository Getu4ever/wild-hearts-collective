import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminShopNav } from "@/app/components/admin-shop-nav";
import { AdminShopProductForm } from "@/app/components/admin-shop-product-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getShopProductById } from "@/lib/shop-catalog-service";

export const metadata: Metadata = {
  title: "Edit Shop Product",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminShopProductEditPage({ params }: PageProps) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { id } = await params;
  const product = await getShopProductById(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Edit product</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Update {product.name} — changes go live on the shop as soon as you save.
          </p>
          <AdminNav active="shop" />
          <AdminShopNav active="products" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminShopProductForm
          mode="edit"
          initial={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            category: product.category,
            pricePence: product.pricePence,
            isAvailable: product.isAvailable,
            digitalDelivery: product.digitalDelivery,
            image: product.image,
            imageGradient: product.imageGradient,
            sizes: product.variants?.sizes?.join(", ") ?? "",
            colours: product.variants?.colours?.join(", ") ?? "",
            trackStock: product.trackStock,
            stockQuantity: product.stockQuantity,
            lowStockThreshold: product.lowStockThreshold,
            isArchived: product.isArchived,
          }}
        />
      </div>
    </div>
  );
}
