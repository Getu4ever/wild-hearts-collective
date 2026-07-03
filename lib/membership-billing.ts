import type Stripe from "stripe";
import { formatMoneyFromPence, isStripeConfigured } from "@/lib/booking-config";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS, getMonthlyMembershipPricePence } from "@/lib/membership-config";
import {
  getOrCreateStripeCustomer,
  getSubscriptionPeriodEnd,
  syncMembershipFromStripeSubscription,
} from "@/lib/membership-stripe";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

export type BillingPaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export type BillingInvoice = {
  id: string;
  number: string | null;
  amount: string;
  status: string;
  created: string;
  pdfUrl: string | null;
};

export type MemberBillingSummary = {
  configured: boolean;
  publishableKey: string;
  paymentMethods: BillingPaymentMethod[];
  invoices: BillingInvoice[];
  canSubscribe: boolean;
  hasActiveMembership: boolean;
  membershipPriceLabel: string;
};

function getPublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}

function getInvoiceClientSecret(invoice: Stripe.Invoice) {
  const confirmationSecret = invoice.confirmation_secret;
  if (
    confirmationSecret &&
    typeof confirmationSecret === "object" &&
    "client_secret" in confirmationSecret &&
    confirmationSecret.client_secret
  ) {
    return confirmationSecret.client_secret;
  }

  const paymentIntent = (invoice as Stripe.Invoice & {
    payment_intent?: Stripe.PaymentIntent | string | null;
  }).payment_intent;

  if (paymentIntent && typeof paymentIntent === "object" && paymentIntent.client_secret) {
    return paymentIntent.client_secret;
  }

  return null;
}

export async function getOrCreateMembershipPriceId() {
  const stripe = getStripeClient();
  const amount = getMonthlyMembershipPricePence();

  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find((item) => item.metadata.whc_plan === MEMBERSHIP_PLAN.monthly);

  if (!product) {
    product = await stripe.products.create({
      name: "Wild Hearts Collective — Monthly Membership",
      description: "Unlimited selected drop-in classes and member perks.",
      metadata: { whc_plan: MEMBERSHIP_PLAN.monthly },
    });
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const existingPrice = prices.data.find(
    (price) =>
      price.unit_amount === amount &&
      price.currency === "gbp" &&
      price.recurring?.interval === "month",
  );

  if (existingPrice) return existingPrice.id;

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: "gbp",
    recurring: { interval: "month" },
  });

  return price.id;
}

export async function getMemberBillingSummary(userId: string): Promise<MemberBillingSummary> {
  const publishableKey = getPublishableKey();
  const configured = isStripeConfigured() && Boolean(publishableKey);
  const membershipPriceLabel = formatMoneyFromPence(getMonthlyMembershipPricePence());

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      membershipPlan: true,
      membershipStatus: true,
    },
  });

  if (!user || !configured || !user.stripeCustomerId) {
    return {
      configured,
      publishableKey,
      paymentMethods: [],
      invoices: [],
      canSubscribe:
        Boolean(user) &&
        configured &&
        !(
          user?.membershipPlan === MEMBERSHIP_PLAN.monthly &&
          user?.membershipStatus === MEMBERSHIP_STATUS.active
        ),
      hasActiveMembership:
        user?.membershipPlan === MEMBERSHIP_PLAN.monthly &&
        user?.membershipStatus === MEMBERSHIP_STATUS.active,
      membershipPriceLabel,
    };
  }

  const stripe = getStripeClient();
  const [paymentMethods, invoices, customer] = await Promise.all([
    stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" }),
    stripe.invoices.list({ customer: user.stripeCustomerId, limit: 12 }),
    stripe.customers.retrieve(user.stripeCustomerId),
  ]);

  const defaultPaymentMethodId =
    typeof customer !== "string" && !customer.deleted
      ? ((customer.invoice_settings?.default_payment_method as string | null) ??
        (typeof customer.default_source === "string" ? customer.default_source : null))
      : null;

  return {
    configured,
    publishableKey,
    paymentMethods: paymentMethods.data.map((method) => ({
      id: method.id,
      brand: method.card?.brand ?? "card",
      last4: method.card?.last4 ?? "••••",
      expMonth: method.card?.exp_month ?? 0,
      expYear: method.card?.exp_year ?? 0,
      isDefault: method.id === defaultPaymentMethodId,
    })),
    invoices: invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amount: formatMoneyFromPence(invoice.amount_paid || invoice.amount_due || 0),
      status: invoice.status ?? "draft",
      created: new Date(invoice.created * 1000).toISOString(),
      pdfUrl: invoice.invoice_pdf ?? null,
    })),
    canSubscribe: !(
      user.membershipPlan === MEMBERSHIP_PLAN.monthly &&
      user.membershipStatus === MEMBERSHIP_STATUS.active
    ),
    hasActiveMembership:
      user.membershipPlan === MEMBERSHIP_PLAN.monthly &&
      user.membershipStatus === MEMBERSHIP_STATUS.active,
    membershipPriceLabel,
  };
}

export async function createMemberSetupIntent(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) throw new Error("Account not found.");

  const customerId = await getOrCreateStripeCustomer(user);
  const stripe = getStripeClient();

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    usage: "off_session",
  });

  if (!setupIntent.client_secret) {
    throw new Error("Unable to start payment method setup.");
  }

  return { clientSecret: setupIntent.client_secret };
}

export async function createMemberSubscriptionIntent(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      membershipPlan: true,
      membershipStatus: true,
    },
  });

  if (!user) throw new Error("Account not found.");

  if (
    user.membershipPlan === MEMBERSHIP_PLAN.monthly &&
    user.membershipStatus === MEMBERSHIP_STATUS.active
  ) {
    throw new Error("You already have an active monthly membership.");
  }

  const customerId = await getOrCreateStripeCustomer(user);
  const stripe = getStripeClient();
  const priceId = await getOrCreateMembershipPriceId();

  if (user.stripeSubscriptionId) {
    const existing = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
      expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"],
    });

    if (
      existing.status === "incomplete" ||
      existing.status === "past_due" ||
      existing.status === "unpaid"
    ) {
      const clientSecret = getInvoiceClientSecret(existing.latest_invoice as Stripe.Invoice);
      if (clientSecret) {
        return { clientSecret, subscriptionId: existing.id };
      }
    }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"],
    metadata: {
      userId: user.id,
      plan: MEMBERSHIP_PLAN.monthly,
      type: "membership",
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { stripeSubscriptionId: subscription.id },
  });

  const clientSecret = getInvoiceClientSecret(subscription.latest_invoice as Stripe.Invoice);
  if (!clientSecret) {
    throw new Error("Unable to start membership payment.");
  }

  return { clientSecret, subscriptionId: subscription.id };
}

export async function syncMemberSubscription(userId: string, subscriptionId: string) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"],
  });

  if (subscription.metadata.userId && subscription.metadata.userId !== userId) {
    throw new Error("Subscription does not belong to this account.");
  }

  await syncMembershipFromStripeSubscription(userId, subscription);

  return {
    status: subscription.status,
    renewsAt: getSubscriptionPeriodEnd(subscription),
  };
}

export async function removeMemberPaymentMethod(userId: string, paymentMethodId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("No billing profile found.");
  }

  const stripe = getStripeClient();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (paymentMethod.customer !== user.stripeCustomerId) {
    throw new Error("Payment method not found.");
  }

  await stripe.paymentMethods.detach(paymentMethodId);
}

export async function setMemberDefaultPaymentMethod(userId: string, paymentMethodId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("No billing profile found.");
  }

  const stripe = getStripeClient();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (paymentMethod.customer !== user.stripeCustomerId) {
    throw new Error("Payment method not found.");
  }

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}
