import { Resend } from "resend";
import {
  formatMoneyFromPence,
  formatSessionDateTime,
  formatUkDateLong,
  getAppBaseUrl,
  getClassPaymentAmountPence,
  getStudioEmail,
} from "@/lib/booking-config";
import {
  buildBrandedEmail,
  sessionDetailBlock,
} from "@/lib/email-template";
import { monthlyMembershipLabel } from "@/lib/membership-config";
import { classPaymentLabel } from "@/lib/stripe";

type SessionDetails = {
  classTitle: string;
  startsAt: Date;
};

type CustomerDetails = {
  name: string;
  email: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function getFromAddress() {
  return (
    process.env.EMAIL_FROM ??
    "Wild Hearts Collective <onboarding@resend.dev>"
  );
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email:dev]", subject, to);
    }
    return { ok: false as const, skipped: true as const };
  }

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("[email:send]", subject, to, error);
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendBookingReceivedEmails(
  customer: CustomerDetails,
  session: SessionDetails,
) {
  const bookUrl = `${getAppBaseUrl()}/book`;

  await Promise.all([
    sendEmail({
      to: customer.email,
      subject: "Complete your Wild Hearts booking payment",
      html: buildBrandedEmail({
        previewText: `Please complete payment for ${session.classTitle}. The lesson will be cancelled without notice if unpaid.`,
        heading: "Complete your payment",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>
            Thank you for booking with Wild Hearts Collective. We have received your
            request for the session below.
          </p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>
            Your place is held for <strong>10 minutes</strong> while you complete
            your ${classPaymentLabel()} payment. Once payment is processed, we will
            send you another email to confirm your booking.
          </p>
          <p>
            <strong>The lesson will be cancelled without notice</strong> if payment
            is not completed in time.
          </p>
          <p>If you have any questions, just reply to this email.</p>
        `,
        cta: {
          label: "Return to booking",
          href: bookUrl,
        },
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `New booking received — ${customer.name}`,
      html: buildBrandedEmail({
        previewText: `New booking received from ${customer.name}.`,
        heading: "New booking received",
        bodyHtml: `
          <p>A new booking has been submitted and is awaiting payment confirmation.</p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>
            <strong>Name:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}<br />
            <strong>Amount due:</strong> ${classPaymentLabel()}
          </p>
        `,
      }),
    }),
  ]);
}

export async function sendBookingConfirmedEmails(
  customer: CustomerDetails,
  session: SessionDetails,
  amountPaidPence?: number | null,
  paymentSummary?: string | null,
) {
  const paidAmount =
    paymentSummary?.trim() ||
    (amountPaidPence != null
      ? new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
        }).format(amountPaidPence / 100)
      : classPaymentLabel());

  await Promise.all([
    sendEmail({
      to: customer.email,
      subject: "Your Wild Hearts class booking is confirmed",
      html: buildBrandedEmail({
        previewText: `Your booking for ${session.classTitle} is confirmed.`,
        heading: "Booking confirmed",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>
            Great news — your booking is now confirmed. We are looking forward to
            seeing you in the studio.
          </p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>
            <strong>Payment:</strong> ${paidAmount}<br />
            <strong>Status:</strong> Confirmed
          </p>
          <p>
            Please arrive 5–10 minutes before your class starts. If you need to
            make any changes, contact us using the details below.
          </p>
        `,
        cta: {
          label: "Visit our website",
          href: getAppBaseUrl(),
        },
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `Booking confirmed — ${customer.name}`,
      html: buildBrandedEmail({
        previewText: `Booking confirmed for ${customer.name}.`,
        heading: "Booking confirmed",
        bodyHtml: `
          <p>A booking has been confirmed in the system.</p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>
            <strong>Name:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}<br />
            <strong>Payment:</strong> ${paidAmount}
          </p>
        `,
      }),
    }),
  ]);
}

/** @deprecated Use sendBookingReceivedEmails */
export async function sendBookingPendingEmails(
  customer: CustomerDetails,
  session: SessionDetails,
) {
  return sendBookingReceivedEmails(customer, session);
}

export async function sendBookingCancelledEmails(
  customer: CustomerDetails,
  session: SessionDetails,
  meta?: {
    cancelledBy?: "member" | "admin" | "system";
    cancellationType?: string | null;
    creditRefunded?: boolean;
  },
) {
  const cancelledBy = meta?.cancelledBy ?? "member";
  const cancelledByLabel =
    cancelledBy === "admin"
      ? "Studio admin"
      : cancelledBy === "system"
        ? "System"
        : "Member";
  const cancellationLabel =
    meta?.cancellationType === "late_cancelled"
      ? "Late cancellation (within 24 hours)"
      : meta?.cancellationType === "on_time"
        ? "On-time cancellation"
        : meta?.cancellationType === "payment_expired"
          ? "Unpaid booking expired"
          : "Cancellation";
  const creditLabel =
    meta?.creditRefunded === true
      ? "Yes — class credit returned"
      : meta?.creditRefunded === false
        ? "No"
        : "—";

  await Promise.all([
    sendEmail({
      to: customer.email,
      subject: "Your Wild Hearts class booking was cancelled",
      html: buildBrandedEmail({
        previewText: `Your booking for ${session.classTitle} has been cancelled.`,
        heading: "Booking cancelled",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>Your booking for the session below has been cancelled.</p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>If this was unexpected, please contact us and we will be happy to help.</p>
        `,
        cta: {
          label: "Book another class",
          href: `${getAppBaseUrl()}/book`,
        },
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `Booking cancelled — ${customer.name}`,
      html: buildBrandedEmail({
        previewText: `${customer.name} cancelled ${session.classTitle}.`,
        heading: "Booking cancelled",
        bodyHtml: `
          <p>A class booking has been cancelled.</p>
          <p>
            <strong>Member:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}<br />
            <strong>Cancelled by:</strong> ${cancelledByLabel}<br />
            <strong>Type:</strong> ${cancellationLabel}<br />
            <strong>Credit refunded:</strong> ${creditLabel}
          </p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
        `,
        cta: {
          label: "Open admin dashboard",
          href: `${getAppBaseUrl()}/admin`,
        },
      }),
    }),
  ]);
}

/** @deprecated Use sendBookingCancelledEmails */
export async function sendBookingCancelledEmail(
  customer: CustomerDetails,
  session: SessionDetails,
  meta?: {
    cancelledBy?: "member" | "admin" | "system";
    cancellationType?: string | null;
    creditRefunded?: boolean;
  },
) {
  return sendBookingCancelledEmails(customer, session, meta);
}

/** Studio-only: unpaid checkout timed out (member abandoned payment). */
export async function sendUnpaidBookingExpiredAdminEmail(
  customer: CustomerDetails,
  session: SessionDetails,
) {
  await sendEmail({
    to: getStudioEmail(),
    subject: `Unpaid booking released — ${customer.name}`,
    html: buildBrandedEmail({
      previewText: `${customer.name} did not complete payment for ${session.classTitle}.`,
      heading: "Unpaid booking released",
      bodyHtml: `
        <p>A pending booking was cancelled automatically after payment was not completed within 10 minutes. The class spot has been released.</p>
        <p>
          <strong>Member:</strong> ${customer.name}<br />
          <strong>Email:</strong> ${customer.email}<br />
          <strong>Reason:</strong> Payment not completed (auto-cancelled)
        </p>
        ${sessionDetailBlock(session.classTitle, session.startsAt)}
      `,
      cta: {
        label: "Open admin dashboard",
        href: `${getAppBaseUrl()}/admin`,
      },
    }),
  });
}

export async function sendSessionCancelledEmail(
  customer: CustomerDetails,
  session: SessionDetails & { reason?: string },
) {
  await sendEmail({
    to: customer.email,
    subject: "Your Wild Hearts class has been cancelled",
    html: buildBrandedEmail({
      previewText: `${session.classTitle} on ${formatSessionDateTime(session.startsAt)} has been cancelled.`,
      heading: "Class cancelled",
      bodyHtml: `
        <p>Hi ${customer.name},</p>
        <p>
          We are sorry to let you know that the following class has been cancelled
          by the studio.
        </p>
        ${sessionDetailBlock(session.classTitle, session.startsAt)}
        <p>${session.reason ?? "Any class credits used for this booking have been returned to your account."}</p>
        <p>Please contact us if you would like help rebooking into another session.</p>
      `,
      cta: {
        label: "View available classes",
        href: `${getAppBaseUrl()}/book`,
      },
    }),
  });
}

export async function sendWaitlistJoinedEmails(
  customer: CustomerDetails,
  session: SessionDetails,
) {
  await Promise.all([
    sendEmail({
      to: customer.email,
      subject: "You are on the Wild Hearts waitlist",
      html: buildBrandedEmail({
        previewText: `You are on the waitlist for ${session.classTitle}.`,
        heading: "You are on the waitlist",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>The session below is currently full, but you have been added to our waitlist.</p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>We will email you as soon as a place becomes available.</p>
        `,
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `Waitlist signup — ${customer.name}`,
      html: buildBrandedEmail({
        previewText: `Waitlist signup from ${customer.name}.`,
        heading: "New waitlist signup",
        bodyHtml: `
          <p>Someone joined the waitlist.</p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>
            <strong>Name:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}
          </p>
        `,
      }),
    }),
  ]);
}

export async function sendWaitlistSpotAvailableEmail(
  customer: CustomerDetails,
  session: SessionDetails,
  bookUrl: string,
) {
  await sendEmail({
    to: customer.email,
    subject: "A place is available — book your Wild Hearts class",
    html: buildBrandedEmail({
      previewText: `A place is now available for ${session.classTitle}.`,
      heading: "A place is available",
      bodyHtml: `
        <p>Hi ${customer.name},</p>
        <p>Good news — a place has opened up for the session below.</p>
        ${sessionDetailBlock(session.classTitle, session.startsAt)}
        <p>
          Book now to secure your spot. The full class fee of ${classPaymentLabel()} is
          required to confirm your booking.
        </p>
      `,
      cta: {
        label: "Book your class",
        href: bookUrl,
      },
    }),
  });
}

export async function sendVerificationCodeEmail(
  email: string,
  name: string,
  code: string,
  purpose: "signup" | "password_reset",
) {
  const heading =
    purpose === "password_reset" ? "Reset your password" : "Verify your account";
  const previewText =
    purpose === "password_reset"
      ? "Use this code to reset your Wild Hearts Collective password."
      : "Use this code to verify your Wild Hearts Collective account.";

  await sendEmail({
    to: email,
    subject:
      purpose === "password_reset"
        ? "Your Wild Hearts password reset code"
        : "Your Wild Hearts verification code",
    html: buildBrandedEmail({
      previewText,
      heading,
      bodyHtml: `
        <p>Hi ${name},</p>
        <p>
          ${
            purpose === "password_reset"
              ? "Use the verification code below to reset your password."
              : "Use the verification code below to verify your Wild Hearts Collective account."
          }
        </p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:#5A4D42;margin:24px 0;">
          ${code}
        </p>
        <p>This code expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>
      `,
    }),
  });
}

type NewMemberDetails = {
  name: string;
  email: string;
  phone?: string | null;
  signupMethod: "email" | "google";
  emailVerified: boolean;
};

export async function sendNewMemberRegisteredEmail(member: NewMemberDetails) {
  const adminUrl = `${getAppBaseUrl()}/admin/members`;
  const methodLabel = member.signupMethod === "google" ? "Google" : "Email & password";
  const verifiedLabel = member.emailVerified ? "Verified" : "Pending verification";

  await sendEmail({
    to: getStudioEmail(),
    subject: `New member registered — ${member.name}`,
    html: buildBrandedEmail({
      previewText: `${member.name} just joined Wild Hearts Collective.`,
      heading: "New member registered",
      bodyHtml: `
        <p>A new studio member account has been created.</p>
        <p>
          <strong>Name:</strong> ${member.name}<br />
          <strong>Email:</strong> ${member.email}<br />
          <strong>Phone:</strong> ${member.phone?.trim() || "—"}<br />
          <strong>Sign-up method:</strong> ${methodLabel}<br />
          <strong>Email status:</strong> ${verifiedLabel}
        </p>
        <p>View all members in the admin dashboard to track sign-ups and verification status.</p>
      `,
      cta: {
        label: "View members",
        href: adminUrl,
      },
    }),
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getDefaultClassPaymentPence() {
  return getClassPaymentAmountPence();
}

/** @deprecated Use getDefaultClassPaymentPence */
export function getDefaultDepositPence() {
  return getClassPaymentAmountPence();
}

type VoucherEmailDetails = {
  code: string;
  type: string;
  discountPercent: number;
  expiresAt: Date;
  bookUrl: string;
  milestone?: number;
};

export async function sendVoucherEmail(
  customer: CustomerDetails,
  voucher: VoucherEmailDetails,
) {
  const title =
    voucher.type === "birthday"
      ? "Happy birthday from Wild Hearts!"
      : voucher.milestone
        ? `Congratulations on ${voucher.milestone} classes!`
        : "A special reward from Wild Hearts Collective";

  await sendEmail({
    to: customer.email,
    subject: title,
    html: buildBrandedEmail({
      previewText: `Your voucher code: ${voucher.code}`,
      heading: title,
      bodyHtml: `
        <p>Hi ${customer.name},</p>
        <p>
          Here is your voucher code:
          <strong style="font-size: 18px; letter-spacing: 0.08em;">${voucher.code}</strong>
        </p>
        <p>
          This voucher gives you ${voucher.discountPercent}% off your next class booking.
          It expires on ${voucher.expiresAt.toLocaleDateString("en-GB")}.
        </p>
      `,
      cta: {
        label: "Book a class",
        href: voucher.bookUrl,
      },
    }),
  });
}

export async function sendEngagementEmail(
  customer: CustomerDetails,
  payload: { type: string; message: string; voucherCode?: string },
) {
  const subject =
    payload.type === "no_show"
      ? "We missed you in class"
      : "We have missed you at Wild Hearts";

  await sendEmail({
    to: customer.email,
    subject,
    html: buildBrandedEmail({
      previewText: payload.message,
      heading: subject,
      bodyHtml: `
        <p>Hi ${customer.name},</p>
        <p>${payload.message}</p>
        ${
          payload.voucherCode
            ? `<p>Your comeback code: <strong>${payload.voucherCode}</strong></p>`
            : ""
        }
      `,
      cta: {
        label: "Book a class",
        href: `${getAppBaseUrl()}/book`,
      },
    }),
  });
}

type ClassPackPurchaseDetails = {
  packName: string;
  credits: number;
  pricePence: number;
  expiresAt: Date;
  balanceAfter: number;
};

export async function sendClassPackPurchaseEmails(
  customer: CustomerDetails,
  pack: ClassPackPurchaseDetails,
) {
  const priceLabel = formatMoneyFromPence(pack.pricePence);
  const expiresLabel = formatUkDateLong(pack.expiresAt);
  const creditsUrl = `${getAppBaseUrl()}/account/credits`;

  await Promise.all([
    sendEmail({
      to: customer.email,
      subject: `Your ${pack.packName} is ready`,
      html: buildBrandedEmail({
        previewText: `Your ${pack.packName} purchase is confirmed — ${pack.credits} credits added.`,
        heading: "Class pack confirmed",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>
            Thank you for your purchase. Your class pack is now active and ready to use
            when you book.
          </p>
          <p>
            <strong>Pack:</strong> ${pack.packName}<br />
            <strong>Credits added:</strong> ${pack.credits}<br />
            <strong>Amount paid:</strong> ${priceLabel}<br />
            <strong>Credits expire:</strong> ${expiresLabel}<br />
            <strong>Current balance:</strong> ${pack.balanceAfter} credit${pack.balanceAfter === 1 ? "" : "s"}
          </p>
          <p>
            Log in to your account to view your balance and book your next class.
          </p>
        `,
        cta: {
          label: "View my credits",
          href: creditsUrl,
        },
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `Class pack purchased — ${customer.name}`,
      html: buildBrandedEmail({
        previewText: `${customer.name} purchased ${pack.packName}.`,
        heading: "Class pack purchased",
        bodyHtml: `
          <p>A class pack purchase has been completed.</p>
          <p>
            <strong>Name:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}<br />
            <strong>Pack:</strong> ${pack.packName}<br />
            <strong>Credits:</strong> ${pack.credits}<br />
            <strong>Amount paid:</strong> ${priceLabel}<br />
            <strong>Expires:</strong> ${expiresLabel}
          </p>
        `,
      }),
    }),
  ]);
}

type MembershipWelcomeDetails = {
  renewsAt: Date | null;
};

export async function sendMembershipWelcomeEmails(
  customer: CustomerDetails,
  membership: MembershipWelcomeDetails,
) {
  const priceLabel = monthlyMembershipLabel();
  const renewsLabel = membership.renewsAt
    ? formatUkDateLong(membership.renewsAt)
    : null;
  const accountUrl = `${getAppBaseUrl()}/account`;

  await Promise.all([
    sendEmail({
      to: customer.email,
      subject: "Welcome to your Wild Hearts monthly membership",
      html: buildBrandedEmail({
        previewText: "Your monthly membership is now active.",
        heading: "Membership confirmed",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>
            Welcome — your Monthly Membership is now active. You can book selected
            drop-in classes and enjoy member perks through your account.
          </p>
          <p>
            <strong>Plan:</strong> Monthly Membership<br />
            <strong>Price:</strong> ${priceLabel} per month<br />
            ${renewsLabel ? `<strong>Next renewal:</strong> ${renewsLabel}<br />` : ""}
            <strong>Status:</strong> Active
          </p>
          <p>
            Manage your membership, bookings, and profile anytime from your account.
          </p>
        `,
        cta: {
          label: "Go to my account",
          href: accountUrl,
        },
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `New monthly membership — ${customer.name}`,
      html: buildBrandedEmail({
        previewText: `${customer.name} subscribed to Monthly Membership.`,
        heading: "New monthly membership",
        bodyHtml: `
          <p>A member has subscribed to Monthly Membership.</p>
          <p>
            <strong>Name:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}<br />
            <strong>Plan:</strong> Monthly Membership (${priceLabel}/month)<br />
            ${renewsLabel ? `<strong>Next renewal:</strong> ${renewsLabel}` : ""}
          </p>
        `,
      }),
    }),
  ]);
}

type MembershipChangeDetails = {
  cancelledBy?: "member" | "admin" | "system";
  reason?: string | null;
  immediate?: boolean;
  finalAccessDate?: Date | null;
  pauseStart?: Date | null;
  resumeAt?: Date | null;
};

export async function sendMembershipCancelledAdminEmail(
  customer: CustomerDetails,
  details: MembershipChangeDetails = {},
) {
  const cancelledBy =
    details.cancelledBy === "admin"
      ? "Studio admin"
      : details.cancelledBy === "system"
        ? "System / Stripe"
        : "Member";
  const accessLabel = details.finalAccessDate
    ? formatUkDateLong(details.finalAccessDate)
    : "—";

  await sendEmail({
    to: getStudioEmail(),
    subject: `Membership cancelled — ${customer.name}`,
    html: buildBrandedEmail({
      previewText: `${customer.name} cancelled their membership.`,
      heading: "Membership cancelled",
      bodyHtml: `
        <p>A monthly membership has been cancelled.</p>
        <p>
          <strong>Member:</strong> ${customer.name}<br />
          <strong>Email:</strong> ${customer.email}<br />
          <strong>Cancelled by:</strong> ${cancelledBy}<br />
          <strong>Immediate:</strong> ${details.immediate ? "Yes" : "No — ends at period end"}<br />
          <strong>Final access:</strong> ${accessLabel}<br />
          <strong>Reason:</strong> ${details.reason?.trim() || "—"}
        </p>
      `,
      cta: {
        label: "View members",
        href: `${getAppBaseUrl()}/admin/members`,
      },
    }),
  });
}

export async function sendMembershipPausedAdminEmail(
  customer: CustomerDetails,
  details: MembershipChangeDetails = {},
) {
  const pausedBy = details.cancelledBy === "admin" ? "Studio admin" : "Member";
  const pauseLabel = details.pauseStart
    ? formatUkDateLong(details.pauseStart)
    : "—";
  const resumeLabel = details.resumeAt
    ? formatUkDateLong(details.resumeAt)
    : "Open-ended";

  await sendEmail({
    to: getStudioEmail(),
    subject: `Membership paused — ${customer.name}`,
    html: buildBrandedEmail({
      previewText: `${customer.name} paused their membership.`,
      heading: "Membership paused",
      bodyHtml: `
        <p>A monthly membership has been paused.</p>
        <p>
          <strong>Member:</strong> ${customer.name}<br />
          <strong>Email:</strong> ${customer.email}<br />
          <strong>Paused by:</strong> ${pausedBy}<br />
          <strong>Pause start:</strong> ${pauseLabel}<br />
          <strong>Resume date:</strong> ${resumeLabel}
        </p>
      `,
      cta: {
        label: "View members",
        href: `${getAppBaseUrl()}/admin/members`,
      },
    }),
  });
}

type ShopGiftOrderLine = {
  productName: string;
  giftCode: string;
  priceLabel: string;
  quantity: number;
  balanceLabel?: string;
  /** Public path under the site, e.g. /shop/art-kit-class-bundle.svg */
  image?: string;
};

type ShopGiftVoucherDetails = {
  lines: ShopGiftOrderLine[];
  totalLabel: string;
  shopUrl: string;
  bookUrl: string;
  creditsUrl?: string;
};

/** Digital delivery email for shop gift vouchers / e-gift cards. */
export async function sendShopGiftVoucherEmail(
  customer: CustomerDetails,
  voucher: ShopGiftVoucherDetails,
) {
  const baseUrl = getAppBaseUrl();
  const itemRows = voucher.lines
    .map((line) => {
      const imagePath = line.image?.startsWith("/")
        ? line.image
        : line.image
          ? `/${line.image}`
          : null;
      const imageUrl = imagePath ? `${baseUrl}${imagePath}` : null;
      const imageCell = imageUrl
        ? `<td style="width:72px;padding:0 14px 0 0;vertical-align:top;">
            <img
              src="${imageUrl}"
              alt=""
              width="72"
              height="72"
              style="display:block;width:72px;height:72px;object-fit:cover;border-radius:6px;border:1px solid #e8dfd4;background:#F6F2EC;"
            />
          </td>`
        : "";

      const balanceLine = line.balanceLabel
        ? `<p style="margin:4px 0 0;">Balance on code: <strong>${line.balanceLabel}</strong></p>`
        : "";

      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 16px;">
          <tr>
            ${imageCell}
            <td style="vertical-align:top;padding:0;">
              <p style="margin:0 0 4px;">
                <strong>${line.productName}</strong>
              </p>
              <p style="margin:0 0 4px;">Value ${line.priceLabel}</p>
              <p style="margin:0;">
                Gift code:
                <span style="font-size:16px;letter-spacing:0.08em;font-weight:700;">
                  ${line.giftCode}
                </span>
              </p>
              ${balanceLine}
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const summary = voucher.lines
    .map((line) => line.productName)
    .join(", ");

  const creditsUrl = voucher.creditsUrl ?? `${baseUrl}/account/credits`;

  await Promise.all([
    sendEmail({
      to: customer.email,
      subject:
        voucher.lines.length === 1
          ? `Your ${voucher.lines[0].productName} is ready`
          : "Your Wild Hearts gift vouchers are ready",
      html: buildBrandedEmail({
        previewText: `Digital gift delivery — ${summary}`,
        heading: "Digital gift delivered",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>
            Thank you for your purchase from the Wild Hearts Collective shop.
            Your digital gift card${voucher.lines.length === 1 ? " has" : "s have"} been
            delivered by email — no shipping required.
          </p>
          ${itemRows}
          <p><strong>Order total:</strong> ${voucher.totalLabel}</p>
          <p>
            Use these codes when booking a class or buying a class pack.
            If you spend less than the full balance (for example a £25 card on a £10 class),
            the remaining balance stays on the same code for next time.
          </p>
          <p>
            Present these codes to the recipient if you are gifting them to someone else.
          </p>
        `,
        cta: {
          label: "Book a class",
          href: voucher.bookUrl,
        },
      }),
    }),
    sendEmail({
      to: getStudioEmail(),
      subject: `Shop voucher order — ${summary}`.slice(0, 120),
      html: buildBrandedEmail({
        previewText: `${customer.name} purchased ${summary}`,
        heading: "Shop voucher purchase",
        bodyHtml: `
          <p>A digital shop order was purchased and emailed to the buyer.</p>
          <p>
            <strong>Buyer:</strong> ${customer.name}<br />
            <strong>Email:</strong> ${customer.email}<br />
            <strong>Total:</strong> ${voucher.totalLabel}
          </p>
          ${itemRows}
          <p>
            Codes are stored in the system with remaining balances.
            Class packs checkout: ${creditsUrl}
          </p>
        `,
        cta: {
          label: "View shop",
          href: voucher.shopUrl,
        },
      }),
    }),
  ]);
}
