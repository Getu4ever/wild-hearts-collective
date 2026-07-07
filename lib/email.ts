import { Resend } from "resend";
import {
  formatSessionDateTime,
  getAppBaseUrl,
  getDepositAmountPence,
  getStudioEmail,
} from "@/lib/booking-config";
import {
  buildBrandedEmail,
  sessionDetailBlock,
} from "@/lib/email-template";
import { depositLabel } from "@/lib/stripe";

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
      subject: "Thanks for booking with Wild Hearts Collective",
      html: buildBrandedEmail({
        previewText: `Thanks for booking ${session.classTitle}. We will confirm your place shortly.`,
        heading: "Thanks for booking",
        bodyHtml: `
          <p>Hi ${customer.name},</p>
          <p>
            Thank you for booking with Wild Hearts Collective. We have received your
            request for the session below.
          </p>
          ${sessionDetailBlock(session.classTitle, session.startsAt)}
          <p>
            Once your ${depositLabel()} deposit payment has been processed, we will
            send you another email to confirm your booking.
          </p>
          <p>If you have any questions in the meantime, just reply to this email.</p>
        `,
        cta: {
          label: "View booking page",
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
            <strong>Deposit:</strong> ${depositLabel()}
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
) {
  const paidAmount =
    amountPaidPence != null
      ? new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
        }).format(amountPaidPence / 100)
      : depositLabel();

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
            <strong>Deposit paid:</strong> ${paidAmount}<br />
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
            <strong>Deposit paid:</strong> ${paidAmount}
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

export async function sendBookingCancelledEmail(
  customer: CustomerDetails,
  session: SessionDetails,
) {
  await sendEmail({
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
          Book now to secure your spot. A ${depositLabel()} deposit is required to
          confirm your booking.
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
        <p style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:#3B1F38;margin:24px 0;">
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

export function getDefaultDepositPence() {
  return getDepositAmountPence();
}
