"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { stripeElementsAppearance } from "@/lib/stripe-appearance";

type StripePaymentFormProps = {
  mode: "setup" | "subscription";
  publishableKey: string;
  submitLabel: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

function PaymentFormInner({
  mode,
  submitLabel,
  onSuccess,
  onError,
  subscriptionId,
}: Omit<StripePaymentFormProps, "publishableKey"> & { subscriptionId?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);

    try {
      if (mode === "setup") {
        const result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/account/profile#billing`,
          },
          redirect: "if_required",
        });

        if (result.error) {
          onError(result.error.message ?? "Unable to save payment method.");
          return;
        }

        onSuccess();
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account/profile?membership=success#billing`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        onError(result.error.message ?? "Payment could not be completed.");
        return;
      }

      if (subscriptionId) {
        await fetch("/api/members/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        });
      }

      onSuccess();
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-sm border border-plum/10 bg-white p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing…" : submitLabel}
      </button>
    </form>
  );
}

export function StripePaymentForm({
  mode,
  publishableKey,
  submitLabel,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();
  const [loadingIntent, setLoadingIntent] = useState(true);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadIntent() {
      setLoadingIntent(true);
      setClientSecret(null);
      setSubscriptionId(undefined);

      try {
        const endpoint =
          mode === "setup"
            ? "/api/members/billing/setup-intent"
            : "/api/members/billing/subscribe-intent";

        const response = await fetch(endpoint, { method: "POST" });
        const data = (await response.json()) as {
          clientSecret?: string;
          subscriptionId?: string;
          error?: string;
        };

        if (!response.ok || !data.clientSecret) {
          onError(data.error ?? "Unable to load payment form.");
          return;
        }

        if (!cancelled) {
          setClientSecret(data.clientSecret);
          setSubscriptionId(data.subscriptionId);
        }
      } catch {
        if (!cancelled) onError("Unable to load payment form.");
      } finally {
        if (!cancelled) setLoadingIntent(false);
      }
    }

    loadIntent();

    return () => {
      cancelled = true;
    };
  }, [mode, onError]);

  const options = useMemo<StripeElementsOptions | undefined>(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: stripeElementsAppearance,
    };
  }, [clientSecret]);

  if (loadingIntent) {
    return <p className="text-sm text-muted">Loading secure payment form…</p>;
  }

  if (!clientSecret || !stripePromise || !options) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner
        mode={mode}
        submitLabel={submitLabel}
        onSuccess={onSuccess}
        onError={onError}
        subscriptionId={subscriptionId}
      />
    </Elements>
  );
}
