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
      <div className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm">
        <div className="border-b border-plum/8 bg-gradient-to-r from-pink-soft/60 to-surface px-8 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            One last step
          </p>
          <h1 className="mt-2 font-display text-4xl text-plum">Verify your account</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We sent a 6-digit code to{" "}
            <strong className="text-plum">{member.email}</strong>. Enter it below to activate
            your Wild Hearts member account.
          </p>
        </div>

        <div className="px-8 py-8">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <VerificationForm
              accountEmail={member.email}
              accountPhone={member.phone}
              memberName={member.name}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
