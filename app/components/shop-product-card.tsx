"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useShopCart } from "@/app/components/shop-cart-context";
import { formatMoneyFromPence } from "@/lib/booking-config";
import type { ShopProduct } from "@/lib/shop-data";
import { SHOP_CATEGORIES } from "@/lib/shop-data";

type ShopProductCardProps = {
  product: ShopProduct;
};

export function ShopProductCard({ product }: ShopProductCardProps) {
  const { addToBasket } = useShopCart();
  const imageRef = useRef<HTMLDivElement>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [size, setSize] = useState(product.variants?.sizes?.[0] ?? "");
  const [colour, setColour] = useState(product.variants?.colours?.[0] ?? "");

  const categoryLabel = SHOP_CATEGORIES[product.category].shortLabel;
  const priceLabel = formatMoneyFromPence(product.pricePence);
  const canPurchase = product.isAvailable && product.digitalDelivery;

  function handleAddToBasket() {
    if (!canPurchase) return;
    addToBasket(product, { imageEl: imageRef.current });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-sm border bg-surface shadow-sm transition ${
        canPurchase
          ? "border-plum/10 ring-1 ring-transparent hover:ring-pink/20"
          : "border-plum/8"
      }`}
    >
      <div
        ref={imageRef}
        className="relative aspect-[4/3] overflow-hidden bg-cream"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient}`}
          aria-hidden="true"
        />
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-plum/25 via-transparent to-transparent"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {canPurchase ? (
            <span className="rounded-sm bg-sage px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
              Digital delivery
            </span>
          ) : (
            <span className="rounded-sm bg-plum/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/95 backdrop-blur-sm">
              Coming soon
            </span>
          )}
        </div>

        {!canPurchase && (
          <div aria-hidden="true" className="absolute inset-0 bg-cream/30" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {categoryLabel}
        </p>
        <h3 className="mt-1.5 font-display text-2xl leading-tight text-plum">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {product.description}
        </p>
        <p className="mt-4 font-display text-3xl text-brand">{priceLabel}</p>

        {product.variants && (
          <div className="mt-4 space-y-3 border-t border-plum/8 pt-4">
            {product.variants.sizes && product.variants.sizes.length > 0 && (
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Size
                </span>
                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  disabled={!canPurchase}
                  className="mt-1.5 w-full rounded-sm border border-plum/15 bg-cream px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {product.variants.sizes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {product.variants.colours && product.variants.colours.length > 0 && (
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Colour
                </span>
                <select
                  value={colour}
                  onChange={(event) => setColour(event.target.value)}
                  disabled={!canPurchase}
                  className="mt-1.5 w-full rounded-sm border border-plum/15 bg-cream px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {product.variants.colours.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {canPurchase ? (
          <button
            type="button"
            onClick={handleAddToBasket}
            className={`mt-5 w-full rounded-sm px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition ${
              justAdded
                ? "bg-plum hover:bg-plum"
                : "bg-sage hover:bg-sage-hover"
            }`}
          >
            {justAdded ? "Added" : "Add to basket"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-sm border border-plum/15 bg-plum/5 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Coming soon
          </button>
        )}
      </div>
    </article>
  );
}
