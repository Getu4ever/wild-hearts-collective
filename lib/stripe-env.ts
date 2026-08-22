/** Stripe keys copied into Vercel sometimes include trailing newlines — always trim. */
export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

export function isStripeSecretConfigured() {
  return Boolean(getStripeSecretKey());
}

export function isStripePublishableConfigured() {
  return Boolean(getStripePublishableKey());
}
