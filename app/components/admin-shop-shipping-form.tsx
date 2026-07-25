"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoneyFromPence } from "@/lib/booking-config";
import type { ShopShippingBand } from "@/lib/shop-shipping";

type BandRow = {
  maxWeightGrams: string;
  feePounds: string;
};

function bandsToRows(bands: ShopShippingBand[]): BandRow[] {
  return bands.map((band) => ({
    maxWeightGrams: String(band.maxWeightGrams),
    feePounds: (band.feePence / 100).toFixed(2),
  }));
}

export function AdminShopShippingForm({
  initialBands,
}: {
  initialBands: ShopShippingBand[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<BandRow[]>(() => bandsToRows(initialBands));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const preview = useMemo(() => {
    return rows
      .map((row) => {
        const maxWeightGrams = Number.parseInt(row.maxWeightGrams, 10);
        const feePounds = Number.parseFloat(row.feePounds);
        if (!Number.isFinite(maxWeightGrams) || !Number.isFinite(feePounds)) {
          return null;
        }
        return {
          maxWeightGrams,
          feePence: Math.round(feePounds * 100),
        };
      })
      .filter((band): band is ShopShippingBand => band !== null)
      .sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
  }, [rows]);

  function updateRow(index: number, patch: Partial<BandRow>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
    setSaved(false);
  }

  function addRow() {
    setRows((current) => [...current, { maxWeightGrams: "", feePounds: "" }]);
    setSaved(false);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch("/api/admin/shop/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bands: rows.map((row) => ({
            maxWeightGrams: Number.parseInt(row.maxWeightGrams, 10),
            feePounds: Number.parseFloat(row.feePounds),
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save.");
      setRows(bandsToRows(payload.bands));
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-2xl text-plum">Weight bands</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Delivery charges one parcel fee from the total weight of physical items in
          the basket. Edit these bands to match the Royal Mail (or courier) rates you
          want to use — no live API needed.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-plum/10 text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-semibold">Weight up to (g)</th>
                <th className="py-2 pr-4 font-semibold">Delivery fee (£)</th>
                <th className="py-2 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-plum/5">
                  <td className="py-2 pr-4">
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={row.maxWeightGrams}
                      onChange={(event) =>
                        updateRow(index, { maxWeightGrams: event.target.value })
                      }
                      className="w-full min-w-[8rem] rounded-sm border border-plum/15 bg-white px-3 py-2 text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                        £
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.feePounds}
                        onChange={(event) =>
                          updateRow(index, { feePounds: event.target.value })
                        }
                        className="w-full min-w-[8rem] rounded-sm border border-plum/15 bg-white py-2 pl-7 pr-3 text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                      />
                    </div>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-brand"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-4 text-xs font-semibold uppercase tracking-wider text-plum hover:text-brand"
        >
          + Add band
        </button>
      </section>

      {preview.length > 0 && (
        <section className="rounded-lg border border-plum/10 bg-cream/40 p-6">
          <h3 className="font-display text-xl text-plum">Preview</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {preview.map((band) => (
              <li key={band.maxWeightGrams}>
                Up to {band.maxWeightGrams}g → {formatMoneyFromPence(band.feePence)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="text-sm text-brand">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-sage">Shipping bands saved.</p>
      )}

      <button
        type="submit"
        disabled={loading || rows.length === 0}
        className="rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save shipping bands"}
      </button>
    </form>
  );
}
