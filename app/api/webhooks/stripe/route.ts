import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { confirmBooking } from "@/lib/booking-service";
import { db } from "@/lib/db";
import {
  activateMembershipFromSubscription,
  syncMembershipFromStripeSubscription,
} from "@/lib/membership-stripe";
import { verifyStripeWebhook } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = verifyStripeWebhook(payload, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === "membership" && session.client_reference_id) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (subscriptionId) {
        await activateMembershipFromSubscription(session.client_reference_id, {
          id: subscriptionId,
          status: "active",
        });
      }
    } else {
      const bookingId =
        session.metadata?.bookingId ?? session.client_reference_id ?? undefined;

      if (bookingId) {
        const booking = await db.booking.findUnique({ where: { id: bookingId } });

        if (booking && booking.status === BOOKING_STATUS.pending) {
          await confirmBooking(bookingId, {
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
            amountPaid: session.amount_total ?? undefined,
          });
        }
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    const user = userId
      ? await db.user.findUnique({ where: { id: userId } })
      : await db.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

    if (user) {
      await syncMembershipFromStripeSubscription(user.id, subscription);
    }
  }

  return NextResponse.json({ received: true });
}
