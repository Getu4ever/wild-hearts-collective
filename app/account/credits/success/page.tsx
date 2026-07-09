import type { Metadata } from "next";
import Link from "next/link";
import { fulfillPendingClassPackPurchase } from "@/lib/credit-service";
import { getMemberSession } from "@/lib/member-auth";
import { getMemberCreditsOverview } from "@/lib/member-credits-service";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Credits purchased",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ purchase?: string; session_id?: string }>;
};

export default async function CreditsSuccessPage({ searchParams }: SuccessPageProps) {
  const session = await getMemberSession();
  if (!session) return null;

  const { purchase: purchaseId, session_id: stripeSessionId } = await searchParams;

  let purchase = purchaseId
    ? await db.classPackPurchase.findFirst({
        where: { id: purchaseId, userId: session.userId },
        include: { pack: true },
      })
    : null;

  if (purchase && purchase.status === "pending" && stripeSessionId) {
    await fulfillPendingClassPackPurchase(purchaseId!, undefined, stripeSessionId);
    purchase = await db.classPackPurchase.findFirst({
      where: { id: purchaseId, userId: session.userId },
      include: { pack: true },
    });
  }

  const overview = await getMemberCreditsOverview(session.userId);
  const isFulfilled = purchase?.status === "active";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm">
        <div className="bg-gradient-to-r from-plum to-brand px-8 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-light">
            {isFulfilled ? "Payment complete" : "Processing payment"}
          </p>
          <h1 className="mt-2 font-display text-4xl">
            {isFulfilled ? "Credits added" : "Thank you"}
          </h1>
        </div>

        <div className="space-y-4 px-8 py-8">
          {purchase ? (
            <>
              <p className="text-sm leading-relaxed text-muted">
                {isFulfilled ? (
                  <>
                    Your <strong className="text-plum">{purchase.pack.name}</strong> is now active.
                    {purchase.creditsGranted === 1
                      ? " 1 credit has"
                      : ` ${purchase.creditsGranted} credits have`}{" "}
                    been added to your account.
                  </>
                ) : (
                  <>
                    We are confirming your payment for{" "}
                    <strong className="text-plum">{purchase.pack.name}</strong>. Your credits will
                    appear shortly — refresh this page if they do not show up within a minute.
                  </>
                )}
              </p>
              <p className="rounded-lg bg-pink-soft/50 px-4 py-3 text-sm text-plum">
                Current balance: <strong>{overview.balance}</strong>{" "}
                {overview.balance === 1 ? "credit" : "credits"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              We could not find that purchase. If you completed payment, check your email or
              contact the studio.
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/book"
              className="rounded-lg bg-plum px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white hover:bg-plum-hover"
            >
              Book a class
            </Link>
            <Link
              href="/account/credits"
              className="rounded-lg border border-plum/15 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-plum hover:bg-pink-soft"
            >
              View credit activity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
