"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useShopCart } from "@/app/components/shop-cart-context";
import { formatMoneyFromPence } from "@/lib/booking-config";

function BasketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 9h15l-1.2 9.2a2 2 0 0 1-2 1.8H7.7a2 2 0 0 1-2-1.8L4.5 9Z" />
      <path d="M8 9V7.5A4 4 0 0 1 12 3.5 4 4 0 0 1 16 7.5V9" />
      <path d="M9.5 13v3.5M12 13v3.5M14.5 13v3.5" />
    </svg>
  );
}

export function ShopFloatingBasket() {
  const {
    itemCount,
    totalPence,
    productLines,
    isOpen,
    closeBasket,
    toggleBasket,
    setQuantity,
    removeFromBasket,
    clearBasket,
    basketButtonRef,
    bumpBasket,
  } = useShopCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBasket();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeBasket]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  async function checkout() {
    if (productLines.length === 0) return;
    setCheckingOut(true);
    setError("");

    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: productLines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }
      if (!data.url) {
        throw new Error("Checkout URL missing.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setCheckingOut(false);
    }
  }

  return (
    <>
      <button
        ref={basketButtonRef}
        type="button"
        onClick={toggleBasket}
        aria-label={
          itemCount > 0
            ? `Open basket, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
            : "Open basket"
        }
        className={`fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-[0_8px_28px_rgba(74,67,60,0.18)] ring-1 ring-plum/10 transition duration-300 hover:scale-105 hover:shadow-[0_12px_32px_rgba(74,67,60,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:bottom-8 sm:right-8 lg:h-[4.25rem] lg:w-[4.25rem] ${
          bumpBasket ? "animate-basket-bump" : ""
        }`}
      >
        <BasketIcon className="h-6 w-6 lg:h-9 lg:w-9" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1.5 text-[10px] font-bold text-white shadow-sm">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      <div
        className={`fixed inset-0 z-[75] transition ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-plum/35 backdrop-blur-[2px] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close basket"
          onClick={closeBasket}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Shopping basket"
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between border-b border-plum/10 px-6 py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Your basket
              </p>
              <h2 className="font-display text-3xl text-plum">
                {itemCount === 0
                  ? "Empty"
                  : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeBasket}
              className="rounded-sm px-3 py-2 text-sm font-semibold uppercase tracking-wider text-plum hover:bg-pink-soft"
            >
              Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {productLines.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-brand ring-1 ring-plum/10">
                  <BasketIcon className="h-7 w-7" />
                </div>
                <p className="mt-5 font-display text-2xl text-plum">
                  Your basket is empty
                </p>
                <p className="mt-2 max-w-xs text-sm text-muted">
                  Add available products from the shop, then checkout when you are ready.
                </p>
                <button
                  type="button"
                  onClick={closeBasket}
                  className="mt-6 rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {productLines.map((line) => (
                  <li
                    key={line.productId}
                    className="flex gap-4 rounded-sm border border-plum/10 bg-cream/40 p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-cream">
                      <Image
                        src={line.product.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-plum">
                        {line.product.name}
                      </p>
                      <p className="mt-0.5 text-sm text-brand">
                        {formatMoneyFromPence(line.product.pricePence)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-sm border border-plum/15 bg-surface">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              setQuantity(line.productId, line.quantity - 1)
                            }
                            className="px-2.5 py-1 text-sm text-plum hover:bg-pink-soft"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-foreground">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              setQuantity(line.productId, line.quantity + 1)
                            }
                            className="px-2.5 py-1 text-sm text-plum hover:bg-pink-soft"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromBasket(line.productId)}
                          className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-brand"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {productLines.length > 0 && (
            <footer className="border-t border-plum/10 bg-cream/50 px-6 py-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Total
                  </p>
                  <p className="font-display text-3xl text-plum">
                    {formatMoneyFromPence(totalPence)}
                  </p>
                </div>
                <p className="max-w-[10rem] text-right text-xs leading-relaxed text-muted">
                  Digital delivery by email · no shipping
                </p>
              </div>

              {error && <p className="mt-3 text-sm text-brand">{error}</p>}

              <button
                type="button"
                disabled={checkingOut}
                onClick={checkout}
                className="mt-5 w-full rounded-sm bg-sage px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
              >
                {checkingOut ? "Starting checkout…" : "Checkout securely"}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearBasket();
                  closeBasket();
                }}
                className="mt-3 w-full py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-plum"
              >
                Clear basket
              </button>
            </footer>
          )}
        </aside>
      </div>
    </>
  );
}

/** Clears persisted basket after a successful Stripe return. */
export function ShopClearBasketOnSuccess() {
  useEffect(() => {
    try {
      window.localStorage.removeItem("whc-shop-basket");
    } catch {
      // ignore storage errors
    }
  }, []);
  return null;
}
