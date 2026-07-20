"use client";

import { useMemo, useState } from "react";
import { ShopCartProvider } from "@/app/components/shop-cart-context";
import { ShopFlyToBasket } from "@/app/components/shop-fly-to-basket";
import { ShopFloatingBasket } from "@/app/components/shop-floating-basket";
import { ShopProductCard } from "@/app/components/shop-product-card";
import {
  filterAndSortProducts,
  shopCategoryList,
  type ShopCategoryId,
  type ShopProduct,
  type ShopSortOption,
} from "@/lib/shop-data";

type ShopStorefrontProps = {
  products: ShopProduct[];
  cancelled?: boolean;
};

const SORT_OPTIONS: { value: ShopSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function ShopStorefront({ products, cancelled = false }: ShopStorefrontProps) {
  return (
    <ShopCartProvider products={products}>
      <ShopStorefrontInner products={products} cancelled={cancelled} />
      <ShopFlyToBasket />
      <ShopFloatingBasket />
    </ShopCartProvider>
  );
}

function ShopStorefrontInner({
  products,
  cancelled = false,
}: ShopStorefrontProps) {
  const [category, setCategory] = useState<ShopCategoryId | "all">("gift-vouchers");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ShopSortOption>("newest");

  const filtered = useMemo(
    () =>
      filterAndSortProducts({
        products,
        category,
        query,
        sort,
      }),
    [products, category, query, sort],
  );

  return (
    <div>
      {cancelled && (
        <p className="mb-8 rounded-sm border border-plum/10 bg-pink-soft px-4 py-3 text-sm text-plum">
          Checkout was cancelled. Your basket is still saved — open it anytime to try again.
        </p>
      )}

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Shop categories"
      >
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          onClick={() => setCategory("all")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            category === "all"
              ? "bg-sage text-white"
              : "bg-cream text-plum ring-1 ring-plum/10 hover:bg-pink-soft"
          }`}
        >
          All
        </button>
        {shopCategoryList.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            onClick={() => setCategory(item.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              category === item.id
                ? "bg-sage text-white"
                : "bg-cream text-plum ring-1 ring-plum/10 hover:bg-pink-soft"
            }`}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block min-w-0 flex-1 sm:max-w-md">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            className="mt-1.5 w-full rounded-sm border border-plum/15 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </label>

        <label className="block sm:w-56">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ShopSortOption)}
            className="mt-1.5 w-full rounded-sm border border-plum/15 bg-surface px-4 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "product" : "products"}
        {category !== "all" && (
          <>
            {" "}
            in{" "}
            <span className="font-semibold text-foreground">
              {shopCategoryList.find((item) => item.id === category)?.label}
            </span>
          </>
        )}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 pb-24 md:gap-6 lg:grid-cols-4">
          {filtered.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-sm border border-plum/10 bg-surface px-6 py-14 text-center">
          <p className="font-display text-2xl text-plum">No products found</p>
          <p className="mt-2 text-sm text-muted">
            Try another category or clear your search.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setQuery("");
            }}
            className="mt-6 rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
