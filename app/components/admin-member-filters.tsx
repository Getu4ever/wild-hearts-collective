"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";

type AdminMemberFiltersProps = {
  initialQuery: string;
  initialStatus: string;
  initialPlan: string;
};

export function AdminMemberFilters({
  initialQuery,
  initialStatus,
  initialPlan,
}: AdminMemberFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [plan, setPlan] = useState(initialPlan);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (status) params.set("status", status);
    else params.delete("status");
    if (plan) params.set("plan", plan);
    else params.delete("plan");
    router.push(`/admin/members?${params.toString()}`);
  }

  return (
    <form
      onSubmit={applyFilters}
      className="mt-8 grid gap-3 rounded-lg border border-plum/10 bg-surface p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, email, or phone"
        className="rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
      />
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
      >
        <option value="">All statuses</option>
        {Object.values(MEMBERSHIP_STATUS).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <select
        value={plan}
        onChange={(event) => setPlan(event.target.value)}
        className="rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:ring-1"
      >
        <option value="">All plans</option>
        <option value={MEMBERSHIP_PLAN.account}>Studio Member</option>
        <option value={MEMBERSHIP_PLAN.monthly}>Monthly Membership</option>
      </select>
      <button
        type="submit"
        className="rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
      >
        Filter
      </button>
    </form>
  );
}
