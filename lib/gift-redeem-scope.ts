/**
 * Gift voucher redeem scopes.
 * `"any"` — studio gift cards (classes, packs).
 * `"beginner-courses"` — 4-week course vouchers only.
 */

export const GIFT_REDEEM_SCOPE = {
  any: "any",
  beginnerCourses: "beginner-courses",
} as const;

export type GiftRedeemScope =
  (typeof GIFT_REDEEM_SCOPE)[keyof typeof GIFT_REDEEM_SCOPE];

/** Class type slug used for fixed multi-week course bookings. */
export const COURSE_CLASS_SLUG = GIFT_REDEEM_SCOPE.beginnerCourses;

/** Shop product slugs that issue course-only gift codes (legacy fallback). */
export const COURSE_VOUCHER_PRODUCT_SLUGS = new Set(["intro-to-pole-4-week"]);

export function isCourseClassSlug(slug: string | null | undefined) {
  return slug === COURSE_CLASS_SLUG;
}

export function normalizeGiftRedeemScope(
  value: string | null | undefined,
): GiftRedeemScope {
  if (value === GIFT_REDEEM_SCOPE.beginnerCourses) {
    return GIFT_REDEEM_SCOPE.beginnerCourses;
  }
  return GIFT_REDEEM_SCOPE.any;
}

export function resolveGiftRedeemScopeForProduct(product: {
  slug: string;
  giftRedeemScope?: string | null;
}): GiftRedeemScope {
  if (product.giftRedeemScope === GIFT_REDEEM_SCOPE.beginnerCourses) {
    return GIFT_REDEEM_SCOPE.beginnerCourses;
  }
  if (product.giftRedeemScope === GIFT_REDEEM_SCOPE.any) {
    return GIFT_REDEEM_SCOPE.any;
  }
  if (COURSE_VOUCHER_PRODUCT_SLUGS.has(product.slug)) {
    return GIFT_REDEEM_SCOPE.beginnerCourses;
  }
  return GIFT_REDEEM_SCOPE.any;
}

export function giftRedeemScopeLabel(scope: string | null | undefined) {
  if (normalizeGiftRedeemScope(scope) === GIFT_REDEEM_SCOPE.beginnerCourses) {
    return "4-week courses only";
  }
  return "Any class or class pack";
}

/**
 * Throws a user-facing error when a scoped gift card cannot be used
 * for the current purchase.
 */
export function assertGiftCardRedeemableFor(
  giftCard: { redeemScope?: string | null; productName: string },
  context: { kind: "booking"; classSlug: string } | { kind: "class_pack" },
) {
  const scope = normalizeGiftRedeemScope(giftCard.redeemScope);

  if (scope === GIFT_REDEEM_SCOPE.any) return;

  if (context.kind === "class_pack") {
    throw new Error(
      `“${giftCard.productName}” can only be used for a 4-week course booking, not class packs.`,
    );
  }

  if (context.classSlug !== scope) {
    throw new Error(
      `“${giftCard.productName}” can only be redeemed on a 4-week course booking — not on weekly drop-in classes. Filter by “4-week courses” on the book page.`,
    );
  }
}
