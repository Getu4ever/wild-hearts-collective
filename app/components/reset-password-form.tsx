"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const resetResponse = await fetch("/api/members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      const resetData = await resetResponse.json();
      if (!resetResponse.ok) {
        setError(resetData.error ?? "Unable to reset password.");
        return;
      }

      router.push("/login?reset=success");
      router.refresh();
    } catch {
      setError("Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-plum">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="mt-2 w-full rounded-sm border border-plum/10 bg-cream/60 px-4 py-3 text-sm text-muted"
        />
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

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-plum">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-plum">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

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
        {loading ? "Updating…" : "Reset password"}
      </button>

      <p className="text-center text-sm text-muted">
        <Link href="/forgot-password" className="font-semibold text-brand underline-offset-4 hover:underline">
          Request a new code
        </Link>
      </p>
    </form>
  );
}
