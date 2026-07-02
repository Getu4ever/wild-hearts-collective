"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthDivider, GoogleSignInButton } from "./social-auth-buttons";

export function MemberRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }

      if (data.requiresVerification) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        router.refresh();
        return;
      }

      if (plan === "monthly") {
        const subscribeResponse = await fetch("/api/members/subscribe", {
          method: "POST",
        });
        const subscribeData = await subscribeResponse.json();

        if (subscribeResponse.ok && subscribeData.checkoutUrl) {
          window.location.href = subscribeData.checkoutUrl;
          return;
        }
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {plan === "monthly" && (
        <p className="rounded-sm border border-pink/40 bg-pink-soft px-4 py-3 text-sm text-plum">
          You&apos;re signing up for a <strong>Monthly Membership</strong>. After verifying
          your account, you&apos;ll be taken to secure checkout.
        </p>
      )}

      <GoogleSignInButton nextPath={plan === "monthly" ? "/account" : "/account"} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-plum">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
          />
        </div>

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
          <label htmlFor="phone" className="block text-sm font-semibold text-plum">
            Phone <span className="font-normal text-muted">(optional, for SMS verification)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-plum">
            Password
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
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
