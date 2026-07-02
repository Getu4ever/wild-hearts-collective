import { NextResponse } from "next/server";
import { getMemberSession, toPublicMember } from "@/lib/member-auth";
import {
  markEmailVerified,
  markPhoneVerified,
} from "@/lib/verification-service";
import { db } from "@/lib/db";
import { verifyVerificationCode } from "@/lib/verification";
import {
  type VerificationChannel,
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";

type ConfirmBody = {
  code?: string;
  purpose?: string;
  channel?: VerificationChannel;
  email?: string;
};

export async function POST(request: Request) {
  let body: ConfirmBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
  }

  const purpose =
    body.purpose === VERIFICATION_PURPOSE.passwordReset
      ? VERIFICATION_PURPOSE.passwordReset
      : VERIFICATION_PURPOSE.signupVerify;
  const channel = body.channel === VERIFICATION_CHANNEL.phone
    ? VERIFICATION_CHANNEL.phone
    : VERIFICATION_CHANNEL.email;

  const session = await getMemberSession();
  const email = body.email?.trim().toLowerCase();

  const record = await verifyVerificationCode({
    code,
    purpose,
    userId: session?.userId,
    email,
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  }

  const userId = record.userId ?? session?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unable to verify this code." }, { status: 400 });
  }

  if (purpose === VERIFICATION_PURPOSE.signupVerify) {
    if (channel === VERIFICATION_CHANNEL.phone) {
      await markPhoneVerified(userId);
    } else {
      await markEmailVerified(userId);
    }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      membershipPlan: true,
      membershipStatus: true,
      membershipRenewsAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    purpose,
    user: toPublicMember(user),
  });
}
