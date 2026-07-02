import { normalizePhone } from "@/lib/verification";

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export async function sendVerificationSms(phone: string, code: string, context: string) {
  if (!isSmsConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[sms:dev]", context, normalizePhone(phone), code);
    }
    return { ok: false as const, skipped: true as const };
  }

  const auth = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
  ).toString("base64");

  const body = new URLSearchParams({
    To: normalizePhone(phone),
    From: process.env.TWILIO_PHONE_NUMBER!,
    Body: `Your Wild Hearts Collective verification code is ${code}. It expires in 15 minutes.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error("Unable to send SMS verification code.");
  }

  return { ok: true as const, skipped: false as const };
}
