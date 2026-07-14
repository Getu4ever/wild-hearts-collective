import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { ShopClearBasketOnSuccess } from "@/app/components/shop-floating-basket";
import { isStripeConfigured } from "@/lib/booking-config";
import { fulfillShopVoucherBySessionId } from "@/lib/shop-checkout";

export const metadata: Metadata = {
  title: "Gift delivered",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ShopSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  let productName: string | null = null;
  let lines: {
    productName: string;
    giftCode: string;
    priceLabel: string;
    quantity: number;
  }[] = [];
  let email: string | null = null;
  let deliveryOk = false;
  let errorMessage = "";

  if (sessionId && isStripeConfigured()) {
    try {
      const result = await fulfillShopVoucherBySessionId(sessionId);
      if (result) {
        productName = result.productName;
        lines = result.lines ?? [];
        email = result.email;
        deliveryOk = true;
      } else {
        errorMessage =
          "We could not confirm that payment. If you were charged, check your email or contact the studio.";
      }
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to complete digital delivery. Please contact the studio.";
    }
  } else if (!sessionId) {
    errorMessage = "Missing checkout session. Please return to the shop.";
  }

  return (
    <>
      {deliveryOk ? <ShopClearBasketOnSuccess /> : null}
      <PageHero
        title={deliveryOk ? "Digital gift delivered" : "Payment received"}
        subtitle="Thank you for shopping with Wild Hearts Collective."
        image="community"
      />

      <ContentSection>
        <div className="mx-auto max-w-2xl rounded-sm border border-plum/10 bg-surface p-8 shadow-sm">
          {deliveryOk ? (
            <>
              <h2 className="font-display text-4xl text-plum">Thank you</h2>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-sage">
                No shipping · Email delivery
              </p>
              <p className="mt-4 text-muted">
                Your order
                {productName ? (
                  <>
                    {" "}
                    of <strong className="text-foreground">{productName}</strong>
                  </>
                ) : null}{" "}
                is confirmed. A digital voucher email has been sent
                {email ? (
                  <>
                    {" "}
                    to <strong className="text-foreground">{email}</strong>
                  </>
                ) : null}
                .
              </p>

              {lines.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {lines.map((line) => (
                    <li
                      key={`${line.giftCode}-${line.productName}`}
                      className="rounded-sm bg-pink-soft px-4 py-4"
                    >
                      <p className="text-sm text-plum">
                        {line.quantity}× {line.productName}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Gift code
                      </p>
                      <p className="font-display text-2xl tracking-wide text-plum">
                        {line.giftCode}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-sm text-muted">
                Keep these codes safe — use them when booking, or forward the email if
                a gift is for someone else.
              </p>
            </>
          ) : (
            <p className="text-muted">{errorMessage || "Something went wrong."}</p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="rounded-sm bg-sage px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
            >
              Back to shop
            </Link>
            <Link
              href="/book"
              className="rounded-sm border border-plum/15 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-plum hover:bg-pink-soft"
            >
              Book a class
            </Link>
          </div>
        </div>
      </ContentSection>
    </>
  );
}
