"use client";

import { useMemo, useState } from "react";
import { formatUkDateShort, formatUkDateTimeShort } from "@/lib/booking-config";
import type {
  AdminShopOverview,
  AdminShopSale,
  AdminShopVoucher,
  GiftCardStatus,
} from "@/lib/admin-shop-service";

const STATUS_FILTERS: Array<{ id: "all" | GiftCardStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "partial", label: "Partial" },
  { id: "redeemed", label: "Redeemed" },
  { id: "expired", label: "Expired" },
];

function statusTone(status: GiftCardStatus) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "redeemed":
      return "border-plum/15 bg-pink-soft/70 text-plum";
    case "expired":
      return "border-stone-200 bg-stone-100 text-stone-600";
  }
}

export function AdminShopDashboard({ data }: { data: AdminShopOverview }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GiftCardStatus>("all");
  const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [saleQuery, setSaleQuery] = useState("");

  const filteredVouchers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return data.vouchers.filter((voucher) => {
      if (statusFilter !== "all" && voucher.status !== statusFilter) return false;
      if (!needle) return true;

      const haystack = [
        voucher.code,
        voucher.productName,
        voucher.purchaserName ?? "",
        voucher.purchaserEmail ?? "",
        voucher.stripeSessionId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [data.vouchers, query, statusFilter]);

  const filteredSales = useMemo(() => {
    const needle = saleQuery.trim().toLowerCase();
    if (!needle) return data.sales;

    return data.sales.filter((sale) => {
      const haystack = [
        sale.summary,
        sale.purchaserName ?? "",
        sale.purchaserEmail ?? "",
        sale.sourceLabel,
        sale.stripeSessionId ?? "",
        ...sale.items.map((item) => item.productName),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [data.sales, saleQuery]);

  const stats = [
    {
      label: "Revenue (30 days)",
      value: data.summary.revenueLast30DaysLabel,
      hint: `${data.summary.ordersLast30Days} orders · ${data.summary.itemsSoldLast30Days} items`,
    },
    {
      label: "Shop orders",
      value: String(data.summary.ordersCount),
      hint: "All paid checkouts",
    },
    {
      label: "Outstanding balance",
      value: data.summary.outstandingBalanceLabel,
      hint: `${data.summary.vouchersSold} gift vouchers`,
    },
    {
      label: "Redeemed (30 days)",
      value: data.summary.redeemedLast30DaysLabel,
      hint: "Spent on bookings & packs",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-plum/10 bg-surface px-5 py-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl text-plum">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-plum">Sales</h2>
            <p className="mt-1 text-sm text-muted">
              Every paid shop checkout — gift vouchers now, physical and other catalog
              items when they go live.
            </p>
          </div>
          <label className="block w-full sm:max-w-xs">
            <span className="sr-only">Search sales</span>
            <input
              type="search"
              value={saleQuery}
              onChange={(event) => setSaleQuery(event.target.value)}
              placeholder="Search product, email, order…"
              className="w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none transition placeholder:text-muted focus:border-pink focus:ring-2 focus:ring-pink/20"
            />
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
          {filteredSales.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted">
              {data.sales.length === 0
                ? "No shop sales yet. Orders appear here as soon as customers check out."
                : "No sales match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                  <tr>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <SaleRows
                      key={sale.id}
                      sale={sale}
                      expanded={expandedSaleId === sale.id}
                      onToggle={() =>
                        setExpandedSaleId((current) =>
                          current === sale.id ? null : sale.id,
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-plum">Gift vouchers</h2>
              <p className="mt-1 text-sm text-muted">
                Redeemable balances from voucher sales — {filteredVouchers.length} of{" "}
                {data.vouchers.length}
              </p>
            </div>
            <label className="block w-full sm:max-w-xs">
              <span className="sr-only">Search vouchers</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code, product, email…"
                className="w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none transition placeholder:text-muted focus:border-pink focus:ring-2 focus:ring-pink/20"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.id === "all"
                  ? data.vouchers.length
                  : data.summary.statusCounts[filter.id];
              const isActive = statusFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-sage text-white shadow-sm"
                      : "border border-plum/15 bg-white text-plum hover:border-pink hover:text-brand"
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1.5 ${isActive ? "text-white/80" : "text-muted"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
            {filteredVouchers.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted">
                {data.vouchers.length === 0
                  ? "No gift vouchers have been sold yet."
                  : "No vouchers match your filters."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Sold</th>
                      <th className="px-4 py-3 font-semibold">Code</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Purchaser</th>
                      <th className="px-4 py-3 font-semibold">Value</th>
                      <th className="px-4 py-3 font-semibold">Remaining</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVouchers.map((voucher) => (
                      <VoucherRows
                        key={voucher.id}
                        voucher={voucher}
                        expanded={expandedVoucherId === voucher.id}
                        onToggle={() =>
                          setExpandedVoucherId((current) =>
                            current === voucher.id ? null : voucher.id,
                          )
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl text-plum">Redemptions</h2>
          <p className="mt-1 text-sm text-muted">Latest voucher spends across the studio</p>

          <div className="mt-5 rounded-lg border border-plum/10 bg-surface p-5 shadow-sm">
            {data.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No redemptions yet. Activity appears when vouchers are used.
              </p>
            ) : (
              <ul className="divide-y divide-plum/10">
                {data.recentActivity.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-plum">{item.amountLabel}</p>
                        <p className="mt-0.5 text-xs text-muted">{item.reasonLabel}</p>
                        <p className="mt-2 truncate font-mono text-xs text-plum/80">
                          {item.code}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {item.purchaserName || item.purchaserEmail || item.productName}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-muted">
                        {formatUkDateTimeShort(item.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-plum/10 bg-surface p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">
              Voucher status mix
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  ["active", "Active"],
                  ["partial", "Partially used"],
                  ["redeemed", "Fully redeemed"],
                  ["expired", "Expired"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 border-b border-plum/10 pb-3 last:border-b-0 last:pb-0"
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-display text-xl text-plum">
                    {data.summary.statusCounts[key]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}

function SaleRows({
  sale,
  expanded,
  onToggle,
}: {
  sale: AdminShopSale;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-plum/8 align-top last:border-b-0">
        <td className="px-4 py-4 whitespace-nowrap text-muted">
          {formatUkDateTimeShort(sale.createdAt)}
        </td>
        <td className="px-4 py-4">
          <p className="font-medium text-plum">{sale.summary}</p>
          <p className="mt-1 text-xs text-muted">
            {sale.itemCount} item{sale.itemCount === 1 ? "" : "s"}
            {sale.isLegacy ? " · legacy record" : ""}
          </p>
        </td>
        <td className="px-4 py-4">
          <p className="text-foreground">{sale.purchaserName || "—"}</p>
          {sale.purchaserEmail ? (
            <a
              href={`mailto:${sale.purchaserEmail}`}
              className="mt-0.5 block text-xs text-plum hover:text-pink hover:underline"
            >
              {sale.purchaserEmail}
            </a>
          ) : (
            <p className="mt-0.5 text-xs text-muted">No email on file</p>
          )}
        </td>
        <td className="px-4 py-4">
          <span className="inline-flex rounded-full border border-plum/15 bg-pink-soft/70 px-2.5 py-1 text-xs font-semibold text-plum">
            {sale.sourceLabel}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap font-medium text-plum">
          {sale.totalLabel}
        </td>
        <td className="px-4 py-4">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
          >
            {expanded ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-plum/8 bg-pink-soft/25 last:border-b-0">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Order details
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <DetailRow label="Status" value={sale.status} />
                  <DetailRow label="Type" value={sale.sourceLabel} />
                  <DetailRow
                    label="Stripe session"
                    value={sale.stripeSessionId ?? "Manual / CLI issue"}
                    mono={Boolean(sale.stripeSessionId)}
                  />
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Line items
                </h3>
                <ul className="mt-3 space-y-2">
                  {sale.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-sm border border-plum/10 bg-white px-3 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-medium text-plum">
                          {item.quantity}× {item.productName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.categoryLabel} · {item.fulfillmentLabel}
                        </p>
                      </div>
                      <p className="shrink-0 font-medium text-plum">
                        {item.lineTotalLabel}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function VoucherRows({
  voucher,
  expanded,
  onToggle,
}: {
  voucher: AdminShopVoucher;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-plum/8 align-top last:border-b-0">
        <td className="px-4 py-4 whitespace-nowrap text-muted">
          {formatUkDateTimeShort(voucher.createdAt)}
        </td>
        <td className="px-4 py-4">
          <code className="rounded-sm bg-pink-soft/80 px-2 py-1 font-mono text-xs font-semibold text-plum">
            {voucher.code}
          </code>
        </td>
        <td className="px-4 py-4 font-medium text-plum">{voucher.productName}</td>
        <td className="px-4 py-4">
          <p className="text-foreground">{voucher.purchaserName || "—"}</p>
          {voucher.purchaserEmail ? (
            <a
              href={`mailto:${voucher.purchaserEmail}`}
              className="mt-0.5 block text-xs text-plum hover:text-pink hover:underline"
            >
              {voucher.purchaserEmail}
            </a>
          ) : (
            <p className="mt-0.5 text-xs text-muted">No email on file</p>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-plum">
          {voucher.initialBalanceLabel}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <p className="font-medium text-plum">{voucher.balanceLabel}</p>
          {voucher.spentPence > 0 && (
            <p className="mt-0.5 text-xs text-muted">{voucher.spentLabel} used</p>
          )}
        </td>
        <td className="px-4 py-4">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(voucher.status)}`}
          >
            {voucher.statusLabel}
          </span>
          {voucher.expiresAt && (
            <p className="mt-1.5 text-xs text-muted">
              Exp. {formatUkDateShort(voucher.expiresAt)}
            </p>
          )}
        </td>
        <td className="px-4 py-4">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
          >
            {expanded ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-plum/8 bg-pink-soft/25 last:border-b-0">
          <td colSpan={8} className="px-4 py-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Sale details
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <DetailRow label="Product" value={voucher.productName} />
                  <DetailRow
                    label="Stripe session"
                    value={voucher.stripeSessionId ?? "Manual / CLI issue"}
                    mono={Boolean(voucher.stripeSessionId)}
                  />
                  <DetailRow
                    label="Expires"
                    value={
                      voucher.expiresAt
                        ? formatUkDateShort(voucher.expiresAt)
                        : "No expiry"
                    }
                  />
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Redemption history
                </h3>
                {voucher.redemptions.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No redemptions yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {voucher.redemptions.map((redemption) => (
                      <li
                        key={redemption.id}
                        className="flex items-start justify-between gap-3 rounded-sm border border-plum/10 bg-white px-3 py-2.5 text-sm"
                      >
                        <div>
                          <p className="font-medium text-plum">
                            {redemption.isRestore ? "+" : "−"}
                            {redemption.amountLabel}
                            <span className="ml-2 font-normal text-muted">
                              {redemption.reasonLabel}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            Balance after: {redemption.balanceAfterLabel}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-muted">
                          {formatUkDateTimeShort(redemption.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-plum/10 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-plum ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
