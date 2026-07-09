"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";

type VerificationFormProps = {
  accountEmail?: string;
  accountPhone?: string | null;
  memberName?: string;
};

export function VerificationForm({
  accountEmail = "",
  accountPhone = null,
  memberName = "",
}: VerificationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email") ?? "";

  const resolvedEmail = accountEmail || queryEmail;
  const emailLocked = Boolean(accountEmail || queryEmail);

  const [email, setEmail] = useState(resolvedEmail);
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const phoneAvailable = Boolean(accountPhone?.trim());

  const destinationHint = useMemo(() => {
    if (channel === VERIFICATION_CHANNEL.phone && accountPhone) {
      return accountPhone;
    }
    return email || resolvedEmail;
  }, [channel, accountPhone, email, resolvedEmail]);

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter the email address for your account.");
      return;
    }

    if (code.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/members/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          purpose: VERIFICATION_PURPOSE.signupVerify,
          channel,
          email: trimmedEmail,
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

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter the email address for your account.");
      return;
    }

    setResending(true);

    try {
      const response = await fetch("/api/members/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: VERIFICATION_PURPOSE.signupVerify,
          channel,
          email: trimmedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to resend code.");
        return;
      }

      setMessage(`A new code was sent to ${data.destination ?? destinationHint}.`);
    } catch {
      setError("Unable to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-5">
      {memberName && (
        <p className="rounded-lg bg-pink-soft/50 px-4 py-3 text-sm text-plum">
          Hi <strong>{memberName.split(" ")[0]}</strong>, check your inbox for a 6-digit code.
        </p>
      )}

      <div>
        <label htmlFor="verify-email" className="block text-sm font-semibold text-plum">
          Email address
        </label>
        <p className="mt-1 text-xs text-muted">
          {emailLocked
            ? "This is the email we sent your verification code to."
            : "Enter the email you used when creating your account."}
        </p>
        <input
          id="verify-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          readOnly={emailLocked}
          value={email}
          onChange={(event) => {
            if (!emailLocked) {
              setEmail(event.target.value);
            }
          }}
          className={`mt-2 w-full rounded-lg border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1 ${
            emailLocked ? "cursor-default bg-pink-soft/40 text-plum" : "bg-white"
          }`}
        />
      </div>

      {phoneAvailable && (
        <div>
          <p className="text-sm font-semibold text-plum">Send code to</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChannel(VERIFICATION_CHANNEL.email)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
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
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                channel === VERIFICATION_CHANNEL.phone
                  ? "border-brand bg-pink-soft text-brand"
                  : "border-plum/15 text-plum hover:border-pink"
              }`}
            >
              Phone
            </button>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-plum">
          Verification code
        </label>
        <p className="mt-1 text-xs text-muted">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-plum">{destinationHint || "your email"}</span>.
        </p>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="mt-2 w-full rounded-lg border border-plum/15 bg-white px-4 py-3 text-center text-xl tracking-[0.35em] outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

      {message && (
        <p className="rounded-lg border border-sage/30 bg-sage-light px-4 py-3 text-sm text-plum" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-brand/20 bg-pink-soft px-4 py-3 text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-lg bg-sage px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify account"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || !email.trim()}
        className="w-full text-sm font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>

      <p className="text-center text-sm text-muted">
        Wrong account?{" "}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in with a different email
        </Link>
      </p>
    </form>
  );
}
