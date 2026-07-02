import { NextResponse } from "next/server";
import { findUserForPasswordReset } from "@/lib/verification-service";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { verifyVerificationCode } from "@/lib/verification";
import { VERIFICATION_PURPOSE } from "@/lib/verification-config";

type ResetBody = {
  email?: string;
  code?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: ResetBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  const password = body.password ?? "";

  if (!email || !code || !password) {
    return NextResponse.json(
      { error: "Email, verification code, and new password are required." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const user = await findUserForPasswordReset(email);
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Unable to reset password." }, { status: 400 });
  }

  const record = await verifyVerificationCode({
    code,
    purpose: VERIFICATION_PURPOSE.passwordReset,
    userId: user.id,
    email,
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(password) },
  });

  return NextResponse.json({ ok: true });
}
