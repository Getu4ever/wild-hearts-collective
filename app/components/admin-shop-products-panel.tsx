"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatMoneyFromPence, formatUkDateShort } from "@/lib/booking-config";
import { SHOP_CATEGORIES, type ShopCategoryId } from "@/lib/shop-data";

export type AdminCatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ShopCategoryId;
  pricePence: number;
  isAvailable: boolean;
  digitalDelivery: boolean;
  image: string;
  imageGradient: string;
  createdAt: string;
  isArchived: boolean;
  sortOrder: number;
  updatedAt: string;
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: "unlimited" | "in_stock" | "low" | "out";
  stockStatusLabel: string;
  unitsSold: number;
};

type StatusFilter = "all" | "live" | "draft" | "archived";

function productStatus(product: AdminCatalogProduct) {
  if (product.isArchived) return "archived";
  if (product.isAvailable) return "live";
  return "draft";
}

function statusLabel(status: ReturnType<typeof productStatus>) {
  switch (status) {
    case "live":
      return "Live";
    case "draft":
      return "Coming soon";
    case "archived":
      return "Archived";
  }
}

function statusTone(status: ReturnType<typeof productStatus>) {
  switch (status) {
    case "live":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "draft":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "archived":
      return "border-stone-200 bg-stone-100 text-stone-600";
  }
}

export function AdminShopProductsPanel({
  initialProducts,
}: {
  initialProducts: AdminCatalogProduct[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<ShopCategoryId | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const status = productStatus(product);
      if (statusFilter === "live" && status !== "live") return false;
      if (statusFilter === "draft" && status !== "draft") return false;
      if (statusFilter === "archived" && status !== "archived") return false;
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (!needle) return true;
      return [product.name, product.slug, product.description, product.id]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [products, query, statusFilter, categoryFilter]);

  const counts = useMemo(
    () => ({
      all: products.filter((p) => !p.isArchived).length,
      live: products.filter((p) => productStatus(p) === "live").length,
      draft: products.filter((p) => productStatus(p) === "draft").length,
      archived: products.filter((p) => productStatus(p) === "archived").length,
    }),
    [products],
  );

  async function toggleAvailability(product: AdminCatalogProduct) {
    setBusyId(product.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/shop/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update product.");
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? payload.product : item)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product.");
    } finally {
      setBusyId(null);
    }
  }

  async function archiveProduct(product: AdminCatalogProduct) {
    if (!window.confirm(`Archive “${product.name}”? It will disappear from the shop.`)) {
      return;
    }
    setBusyId(product.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/shop/products/${product.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to archive product.");
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? payload.product : item)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive product.");
    } finally {
      setBusyId(null);
    }
  }

  async function restoreProduct(product: AdminCatalogProduct) {
    setBusyId(product.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/shop/products/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to restore product.");
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? payload.product : item)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to restore product.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-3xl text-plum">Product catalog</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Add products, set prices, and control what appears on the shop. Live products
            can be purchased immediately; coming soon items stay visible but not buyable.
          </p>
        </div>
        <Link
          href="/admin/shop/products/new"
          className="inline-flex items-center justify-center rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
        >
          Add product
        </Link>
      </div>

      {error ? <p className="text-sm text-brand">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["all", "Active products", counts.all],
            ["live", "Live", counts.live],
            ["draft", "Coming soon", counts.draft],
            ["archived", "Archived", counts.archived],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`rounded-lg border px-5 py-4 text-left transition ${
              statusFilter === id
                ? "border-sage bg-sage/10 shadow-sm"
                : "border-plum/10 bg-surface hover:border-pink/30"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl text-plum">{count}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <label className="block min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Search products
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slug, or description…"
            className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none transition placeholder:text-muted focus:border-pink focus:ring-2 focus:ring-pink/20"
          />
        </label>
        <label className="block lg:w-64">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Category
          </span>
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as ShopCategoryId | "all")
            }
            className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
          >
            <option value="all">All categories</option>
            {Object.values(SHOP_CATEGORIES).map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-2xl text-plum">No products found</p>
            <p className="mt-2 text-sm text-muted">
              Try another filter, or add your first product.
            </p>
            <Link
              href="/admin/shop/products/new"
              className="mt-6 inline-flex rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
            >
              Add product
            </Link>
          </div>
        ) : (
          <div className="min-w-0">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="w-[32%] px-3 py-3 font-semibold">Product</th>
                  <th className="w-[10%] px-3 py-3 font-semibold">Category</th>
                  <th className="w-[10%] px-3 py-3 font-semibold">Price</th>
                  <th className="w-[10%] px-3 py-3 font-semibold">Stock</th>
                  <th className="w-[12%] px-3 py-3 font-semibold">Status</th>
                  <th className="w-[12%] px-3 py-3 font-semibold">Updated</th>
                  <th className="w-[14%] px-3 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = productStatus(product);
                  const isBusy = busyId === product.id;
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-plum/8 align-top last:border-b-0"
                    >
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-cream ring-1 ring-plum/10">
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient}`}
                              aria-hidden="true"
                            />
                            <Image
                              src={product.image}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/shop/products/${product.id}`}
                              className="block truncate font-semibold text-plum hover:text-brand hover:underline"
                              title={product.name}
                            >
                              {product.name}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs text-muted">
                              {product.description}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-muted">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {SHOP_CATEGORIES[product.category].shortLabel}
                        <p className="mt-1 text-xs">
                          {product.digitalDelivery ? "Digital" : "Physical"}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-medium text-plum">
                        {formatMoneyFromPence(product.pricePence)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-plum">
                          {product.trackStock ? product.stockQuantity : "∞"}
                        </p>
                        {product.trackStock ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {product.unitsSold} sold
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}
                        >
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {formatUkDateShort(product.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/shop/products/${product.id}`}
                            className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
                          >
                            Edit
                          </Link>
                          {!product.isArchived ? (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => toggleAvailability(product)}
                                className="text-left text-xs font-semibold uppercase tracking-wider text-plum hover:text-brand disabled:opacity-50"
                              >
                                {product.isAvailable ? "Set coming soon" : "Set live"}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => archiveProduct(product)}
                                className="text-left text-xs font-semibold uppercase tracking-wider text-brand hover:underline disabled:opacity-50"
                              >
                                Archive
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => restoreProduct(product)}
                              className="text-left text-xs font-semibold uppercase tracking-wider text-plum hover:text-brand disabled:opacity-50"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
