"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugifyCategoryId, type ShopCategory } from "@/lib/shop-data";

type CategoryRow = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  productCount?: number;
  /** When true, id is locked (existing category). */
  lockedId?: boolean;
};

function toRows(categories: ShopCategory[]): CategoryRow[] {
  return categories.map((category) => ({
    ...category,
    lockedId: true,
  }));
}

export function AdminShopCategoriesForm({
  initialCategories,
}: {
  initialCategories: Array<ShopCategory & { productCount?: number }>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<CategoryRow[]>(() => toRows(initialCategories));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const preview = useMemo(
    () =>
      rows
        .map((row) => ({
          id: slugifyCategoryId(row.id || row.label),
          label: row.label.trim(),
          shortLabel: (row.shortLabel || row.label).trim(),
          description: row.description.trim(),
        }))
        .filter((row) => row.id && row.label),
    [rows],
  );

  function updateRow(index: number, patch: Partial<CategoryRow>) {
    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (!row.lockedId && patch.label != null && !patch.id) {
          next.id = slugifyCategoryId(patch.label);
        }
        return next;
      }),
    );
    setSaved(false);
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: "",
        label: "",
        shortLabel: "",
        description: "",
        lockedId: false,
        productCount: 0,
      },
    ]);
    setSaved(false);
  }

  function removeRow(index: number) {
    const row = rows[index];
    if (row?.productCount && row.productCount > 0) {
      setError(
        `“${row.label || row.id}” still has ${row.productCount} product${
          row.productCount === 1 ? "" : "s"
        }. Reassign those products first, then remove the category.`,
      );
      return;
    }
    setRows((current) => current.filter((_, i) => i !== index));
    setError("");
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch("/api/admin/shop/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: rows.map((row) => ({
            id: slugifyCategoryId(row.id || row.label),
            label: row.label.trim(),
            shortLabel: (row.shortLabel || row.label).trim(),
            description: row.description.trim(),
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save.");
      setRows(
        (payload.categories as Array<ShopCategory & { productCount?: number }>).map(
          (category) => ({ ...category, lockedId: true }),
        ),
      );
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
        <h2 className="font-display text-2xl text-plum">Shop categories</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Add or remove the category tabs shown in the shop and product forms. Changing
          an id on an existing category will orphan products still using the old id —
          rename the label instead when possible.
        </p>

        <div className="mt-6 space-y-4">
          {rows.map((row, index) => (
            <div
              key={`${row.lockedId ? row.id : "new"}-${index}`}
              className="grid gap-3 rounded-sm border border-plum/10 bg-white p-4 md:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,8rem)_auto]"
            >
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Id
                </span>
                <input
                  required
                  value={row.id}
                  disabled={row.lockedId}
                  onChange={(event) => updateRow(index, { id: event.target.value })}
                  placeholder="e.g. gift-vouchers"
                  className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20 disabled:bg-cream/60 disabled:text-muted"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Label
                </span>
                <input
                  required
                  value={row.label}
                  onChange={(event) => updateRow(index, { label: event.target.value })}
                  placeholder="Gift Vouchers"
                  className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Short label
                </span>
                <input
                  value={row.shortLabel}
                  onChange={(event) =>
                    updateRow(index, { shortLabel: event.target.value })
                  }
                  placeholder="E-Vouchers"
                  className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                />
              </label>

              <div className="flex items-end justify-between gap-3 md:flex-col md:items-stretch md:justify-end">
                <p className="text-xs text-muted">
                  {row.productCount ?? 0} product
                  {(row.productCount ?? 0) === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-brand"
                >
                  Remove
                </button>
              </div>

              <label className="block md:col-span-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Description
                </span>
                <input
                  value={row.description}
                  onChange={(event) =>
                    updateRow(index, { description: event.target.value })
                  }
                  placeholder="Shown in admin as a reminder of what belongs here."
                  className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
                />
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-4 text-xs font-semibold uppercase tracking-wider text-plum hover:text-brand"
        >
          + Add category
        </button>
      </section>

      {preview.length > 0 && (
        <section className="rounded-lg border border-plum/10 bg-cream/40 p-6">
          <h3 className="font-display text-xl text-plum">Storefront tabs</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {preview.map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
              >
                {category.shortLabel}
              </span>
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-sm text-brand">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-sage">Categories saved.</p>
      )}

      <button
        type="submit"
        disabled={loading || rows.length === 0}
        className="rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save categories"}
      </button>
    </form>
  );
}
