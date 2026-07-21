import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { isEmailConfigured } from "@/lib/email";
import {
  resolveClassPaymentAmountPence,
} from "@/lib/studio-pricing-service";
import { formatMoneyFromPence } from "@/lib/booking-config";

export async function GET() {
  const amountPence = await resolveClassPaymentAmountPence();
  const priceLabel = formatMoneyFromPence(amountPence);

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
