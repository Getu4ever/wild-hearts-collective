"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelBookingButton({
  bookingId,
  sessionStartsAt,
  status,
}: {
  bookingId: string;
  sessionStartsAt: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (status === "cancelled" || new Date(sessionStartsAt) < new Date()) {
    return null;
  }

  async function cancelBooking() {
    if (!confirm("Cancel this booking? Our 24-hour cancellation policy applies to credit refunds.")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/members/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cancel booking.");
      setMessage(data.message);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={loading}
        onClick={cancelBooking}
        className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline disabled:opacity-60"
      >
        {loading ? "Cancelling…" : "Cancel"}
      </button>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
