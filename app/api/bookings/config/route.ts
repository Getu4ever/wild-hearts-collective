import { NextResponse } from "next/server";
import {
  getClassPaymentAmountPence,
  isStripeConfigured,
} from "@/lib/booking-config";
import { isEmailConfigured } from "@/lib/email";
import { classPaymentLabel } from "@/lib/stripe";

export async function GET() {
  const amountPence = getClassPaymentAmountPence();
  const priceLabel = classPaymentLabel();

  return NextResponse.json({
    classAmountPence: amountPence,
    classPriceLabel: priceLabel,
    // Legacy keys kept for older clients
    depositAmountPence: amountPence,
    depositLabel: priceLabel,
    stripeEnabled: isStripeConfigured(),
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    emailEnabled: isEmailConfigured(),
  });
}
