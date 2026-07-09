"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Pack = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  priceLabel: string;
  validDays: number;
};

export function BundlePurchaseGrid({ packs }: { packs: Pack[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function purchase(packId: string) {
    setLoadingId(packId);
    setError("");

    try {
      const response = await fetch("/api/bundles/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?next=/account/credits");
          return;
        }
        throw new Error(data.error || "Unable to start checkout.");
      }

      sessionStorage.setItem(
        `pack-checkout-${data.purchaseId}`,
        JSON.stringify({
          clientSecret: data.clientSecret,
          packName: data.packName,
          credits: data.credits,
        }),
      );
      router.push(`/account/credits?purchase=${data.purchaseId}&checkout=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-brand">{error}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {packs.map((pack) => (
          <article
            key={pack.id}
            className="flex flex-col rounded-sm border border-plum/10 bg-surface p-8"
          >
            <h3 className="font-display text-3xl text-plum">{pack.name}</h3>
            <p className="mt-2 font-display text-4xl text-brand">{pack.priceLabel}</p>
            <p className="mt-2 text-sm text-muted">
              {pack.credits} class credits · valid for {pack.validDays} days
            </p>
            {pack.description && (
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{pack.description}</p>
            )}
            <button
              type="button"
              disabled={loadingId === pack.id}
              onClick={() => purchase(pack.id)}
              className="mt-8 rounded-sm bg-plum px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-plum-hover disabled:opacity-60"
            >
              {loadingId === pack.id ? "Starting checkout…" : "Buy pack"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
