"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SHOP_CATEGORIES, type ShopCategoryId } from "@/lib/shop-data";
import type { AdminCatalogProduct } from "@/app/components/admin-shop-products-panel";

type InventoryOverview = {
  summary: {
    trackedProducts: number;
    totalUnitsInStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    unitsSold: number;
  };
  products: AdminCatalogProduct[];
};

function stockTone(status: AdminCatalogProduct["stockStatus"]) {
  switch (status) {
    case "out":
      return "border-brand/25 bg-brand/10 text-brand";
    case "low":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "in_stock":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-plum/15 bg-pink-soft/70 text-plum";
  }
}

export function AdminShopInventoryPanel({ data }: { data: InventoryOverview }) {
  const router = useRouter();
  const [products, setProducts] = useState(data.products);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      [product.name, product.slug, SHOP_CATEGORIES[product.category].label]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [products, query]);

  async function updateStock(product: AdminCatalogProduct, stockQuantity: number) {
    setBusyId(product.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/shop/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQuantity,
          trackStock: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update stock.");
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? payload.product : item)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update stock.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-plum">Stock inventory</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          A live view of how much you have on hand, what has sold, and what needs
          restocking. Gift vouchers stay unlimited unless you turn on stock tracking.
        </p>
      </div>

      {error ? <p className="text-sm text-brand">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {(
          [
            ["Tracked products", data.summary.trackedProducts],
            ["Units in stock", data.summary.totalUnitsInStock],
            ["Low stock", data.summary.lowStockCount],
            ["Out of stock", data.summary.outOfStockCount],
            ["Units sold", data.summary.unitsSold],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-plum/10 bg-surface px-5 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl text-plum">{value}</p>
          </div>
        ))}
      </div>

      <label className="block max-w-md">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Search inventory
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product or category…"
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none transition placeholder:text-muted focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
      </label>

      <div className="overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
        <div className="min-w-0">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
              <tr>
                <th className="w-[28%] px-3 py-3 font-semibold">Product</th>
                <th className="w-[14%] px-3 py-3 font-semibold">Category</th>
                <th className="w-[12%] px-3 py-3 font-semibold">In stock</th>
                <th className="w-[10%] px-3 py-3 font-semibold">Sold</th>
                <th className="w-[14%] px-3 py-3 font-semibold">Status</th>
                <th className="w-[22%] px-3 py-3 font-semibold">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <InventoryRow
                  key={product.id}
                  product={product}
                  busy={busyId === product.id}
                  onUpdateStock={updateStock}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventoryRow({
  product,
  busy,
  onUpdateStock,
}: {
  product: AdminCatalogProduct;
  busy: boolean;
  onUpdateStock: (product: AdminCatalogProduct, stockQuantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(product.stockQuantity));

  return (
    <tr className="border-b border-plum/8 align-top last:border-b-0">
      <td className="px-3 py-3">
        <Link
          href={`/admin/shop/products/${product.id}`}
          className="block truncate font-semibold text-plum hover:text-brand hover:underline"
          title={product.name}
        >
          {product.name}
        </Link>
        {!product.trackStock ? (
          <p className="mt-1 text-xs text-muted">Not tracked — unlimited</p>
        ) : null}
      </td>
      <td className="px-3 py-3 text-muted">
        {SHOP_CATEGORIES[product.category as ShopCategoryId].shortLabel}
      </td>
      <td className="px-3 py-3 font-display text-2xl text-plum">
        {product.trackStock ? product.stockQuantity : "∞"}
      </td>
      <td className="px-3 py-3 text-muted">{product.unitsSold}</td>
      <td className="px-3 py-3">
        <span
          className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-semibold ${stockTone(product.stockStatus)}`}
        >
          {product.stockStatusLabel}
        </span>
      </td>
      <td className="px-3 py-3">
        {product.trackStock ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdateStock(product, Math.max(0, product.stockQuantity - 1))}
              className="rounded-sm border border-plum/15 px-2 py-1 text-xs font-semibold text-plum hover:border-pink disabled:opacity-50"
            >
              −1
            </button>
            <input
              type="number"
              min={0}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-20 rounded-sm border border-plum/15 px-2 py-1 text-sm text-plum"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdateStock(product, Math.max(0, Number.parseInt(draft, 10) || 0))}
              className="rounded-sm bg-sage px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-50"
            >
              Set
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdateStock(product, product.stockQuantity + 1)}
              className="rounded-sm border border-plum/15 px-2 py-1 text-xs font-semibold text-plum hover:border-pink disabled:opacity-50"
            >
              +1
            </button>
          </div>
        ) : (
          <Link
            href={`/admin/shop/products/${product.id}`}
            className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
          >
            Enable tracking
          </Link>
        )}
      </td>
    </tr>
  );
}
