import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MemberLoginForm } from "@/app/components/member-login-form";
import { getCurrentMember } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Member login",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const member = await getCurrentMember();
  if (member) redirect("/account");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-20">
      <div className="rounded-lg border border-plum/10 bg-surface p-8 shadow-sm">
        <div className="mb-6 h-px w-12 bg-pink" />
        <h1 className="font-display text-4xl text-plum">Member login</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Sign in to view your bookings, update your profile, and manage your membership.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <MemberLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
