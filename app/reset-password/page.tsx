import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/app/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-20">
      <div className="rounded-lg border border-plum/10 bg-surface p-8 shadow-sm">
        <div className="mb-6 h-px w-12 bg-pink" />
        <h1 className="font-display text-4xl text-plum">Reset password</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Enter the verification code we sent you, then choose a new password.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
