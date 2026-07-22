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

type BundlePurchaseGridProps = {
  packs: Pack[];
  featured?: boolean;
  emphasize?: boolean;
};

export function BundlePurchaseGrid({
  packs,
  featured = false,
  emphasize = false,
}: BundlePurchaseGridProps) {
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
          router.push("/login?next=/membership");
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
      <div
        className={`grid gap-6 ${
          featured
            ? packs.length === 1
              ? "mx-auto max-w-md"
              : emphasize
                ? "md:grid-cols-2 md:gap-10"
                : "md:grid-cols-2 md:gap-8"
            : "md:grid-cols-2"
        }`}
      >
        {packs.map((pack) => (
          <article
            key={pack.id}
            className={`flex flex-col rounded-sm border bg-surface ${
              featured
                ? emphasize
                  ? "border-pink/30 p-10 shadow-md ring-1 ring-pink/15"
                  : "border-pink/25 p-10 shadow-sm ring-1 ring-pink/10"
                : "border-plum/10 p-8"
            }`}
          >
            <h3
              className={`font-display text-plum ${
                featured && emphasize ? "text-[2.5rem]" : featured ? "text-4xl" : "text-3xl"
              }`}
            >
              {pack.name}
            </h3>
            <p
              className={`mt-2 font-display text-brand ${
                featured && emphasize ? "text-6xl" : featured ? "text-5xl" : "text-4xl"
              }`}
            >
              {pack.priceLabel}
            </p>
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
              className="mt-8 rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60"
            >
              {loadingId === pack.id ? "Starting checkout…" : "Buy pack"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
