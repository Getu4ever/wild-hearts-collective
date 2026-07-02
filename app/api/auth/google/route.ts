import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  isGoogleAuthConfigured,
  setGoogleOAuthCookies,
} from "@/lib/google-auth";

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: "Google sign-in is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") ? next : "/account";
  const state = createOAuthState();

  await setGoogleOAuthCookies(state, safeNext);

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
