"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo } from "react";

type BookingEmbeddedCheckoutProps = {
  clientSecret: string;
  publishableKey: string;
};

export function BookingEmbeddedCheckout({
  clientSecret,
  publishableKey,
}: BookingEmbeddedCheckoutProps) {
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  if (!publishableKey || !stripePromise) {
    return (
      <p className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum">
        Online payments are not configured yet. Please contact the studio to complete your
        booking.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-plum/10 bg-white">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
