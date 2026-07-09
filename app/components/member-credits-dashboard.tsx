"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookingEmbeddedCheckout } from "@/app/components/booking-embedded-checkout";
import { BOOKING_URL } from "@/lib/constants";
import type { MemberCreditsOverview } from "@/lib/member-credits-service";

type PendingCheckout = {
  purchaseId: string;
  clientSecret: string;
  packName: string;
  credits: number;
};

type MemberCreditsDashboardProps = {
  overview: MemberCreditsOverview;
  stripeEnabled: boolean;
  publishableKey: string;
  resumePurchaseId?: string;
};

function amountLabel(amount: number) {
  if (amount > 0) return `+${amount}`;
  return String(amount);
}

function amountTone(amount: number) {
  if (amount > 0) return "text-emerald-800";
  if (amount < 0) return "text-brand";
  return "text-plum";
}

export function MemberCreditsDashboard({
  overview,
  stripeEnabled,
  publishableKey,
  resumePurchaseId,
}: MemberCreditsDashboardProps) {
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resumePurchaseId) return;

    const stored = sessionStorage.getItem(`pack-checkout-${resumePurchaseId}`);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        clientSecret: string;
        packName: string;
        credits: number;
      };

      setPendingCheckout({
        purchaseId: resumePurchaseId,
        clientSecret: parsed.clientSecret,
        packName: parsed.packName,
        credits: parsed.credits,
      });
    } catch {
      sessionStorage.removeItem(`pack-checkout-${resumePurchaseId}`);
    }
  }, [resumePurchaseId]);

  const activePurchases = overview.purchases.filter(
    (purchase) => purchase.status === "active" && purchase.creditsRemaining > 0,
  );

  async function startPurchase(packId: string) {
    setLoadingPackId(packId);
    setError("");

    try {
      const response = await fetch("/api/bundles/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      setPendingCheckout({
        purchaseId: data.purchaseId,
        clientSecret: data.clientSecret,
        packName: data.packName,
        credits: data.credits,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setLoadingPackId(null);
    }
  }

  if (pendingCheckout) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            Secure checkout
          </p>
          <h2 className="mt-2 font-display text-3xl text-plum">{pendingCheckout.packName}</h2>
          <p className="mt-2 text-sm text-muted">
            {pendingCheckout.credits} class credits will be added to your account after payment.
          </p>
          <button
            type="button"
            onClick={() => setPendingCheckout(null)}
            className="mt-4 text-sm font-semibold text-brand hover:underline"
          >
            Cancel and go back
          </button>
          {stripeEnabled ? (
            <BookingEmbeddedCheckout
              clientSecret={pendingCheckout.clientSecret}
              publishableKey={publishableKey}
            />
          ) : (
            <p className="mt-4 rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum">
              Online payments are not configured yet. Please contact the studio to purchase a
              class pack.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-plum/10 bg-gradient-to-br from-pink-soft/60 to-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Available balance
            </p>
            <p className="mt-2 font-display text-5xl text-plum">{overview.balance}</p>
            <p className="mt-2 text-sm text-muted">
              {overview.balance === 1 ? "credit ready to book" : "credits ready to book"}
            </p>
          </div>
          <Link
            href={BOOKING_URL}
            className="rounded-lg bg-plum px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-plum-hover"
          >
            Book a class
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Active class packs</h2>
          <p className="mt-2 text-sm text-muted">
            Credits from each pack must be used before it expires.
          </p>
          {activePurchases.length === 0 ? (
            <p className="mt-6 rounded-lg bg-pink-soft/40 px-4 py-4 text-sm text-muted">
              No active packs yet. Purchase a class pack below to build your credit balance.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {activePurchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="rounded-xl border border-plum/10 bg-white px-4 py-4 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-plum">{purchase.packName}</p>
                      <p className="mt-1 text-muted">
                        {purchase.creditsRemaining} of {purchase.creditsGranted} credits left
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                      {purchase.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">Expires {purchase.expiresLabel}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Recent activity</h2>
          <p className="mt-2 text-sm text-muted">
            Purchases, bookings paid with credits, and refunds appear here.
          </p>
          {overview.transactions.length === 0 ? (
            <p className="mt-6 rounded-lg bg-pink-soft/40 px-4 py-4 text-sm text-muted">
              No credit activity yet. Buy a pack or book a class with credits to see your history
              here.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-plum/10">
              {overview.transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-start justify-between gap-4 py-4 text-sm">
                  <div>
                    <p className="font-medium text-plum">{transaction.reasonLabel}</p>
                    {transaction.detail && (
                      <p className="mt-1 text-muted">{transaction.detail}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">{transaction.createdLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${amountTone(transaction.amount)}`}>
                      {amountLabel(transaction.amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Balance {transaction.balanceAfter}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-2xl text-plum">Buy a class pack</h2>
        <p className="mt-2 text-sm text-muted">
          One credit equals one class booking. Pay with a pack to skip the deposit each time.
        </p>

        {overview.packs.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-plum/15 px-4 py-8 text-center text-sm text-muted">
            Class packs are not available online yet. Please contact the studio to purchase
            credits.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {overview.packs.map((pack) => (
              <article
                key={pack.id}
                className="flex flex-col rounded-xl border border-plum/10 bg-white p-6"
              >
                <h3 className="font-display text-2xl text-plum">{pack.name}</h3>
                <p className="mt-2 font-display text-3xl text-brand">{pack.priceLabel}</p>
                <p className="mt-2 text-sm text-muted">
                  {pack.credits} class credits · valid for {pack.validDays} days
                </p>
                {pack.description && (
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                    {pack.description}
                  </p>
                )}
                <button
                  type="button"
                  disabled={!stripeEnabled || loadingPackId === pack.id}
                  onClick={() => startPurchase(pack.id)}
                  className="mt-6 rounded-lg bg-plum px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-plum-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingPackId === pack.id ? "Starting checkout…" : "Buy pack"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {overview.purchases.length > 0 && (
        <section className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Purchase history</h2>
          <ul className="mt-6 divide-y divide-plum/10">
            {overview.purchases.map((purchase) => (
              <li
                key={purchase.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-plum">{purchase.packName}</p>
                  <p className="mt-1 text-muted">
                    {purchase.creditsGranted} credits · purchased {purchase.purchasedLabel}
                  </p>
                </div>
                <span className="rounded-full bg-plum/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-plum">
                  {purchase.statusLabel}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
