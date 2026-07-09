"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StripePaymentForm } from "@/app/components/stripe-payment-form";
import { formatUkDateShort } from "@/lib/booking-config";

import type { MemberBillingSummary } from "@/lib/membership-billing";

function formatDate(value: string) {
  return formatUkDateShort(value);
}

function brandLabel(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function MemberBillingSection() {
  const router = useRouter();
  const [billing, setBilling] = useState<MemberBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [paymentFormKey, setPaymentFormKey] = useState(0);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/members/billing");
      const data = (await response.json()) as {
        billing?: MemberBillingSummary;
        error?: string;
      };

      if (!response.ok || !data.billing) {
        setError(data.error ?? "Unable to load billing details.");
        return;
      }

      setBilling(data.billing);
    } catch {
      setError("Unable to load billing details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  async function handleRemovePaymentMethod(paymentMethodId: string) {
    if (!window.confirm("Remove this payment method?")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/members/billing/payment-method/${paymentMethodId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to remove payment method.");
        return;
      }
      setMessage("Payment method removed.");
      await loadBilling();
    } catch {
      setError("Unable to remove payment method.");
    }
  }

  async function handleSetDefault(paymentMethodId: string) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/members/billing/payment-method/${paymentMethodId}`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to update default payment method.");
        return;
      }
      setMessage("Default payment method updated.");
      await loadBilling();
    } catch {
      setError("Unable to update default payment method.");
    }
  }

  function handlePaymentSuccess(successMessage: string) {
    setMessage(successMessage);
    setError("");
    setShowAddPayment(false);
    setShowSubscribe(false);
    setPaymentFormKey((current) => current + 1);
    loadBilling();
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading billing details…</p>;
  }

  if (!billing?.configured) {
    return (
      <p className="text-sm text-muted">
        Online billing is not configured yet. Please contact the studio if you need help with
        payments.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {(message || error) && (
        <div
          className={`rounded-sm px-4 py-3 text-sm ${
            error
              ? "border border-brand/20 bg-pink-soft text-brand"
              : "border border-sage/30 bg-sage-light text-plum"
          }`}
          role="alert"
        >
          {error || message}
        </div>
      )}

      <section>
        <h3 className="font-display text-xl text-plum">Saved payment methods</h3>
        <p className="mt-1 text-sm text-muted">
          Your card details are stored securely by Stripe. We never see or store full card numbers.
        </p>

        {billing.paymentMethods.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No saved payment methods yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {billing.paymentMethods.map((method) => (
              <li
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-plum/10 bg-white px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-plum">
                    {brandLabel(method.brand)} ending in {method.last4}
                  </p>
                  <p className="text-sm text-muted">
                    Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                    {method.isDefault ? " · Default" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!method.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(method.id)}
                      className="rounded-sm border border-plum/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePaymentMethod(method.id)}
                    className="rounded-sm border border-brand/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand hover:bg-pink-soft"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {!showAddPayment ? (
            <button
              type="button"
              onClick={() => {
                setShowAddPayment(true);
                setShowSubscribe(false);
                setError("");
                setMessage("");
              }}
              className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
            >
              Add payment method
            </button>
          ) : (
            <div className="mt-4 rounded-sm border border-plum/10 bg-cream/30 p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-plum">Add a payment method</p>
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Cancel
                </button>
              </div>
              <StripePaymentForm
                key={`setup-${paymentFormKey}`}
                mode="setup"
                publishableKey={billing.publishableKey}
                submitLabel="Save payment method"
                onSuccess={() => handlePaymentSuccess("Payment method saved.")}
                onError={setError}
              />
            </div>
          )}
        </div>
      </section>

      {billing.canSubscribe && (
        <section className="rounded-sm border border-pink/20 bg-pink-soft/20 p-5">
          <h3 className="font-display text-xl text-plum">Monthly membership</h3>
          <p className="mt-1 text-sm text-muted">
            Subscribe for {billing.membershipPriceLabel}/month. Pay securely here without leaving
            the site — cards, Apple Pay, Google Pay, and other methods appear automatically.
          </p>

          {!showSubscribe ? (
            <button
              type="button"
              onClick={() => {
                setShowSubscribe(true);
                setShowAddPayment(false);
                setError("");
                setMessage("");
              }}
              className="mt-4 rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
            >
              Subscribe with secure checkout
            </button>
          ) : (
            <div className="mt-4 rounded-sm border border-plum/10 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-plum">
                  Complete your {billing.membershipPriceLabel}/month membership
                </p>
                <button
                  type="button"
                  onClick={() => setShowSubscribe(false)}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Cancel
                </button>
              </div>
              <StripePaymentForm
                key={`subscribe-${paymentFormKey}`}
                mode="subscription"
                publishableKey={billing.publishableKey}
                submitLabel={`Subscribe for ${billing.membershipPriceLabel}/month`}
                onSuccess={() => handlePaymentSuccess("Membership payment completed.")}
                onError={setError}
              />
            </div>
          )}
        </section>
      )}

      <section>
        <h3 className="font-display text-xl text-plum">Billing history</h3>
        <p className="mt-1 text-sm text-muted">
          View and download invoices without leaving your profile.
        </p>

        {billing.invoices.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No invoices yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-plum/10 rounded-sm border border-plum/10 bg-white">
            {billing.invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-plum">
                    {invoice.number ? `Invoice ${invoice.number}` : "Invoice"}
                  </p>
                  <p className="text-muted">
                    {formatDate(invoice.created)} · {invoice.amount} · {invoice.status}
                  </p>
                </div>
                {invoice.pdfUrl && (
                  <a
                    href={invoice.pdfUrl}
                    className="rounded-sm border border-plum/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink hover:text-brand"
                  >
                    Download PDF
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
