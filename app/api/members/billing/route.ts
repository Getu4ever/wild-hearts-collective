import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { getMemberSession } from "@/lib/member-auth";
import { getMemberBillingSummary } from "@/lib/membership-billing";

export async function GET() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({
      billing: {
        configured: false,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
        paymentMethods: [],
        invoices: [],
        canSubscribe: false,
        hasActiveMembership: false,
        membershipPriceLabel: "",
      },
    });
  }

  const billing = await getMemberBillingSummary(session.userId);
  return NextResponse.json({ billing });
}
