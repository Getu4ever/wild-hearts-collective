export const BOOKING_STATUS = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const WAITLIST_STATUS = {
  waiting: "waiting",
  notified: "notified",
  cancelled: "cancelled",
} as const;

export type WaitlistStatus = (typeof WAITLIST_STATUS)[keyof typeof WAITLIST_STATUS];

/** Full class price charged in advance (pence) — env fallback only. Prefer resolveClassPaymentAmountPence(). */
export function getEnvClassPaymentAmountPence() {
  const raw =
    process.env.STRIPE_CLASS_AMOUNT ?? process.env.STRIPE_DEPOSIT_AMOUNT;
  const parsed = raw ? Number.parseInt(raw, 10) : 1000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

/** @deprecated Prefer resolveClassPaymentAmountPence from studio-pricing-service. */
export function getClassPaymentAmountPence() {
  return getEnvClassPaymentAmountPence();
}

/** @deprecated Use getClassPaymentAmountPence — classes are paid in full in advance. */
export function getDepositAmountPence() {
  return getEnvClassPaymentAmountPence();
}

export function formatMoneyFromPence(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function getAppBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return `https://${vercelProduction.replace(/\/$/, "")}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export const UK_TIMEZONE = "Europe/London";

export function getStudioEmail() {
  return process.env.STUDIO_EMAIL ?? "info@karoldigital.co.uk";
}

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function ukLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 3; i += 1) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: UK_TIMEZONE,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      })
        .formatToParts(new Date(utcMs))
        .map((part) => [part.type, part.value]),
    ) as Record<string, string>;

    const shown = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
    utcMs += desired - shown;
  }

  return new Date(utcMs);
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function formatSessionDateTime(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatUkDateTimeShort(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatUkDateShort(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatUkDateLong(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatSessionDateParts(startsAt: string | Date) {
  const date = toDate(startsAt);

  return {
    weekday: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      timeZone: UK_TIMEZONE,
    }).format(date),
    shortDate: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: UK_TIMEZONE,
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: UK_TIMEZONE,
    }).format(date),
  };
}
