"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthDivider, GoogleSignInButton } from "./social-auth-buttons";

export function MemberLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const resetSuccess = searchParams.get("reset") === "success";
  const googleError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }

      if (data.requiresVerification) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }

      router.push(next.startsWith("/") ? next : "/account");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {resetSuccess && (
        <p className="rounded-sm border border-sage/30 bg-sage-light px-4 py-3 text-sm text-plum">
          Your password has been updated. You can sign in now.
        </p>
      )}

      {googleError && (
        <p className="rounded-sm border border-brand/20 bg-pink-soft px-4 py-3 text-sm text-brand">
          Google sign-in could not be completed. Please try again or use email.
        </p>
      )}

      <GoogleSignInButton nextPath={next} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-plum">
            Email
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
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-semibold text-plum">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
