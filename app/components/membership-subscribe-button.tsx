"use client";

import { useState } from "react";

export function MembershipSubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setError("");
    setLoading(true);

    try {
      const meResponse = await fetch("/api/members/me");
      const meData = await meResponse.json();

      if (!meData.user) {
        window.location.href = "/register?plan=monthly";
        return;
      }

      const response = await fetch("/api/members/subscribe", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to start checkout.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full rounded-sm bg-plum px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-plum-hover disabled:opacity-60"
      >
        {loading ? "Redirecting…" : "Subscribe monthly"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-brand" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
