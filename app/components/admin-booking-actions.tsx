"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type AdminBookingActionsProps = {
  bookingId: string;
  currentStatus: string;
};

export function AdminBookingActions({
  bookingId,
  currentStatus,
}: AdminBookingActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(nextStatus: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update booking.");
      }

      setStatus(data.status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={status}
        disabled={loading}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-sm border border-plum/15 bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wide text-plum"
      >
        {statuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-brand">{error}</p>}
    </div>
  );
}
