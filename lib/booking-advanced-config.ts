export const PARQ_REQUIRED_CLASS_SLUGS = ["pole", "aerial-hoop", "aerial-silks"] as const;

export type ParqRequiredClassSlug = (typeof PARQ_REQUIRED_CLASS_SLUGS)[number];

export const ATTENDANCE_STATUS = {
  attended: "attended",
  noShow: "no_show",
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const CANCELLATION_TYPE = {
  onTime: "on_time",
  lateCancelled: "late_cancelled",
  paymentExpired: "payment_expired",
} as const;

export type CancellationType = (typeof CANCELLATION_TYPE)[keyof typeof CANCELLATION_TYPE];

export const VOUCHER_TYPE = {
  birthday: "birthday",
  milestone50: "milestone_50",
  milestone100: "milestone_100",
  milestone150: "milestone_150",
  reengagement: "reengagement",
} as const;

export type VoucherType = (typeof VOUCHER_TYPE)[keyof typeof VOUCHER_TYPE];

export const ENGAGEMENT_TYPE = {
  noShow: "no_show",
  inactive30Days: "inactive_30_days",
} as const;

export type EngagementType = (typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE];

export const ENGAGEMENT_STATUS = {
  pending: "pending",
  sent: "sent",
  skipped: "skipped",
} as const;

export const CLASS_PACK_STATUS = {
  active: "active",
  exhausted: "exhausted",
  expired: "expired",
} as const;

export const CREDIT_REASON = {
  packPurchase: "pack_purchase",
  bookingDeduction: "booking_deduction",
  cancellationRefund: "cancellation_refund",
  adminAdjustment: "admin_adjustment",
} as const;

export const MILESTONE_THRESHOLDS = [50, 100, 150] as const;

export const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Unpaid Stripe checkouts hold a class spot for this long, then auto-cancel. */
export const PAYMENT_HOLD_MS = 10 * 60 * 1000;

export const INACTIVITY_DAYS = 30;

export const BIRTHDAY_VOUCHER_VALID_DAYS = 14;

export const REENGAGEMENT_VOUCHER_VALID_DAYS = 21;

export function requiresParQ(classSlug: string) {
  return PARQ_REQUIRED_CLASS_SLUGS.includes(classSlug as ParqRequiredClassSlug);
}

export function isWithinCancellationWindow(sessionStartsAt: Date, now = new Date()) {
  return sessionStartsAt.getTime() - now.getTime() >= CANCELLATION_WINDOW_MS;
}

export function parseMilestonesAwarded(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number");
}
