import { NextResponse } from "next/server";
import { getDepositAmountPence } from "@/lib/booking-config";
import { depositLabel } from "@/lib/stripe";
import { isEmailConfigured } from "@/lib/email";
import { isStripeConfigured } from "@/lib/booking-config";

export async function GET() {
  return NextResponse.json({
    depositAmountPence: getDepositAmountPence(),
    depositLabel: depositLabel(),
    stripeEnabled: isStripeConfigured(),
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    emailEnabled: isEmailConfigured(),
  });
}
