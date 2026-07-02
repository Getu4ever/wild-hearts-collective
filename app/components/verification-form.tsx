"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";

export function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/members/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          purpose: VERIFICATION_PURPOSE.signupVerify,
          channel,
          email: email || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to verify code.");
        return;
      }

      setMessage("Your account has been verified.");
      router.push("/account");
      router.refresh();
    } catch {
      setError("Unable to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await fetch("/api/members/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: VERIFICATION_PURPOSE.signupVerify,
          channel,
          email: email || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to resend code.");
        return;
      }

      setMessage(`A new code was sent to ${data.destination}.`);
    } catch {
      setError("Unable to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Enter the 6-digit verification code we sent you. Choose email or phone if both are
        available on your account.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setChannel(VERIFICATION_CHANNEL.email)}
          className={`rounded-sm border px-3 py-2 text-sm font-semibold transition ${
            channel === VERIFICATION_CHANNEL.email
              ? "border-brand bg-pink-soft text-brand"
              : "border-plum/15 text-plum hover:border-pink"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setChannel(VERIFICATION_CHANNEL.phone)}
          className={`rounded-sm border px-3 py-2 text-sm font-semibold transition ${
            channel === VERIFICATION_CHANNEL.phone
              ? "border-brand bg-pink-soft text-brand"
              : "border-plum/15 text-plum hover:border-pink"
          }`}
        >
          Phone
        </button>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-plum">
          Verification code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

      {message && (
        <p className="text-sm text-sage" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-plum px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-plum-hover disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify account"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="w-full text-sm font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>

      <p className="text-center text-sm text-muted">
        <Link href="/account" className="font-semibold text-brand underline-offset-4 hover:underline">
          Back to account
        </Link>
      </p>
    </form>
  );
}
