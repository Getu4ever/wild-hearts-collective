import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { VerificationForm } from "@/app/components/verification-form";
import { getCurrentMember } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Verify account",
  robots: { index: false, follow: false },
};

export default async function VerifyPage() {
  const member = await getCurrentMember();
  if (!member) {
    redirect("/login?next=/verify");
  }

  if (member.emailVerified) {
    redirect("/account");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-20">
      <div className="rounded-lg border border-plum/10 bg-surface p-8 shadow-sm">
        <div className="mb-6 h-px w-12 bg-pink" />
        <h1 className="font-display text-4xl text-plum">Verify your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We sent a 6-digit verification code to your email. Enter it below to
          activate your Wild Hearts member account.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <VerificationForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
