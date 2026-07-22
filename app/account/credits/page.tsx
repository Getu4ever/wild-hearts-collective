import type { Metadata } from "next";
import Link from "next/link";
import { MemberCreditsDashboard } from "@/app/components/member-credits-dashboard";
import { getMemberSession } from "@/lib/member-auth";
import { getMemberCreditsOverview } from "@/lib/member-credits-service";
import { isStripeConfigured } from "@/lib/booking-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Class credits",
  robots: { index: false, follow: false },
};

export default async function AccountCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string; checkout?: string }>;
}) {
  const session = await getMemberSession();
  if (!session) return null;

  const params = await searchParams;
  const resumePurchaseId =
    params.checkout === "1" && params.purchase ? params.purchase : undefined;

  const overview = await getMemberCreditsOverview(session.userId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Class credits</p>
          <h1 className="font-display text-4xl text-plum">Your credit balance</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            View your balance, track activity, and purchase class packs without leaving your
            account.
          </p>
        </div>
        <Link
          href="/account/profile#activity"
          className="rounded-lg border border-plum/15 px-4 py-2.5 text-sm font-semibold text-plum hover:border-pink hover:text-brand"
        >
          Back to profile
        </Link>
      </div>

      <MemberCreditsDashboard
        overview={overview}
        stripeEnabled={isStripeConfigured()}
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
        resumePurchaseId={resumePurchaseId}
      />
    </div>
  );
}
