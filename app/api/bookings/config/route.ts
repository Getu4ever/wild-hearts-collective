import { isStripeConfigured } from "@/lib/booking-config";
import { isEmailConfigured } from "@/lib/email";
import {
  resolveClassPaymentAmountPence,
  resolveFourWeekCoursePricePence,
} from "@/lib/studio-pricing-service";
import { formatMoneyFromPence } from "@/lib/booking-config";
import { getStripePublishableKey } from "@/lib/stripe-env";

export async function GET() {
  const [amountPence, courseAmountPence] = await Promise.all([
    resolveClassPaymentAmountPence(),
    resolveFourWeekCoursePricePence(),
  ]);
  const priceLabel = formatMoneyFromPence(amountPence);
  const coursePriceLabel = formatMoneyFromPence(courseAmountPence);

  return NextResponse.json({
    classAmountPence: amountPence,
    classPriceLabel: priceLabel,
    courseAmountPence: courseAmountPence,
    coursePriceLabel,
    // Legacy keys kept for older clients
    depositAmountPence: amountPence,
    depositLabel: priceLabel,
    stripeEnabled: isStripeConfigured(),
    stripePublishableKey: getStripePublishableKey(),
    emailEnabled: isEmailConfigured(),
  });
}
