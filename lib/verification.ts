import { createHash, randomInt } from "crypto";
import { db } from "@/lib/db";
import {
  CODE_LENGTH,
  CODE_TTL_MS,
  type VerificationChannel,
  type VerificationPurpose,
  VERIFICATION_CHANNEL,
} from "@/lib/verification-config";

function hashVerificationCode(code: string) {
  const secret =
    process.env.MEMBER_SESSION_SECRET ??
    process.env.ADMIN_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "dev-verification-secret";
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

export function generateVerificationCode() {
  const max = 10 ** CODE_LENGTH;
  const value = randomInt(0, max);
  return value.toString().padStart(CODE_LENGTH, "0");
}

export async function createVerificationCode(options: {
  userId?: string;
  email?: string;
  phone?: string;
  purpose: VerificationPurpose;
  channel: VerificationChannel;
}) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await db.verificationCode.updateMany({
    where: {
      purpose: options.purpose,
      usedAt: null,
      OR: [
        options.userId ? { userId: options.userId } : undefined,
        options.email ? { email: options.email.toLowerCase() } : undefined,
      ].filter(Boolean) as { userId?: string; email?: string }[],
    },
    data: { usedAt: new Date() },
  });

  await db.verificationCode.create({
    data: {
      userId: options.userId,
      email: options.email?.toLowerCase(),
      phone: options.phone,
      codeHash: hashVerificationCode(code),
      purpose: options.purpose,
      channel: options.channel,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function verifyVerificationCode(options: {
  code: string;
  purpose: VerificationPurpose;
  userId?: string;
  email?: string;
}) {
  const normalizedEmail = options.email?.trim().toLowerCase();
  const codeHash = hashVerificationCode(options.code.trim());

  const record = await db.verificationCode.findFirst({
    where: {
      purpose: options.purpose,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
      OR: [
        options.userId ? { userId: options.userId } : undefined,
        normalizedEmail ? { email: normalizedEmail } : undefined,
      ].filter(Boolean) as { userId?: string; email?: string }[],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  await db.verificationCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
}

export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  if (digits.startsWith("44")) return `+${digits}`;
  return `+${digits}`;
}

export function isPhoneChannelAvailable() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export function getAvailableChannels(user: { email: string; phone?: string | null }) {
  const channels: VerificationChannel[] = [VERIFICATION_CHANNEL.email];
  if (user.phone && isPhoneChannelAvailable()) {
    channels.push(VERIFICATION_CHANNEL.phone);
  }
  return channels;
}
