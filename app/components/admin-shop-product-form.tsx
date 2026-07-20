"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatMoneyFromPence } from "@/lib/booking-config";
import { slugifyProductName } from "@/lib/shop-data";
import {
  SHOP_CATEGORIES,
  shopCategoryList,
  type ShopCategoryId,
} from "@/lib/shop-data";

const GRADIENT_PRESETS = [
  "from-pink-light via-pink-soft to-cream",
  "from-brand/30 via-pink-soft to-sage-light",
  "from-plum/20 via-pink-light to-cream",
  "from-sage-light via-pink-soft to-background",
  "from-pink-soft via-cream to-sage-light",
  "from-plum/15 via-sage-light to-cream",
];

export type AdminShopProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: ShopCategoryId;
  pricePence: number;
  isAvailable: boolean;
  digitalDelivery: boolean;
  image: string;
  imageGradient: string;
  sizes: string;
  colours: string;
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  isArchived?: boolean;
};

type AdminShopProductFormProps = {
  mode: "create" | "edit";
  initial?: AdminShopProductFormValues;
};

export function AdminShopProductForm({ mode, initial }: AdminShopProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<ShopCategoryId>(
    initial?.category ?? "gift-vouchers",
  );
  const [pricePounds, setPricePounds] = useState(
    initial ? (initial.pricePence / 100).toFixed(2) : "",
  );
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? false);
  const [digitalDelivery, setDigitalDelivery] = useState(
    initial?.digitalDelivery ?? true,
  );
  const [image, setImage] = useState(initial?.image ?? "/shop/e-gift-card-25.svg");
  const [imageGradient, setImageGradient] = useState(
    initial?.imageGradient ?? GRADIENT_PRESETS[0],
  );
  const [sizes, setSizes] = useState(initial?.sizes ?? "");
  const [colours, setColours] = useState(initial?.colours ?? "");
  const [trackStock, setTrackStock] = useState(initial?.trackStock ?? !initial?.digitalDelivery);
  const [stockQuantity, setStockQuantity] = useState(
    initial ? String(initial.stockQuantity) : "0",
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initial ? String(initial.lowStockThreshold ?? 5) : "5",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyProductName(name));
    }
  }, [name, slugTouched]);

  const previewPrice = useMemo(() => {
    const parsed = Number.parseFloat(pricePounds);
    if (!Number.isFinite(parsed)) return "£0.00";
    return formatMoneyFromPence(Math.round(parsed * 100));
  }, [pricePounds]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url =
        mode === "create"
          ? "/api/admin/shop/products"
          : `/api/admin/shop/products/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          category,
          pricePounds: Number.parseFloat(pricePounds),
          isAvailable,
          digitalDelivery,
          image,
          imageGradient,
          sizes,
          colours,
          trackStock,
          stockQuantity: Number.parseInt(stockQuantity, 10) || 0,
          lowStockThreshold: Number.parseInt(lowStockThreshold, 10) || 0,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save product.");

      router.push("/admin/shop/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    if (!initial?.id) return;
    if (!window.confirm("Archive this product? It will be removed from the shop.")) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/shop/products/${initial.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to archive product.");
      router.push("/admin/shop/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-8">
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Product details</h2>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Product name
              </span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                URL slug
              </span>
              <input
                required
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 font-mono text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
              <p className="mt-1 text-xs text-muted">Used internally and in checkout records.</p>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Description
              </span>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Category
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ShopCategoryId)}
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              >
                {shopCategoryList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Pricing & availability</h2>
          <div className="mt-6 space-y-5">
            <label className="block max-w-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Price (GBP)
              </span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
                  £
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePounds}
                  onChange={(event) => setPricePounds(event.target.value)}
                  className="w-full rounded-sm border border-plum/15 bg-white py-2.5 pl-7 pr-3 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleCard
                label="Live on shop"
                description="Customers can add this product to their basket and checkout."
                checked={isAvailable}
                onChange={setIsAvailable}
              />
              <ToggleCard
                label="Digital delivery"
                description="Turn off for physical items that require UK shipping."
                checked={digitalDelivery}
                onChange={setDigitalDelivery}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Inventory</h2>
          <p className="mt-2 text-sm text-muted">
            Physical products usually track stock. Digital gift vouchers can stay unlimited.
          </p>
          <div className="mt-6 space-y-5">
            <ToggleCard
              label="Track stock"
              description="When enabled, sales reduce the quantity on hand and out-of-stock items cannot be bought."
              checked={trackStock}
              onChange={setTrackStock}
            />
            {trackStock ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Quantity in stock
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(event) => setStockQuantity(event.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Low stock alert at
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(event) => setLowStockThreshold(event.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                  />
                </label>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Media</h2>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Image path
              </span>
              <input
                required
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="/shop/your-product.svg"
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 font-mono text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
              <p className="mt-1 text-xs text-muted">
                Upload images to <code className="text-plum">/public/shop/</code> or ask your
                developer to add new artwork.
              </p>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Card gradient
              </span>
              <select
                value={imageGradient}
                onChange={(event) => setImageGradient(event.target.value)}
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              >
                {GRADIENT_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Variants (optional)</h2>
          <p className="mt-2 text-sm text-muted">
            For apparel or items with options. Comma-separated values.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Sizes
              </span>
              <input
                value={sizes}
                onChange={(event) => setSizes(event.target.value)}
                placeholder="XS, S, M, L, XL"
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Colours
              </span>
              <input
                value={colours}
                onChange={(event) => setColours(event.target.value)}
                placeholder="Black, Plum, Sage"
                className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
            </label>
          </div>
        </section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <section className="overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
          <div className="relative aspect-[4/3] bg-cream">
            <div className={`absolute inset-0 bg-gradient-to-br ${imageGradient}`} aria-hidden />
            <Image src={image} alt="" fill sizes="400px" className="object-cover" />
          </div>
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {SHOP_CATEGORIES[category].shortLabel}
            </p>
            <h3 className="mt-1 font-display text-2xl text-plum">
              {name.trim() || "Product name"}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted">
              {description.trim() || "Product description will appear here."}
            </p>
            <p className="mt-4 font-display text-3xl text-brand">{previewPrice}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-plum/15 bg-pink-soft/70 px-2.5 py-1 text-xs font-semibold text-plum">
                {isAvailable ? "Live" : "Coming soon"}
              </span>
              <span className="rounded-full border border-plum/15 px-2.5 py-1 text-xs font-semibold text-muted">
                {digitalDelivery ? "Digital delivery" : "Physical item"}
              </span>
              {trackStock ? (
                <span className="rounded-full border border-plum/15 px-2.5 py-1 text-xs font-semibold text-muted">
                  {stockQuantity} in stock
                </span>
              ) : null}
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-brand">{error}</p> : null}

        <div className="rounded-lg border border-plum/10 bg-surface p-5 shadow-sm">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
          >
            {loading ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
          </button>
          <Link
            href="/admin/shop/products"
            className="mt-3 block text-center text-sm font-semibold text-plum hover:text-brand hover:underline"
          >
            Cancel
          </Link>
          {mode === "edit" && initial?.id && !initial.isArchived ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleArchive}
              className="mt-4 w-full text-sm font-semibold text-brand hover:underline disabled:opacity-60"
            >
              Archive product
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-plum/10 bg-cream/30 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-plum/20 text-sage focus:ring-pink/30"
      />
      <span>
        <span className="block text-sm font-semibold text-plum">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{description}</span>
      </span>
    </label>
  );
}
