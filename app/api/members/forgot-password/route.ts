import { NextResponse } from "next/server";
import { deliverVerificationCode, findUserForPasswordReset } from "@/lib/verification-service";
import {
  type VerificationChannel,
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";

type ForgotBody = {
  email?: string;
  channel?: VerificationChannel;
};

export async function POST(request: Request) {
  let body: ForgotBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const channel = body.channel === VERIFICATION_CHANNEL.phone
    ? VERIFICATION_CHANNEL.phone
    : VERIFICATION_CHANNEL.email;

  const user = await findUserForPasswordReset(email);

  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a verification code has been sent.",
    });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "This account uses Google sign-in. Please continue with Google." },
      { status: 400 },
    );
  }

  try {
    const delivery = await deliverVerificationCode(
      user,
      VERIFICATION_PURPOSE.passwordReset,
      channel,
    );

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a verification code has been sent.",
      ...delivery,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send verification code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
