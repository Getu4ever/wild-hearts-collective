import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { ShopClearBasketOnSuccess } from "@/app/components/shop-floating-basket";
import { isStripeConfigured } from "@/lib/booking-config";
import { fulfillShopVoucherBySessionId } from "@/lib/shop-checkout";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ShopSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  let productName: string | null = null;
  let giftLines: {
    productName: string;
    giftCode?: string;
    priceLabel: string;
    quantity: number;
    balanceLabel?: string;
  }[] = [];
  let physicalLines: {
    productName: string;
    priceLabel: string;
    quantity: number;
  }[] = [];
  let email: string | null = null;
  let deliveryOk = false;
  let hasGiftVouchers = false;
  let hasPhysical = false;
  let errorMessage = "";

  if (sessionId && isStripeConfigured()) {
    try {
      const result = await fulfillShopVoucherBySessionId(sessionId);
      if (result) {
        productName = result.productName;
        giftLines = result.lines ?? [];
        physicalLines = result.physicalLines ?? [];
        email = result.email;
        hasGiftVouchers = result.hasGiftVouchers;
        hasPhysical = result.hasPhysical;
        deliveryOk = true;
      } else {
        errorMessage =
          "We could not confirm that payment. If you were charged, check your email or contact the studio.";
      }
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to complete your order. Please contact the studio.";
    }
  } else if (!sessionId) {
    errorMessage = "Missing checkout session. Please return to the shop.";
  }

  const heroTitle = deliveryOk
    ? hasGiftVouchers && !hasPhysical
      ? "Digital gift delivered"
      : hasPhysical && !hasGiftVouchers
        ? "Order confirmed"
        : "Order confirmed"
    : "Payment received";

  return (
    <>
      {deliveryOk ? <ShopClearBasketOnSuccess /> : null}
      <PageHero
        title={heroTitle}
        subtitle="Thank you for shopping with Wild Hearts Collective."
        image="community"
      />

      <ContentSection>
        <div className="mx-auto max-w-2xl rounded-sm border border-plum/10 bg-surface p-8 shadow-sm">
          {deliveryOk ? (
            <>
              <h2 className="font-display text-4xl text-plum">Thank you</h2>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-sage">
                {hasGiftVouchers && hasPhysical
                  ? "Digital delivery · UK shipping"
                  : hasPhysical
                    ? "UK shipping"
                    : "No shipping · Email delivery"}
              </p>
              <p className="mt-4 text-muted">
                Your order
                {productName ? (
                  <>
                    {" "}
                    of <strong className="text-foreground">{productName}</strong>
                  </>
                ) : null}{" "}
                is confirmed
                {email ? (
                  <>
                    . A confirmation email has been sent to{" "}
                    <strong className="text-foreground">{email}</strong>
                  </>
                ) : null}
                .
              </p>

              {giftLines.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-2xl text-plum">Gift codes</h3>
                  <ul className="mt-4 space-y-3">
                    {giftLines.map((line) => (
                      <li
                        key={`${line.giftCode}-${line.productName}`}
                        className="rounded-sm bg-pink-soft px-4 py-4"
                      >
                        <p className="text-sm text-plum">{line.productName}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Gift code
                        </p>
                        <p className="font-display text-2xl tracking-wide text-plum">
                          {line.giftCode}
                        </p>
                        {line.balanceLabel ? (
                          <p className="mt-2 text-sm text-muted">
                            Balance:{" "}
                            <strong className="text-plum">{line.balanceLabel}</strong>
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-muted">
                    Keep these codes safe — use them when booking a class or buying a
                    class pack. Spending less than the full value leaves the remaining
                    balance on the same code.
                  </p>
                </div>
              )}

              {physicalLines.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-2xl text-plum">Items to ship</h3>
                  <ul className="mt-4 space-y-3">
                    {physicalLines.map((line) => (
                      <li
                        key={`${line.productName}-${line.quantity}-${line.priceLabel}`}
                        className="flex items-center justify-between gap-4 rounded-sm border border-plum/10 bg-cream/40 px-4 py-4"
                      >
                        <div>
                          <p className="font-medium text-plum">
                            {line.quantity}× {line.productName}
                          </p>
                          <p className="mt-1 text-xs text-muted">Ready for UK dispatch</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-plum">
                          {line.priceLabel}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-muted">
                    We&apos;ll prepare these for shipping to the address you provided at
                    checkout.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted">{errorMessage || "Something went wrong."}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              Back to shop
            </Link>
            {hasGiftVouchers ? (
              <Link
                href="/book"
                className="rounded-sm border border-plum/20 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
              >
                Book a class
              </Link>
            ) : null}
          </div>
        </div>
      </ContentSection>
    </>
  );
}
