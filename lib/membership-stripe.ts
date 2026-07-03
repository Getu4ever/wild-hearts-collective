import type Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/booking-config";
import {
  getMonthlyMembershipPricePence,
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
} from "@/lib/membership-config";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  return item?.current_period_end ?? null;
}

export async function getOrCreateStripeCustomer(user: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await db.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createMembershipCheckoutSession(user: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}) {
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomer(user);
  const baseUrl = getAppBaseUrl();
  const amount = getMonthlyMembershipPricePence();

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    metadata: {
      type: "membership",
      userId: user.id,
      plan: MEMBERSHIP_PLAN.monthly,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: amount,
          recurring: { interval: "month" },
          product_data: {
            name: "Wild Hearts Collective — Monthly Membership",
            description: "Unlimited selected drop-in classes and member perks.",
          },
        },
      },
    ],
    success_url: `${baseUrl}/account?membership=success`,
    cancel_url: `${baseUrl}/membership?cancelled=1`,
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: MEMBERSHIP_PLAN.monthly,
      },
    },
  });
}

export async function activateMembershipFromSubscription(
  userId: string,
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd?: number | null;
  },
) {
  const active = subscription.status === "active" || subscription.status === "trialing";

  await db.user.update({
    where: { id: userId },
    data: {
      membershipPlan: MEMBERSHIP_PLAN.monthly,
      membershipStatus: active ? MEMBERSHIP_STATUS.active : MEMBERSHIP_STATUS.inactive,
      stripeSubscriptionId: subscription.id,
      membershipRenewsAt: subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd * 1000)
        : null,
      membershipStartedAt: active
        ? (
            await db.user.findUnique({
              where: { id: userId },
              select: { membershipStartedAt: true },
            })
          )?.membershipStartedAt ?? new Date()
        : undefined,
    },
  });
}

export async function cancelMembershipFromSubscription(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      membershipPlan: MEMBERSHIP_PLAN.account,
      membershipStatus: MEMBERSHIP_STATUS.cancelled,
      stripeSubscriptionId: null,
      membershipRenewsAt: null,
    },
  });
}

export async function syncMembershipFromStripeSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    await cancelMembershipFromSubscription(userId);
    return;
  }

  await activateMembershipFromSubscription(userId, {
    id: subscription.id,
    status: subscription.status,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
  });
}
