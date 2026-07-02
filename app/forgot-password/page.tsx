import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-20">
      <div className="rounded-lg border border-plum/10 bg-surface p-8 shadow-sm">
        <div className="mb-6 h-px w-12 bg-pink" />
        <h1 className="font-display text-4xl text-plum">Forgot password</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Enter your email and we&apos;ll send a verification code so you can choose a
          new password.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
