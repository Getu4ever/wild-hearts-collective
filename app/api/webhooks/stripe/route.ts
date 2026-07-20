import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { CANCELLATION_TYPE } from "@/lib/booking-advanced-config";
import {
  cancelBookingForPaymentExpiry,
  confirmBooking,
  expireStalePendingBookings,
  notifyNextWaitlistEntry,
} from "@/lib/booking-service";
import { fulfillPendingClassPackPurchase } from "@/lib/credit-service";
import { db } from "@/lib/db";
import {
  activateMembershipFromSubscription,
  syncMembershipFromStripeSubscription,
} from "@/lib/membership-stripe";
import { fulfillShopVoucherCheckout } from "@/lib/shop-checkout";
import { getStripeClient, verifyStripeWebhook } from "@/lib/stripe";

async function refundCheckoutPayment(session: Stripe.Checkout.Session) {
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntent) return;

  try {
    await getStripeClient().refunds.create({ payment_intent: paymentIntent });
  } catch (error) {
    console.error("Failed to refund expired booking payment:", error);
  }
}

async function cancelPendingBookingForExpiredCheckout(bookingId: string) {
  const cancelled = await cancelBookingForPaymentExpiry(bookingId);
  if (cancelled) {
    await notifyNextWaitlistEntry(cancelled.sessionId);
  }
}

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
    } else if (session.metadata?.type === "class_pack") {
      const purchaseId = session.metadata.purchaseId ?? session.client_reference_id;

      if (purchaseId) {
        await fulfillPendingClassPackPurchase(
          purchaseId,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
          session.id,
        );
      }
    } else if (
      session.metadata?.type === "shop_voucher" ||
      session.metadata?.type === "shop_product"
    ) {
      try {
        await fulfillShopVoucherCheckout(session);
      } catch (error) {
        console.error("Failed to fulfill shop checkout:", error);
      }
    } else {
      const bookingId =
        session.metadata?.bookingId ?? session.client_reference_id ?? undefined;

      if (bookingId) {
        await expireStalePendingBookings();

        const booking = await db.booking.findUnique({ where: { id: bookingId } });

        if (booking?.status === BOOKING_STATUS.pending) {
          await confirmBooking(bookingId, {
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
            amountPaid: session.amount_total ?? undefined,
          });
        } else if (
          booking?.status === BOOKING_STATUS.cancelled &&
          booking.cancellationType === CANCELLATION_TYPE.paymentExpired
        ) {
          // Payment arrived after the hold expired — refund so the spot stays free.
          await refundCheckoutPayment(session);
        }
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId =
      session.metadata?.bookingId ?? session.client_reference_id ?? undefined;

    if (
      bookingId &&
      session.metadata?.type !== "class_pack" &&
      session.metadata?.type !== "membership" &&
      session.metadata?.type !== "shop_voucher" &&
      session.metadata?.type !== "shop_product"
    ) {
      await cancelPendingBookingForExpiredCheckout(bookingId);
    }
  }

  if (
    event.type === "customer.subscription.created" ||
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
