"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/members/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, channel }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to send verification code.");
        return;
      }

      setMessage(data.message ?? "Verification code sent.");
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&channel=${channel}`,
      );
    } catch {
      setError("Unable to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-plum">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-plum">Send code via</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
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
        className="w-full rounded-sm bg-sage px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send verification code"}
      </button>

      <p className="text-center text-sm text-muted">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
