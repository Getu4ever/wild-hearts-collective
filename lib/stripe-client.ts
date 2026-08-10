import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Load Stripe.js with the sandbox testing assistant disabled.
 * Stripe otherwise injects a "Stripe Developers" badge in the bottom-right
 * whenever Elements run with test/sandbox keys.
 */
export function loadStripeClient(
  publishableKey: string,
): Promise<Stripe | null> {
  return loadStripe(publishableKey, {
    developerTools: {
      assistant: {
        enabled: false,
      },
    },
  });
}
