import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAppBaseUrl } from "@/lib/booking-config";

export const GOOGLE_OAUTH_STATE_COOKIE = "whc_google_oauth_state";
export const GOOGLE_OAUTH_NEXT_COOKIE = "whc_google_oauth_next";

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri() {
  return `${getAppBaseUrl()}/api/auth/google/callback`;
}

function getOAuthSecret() {
  return (
    process.env.MEMBER_SESSION_SECRET ??
    process.env.ADMIN_SECRET ??
    process.env.ADMIN_PASSWORD ??
    ""
  );
}

export function createOAuthState() {
  const nonce = randomBytes(16).toString("hex");
  const secret = getOAuthSecret();
  if (!secret) throw new Error("OAuth is not configured.");
  const signature = createHmac("sha256", secret).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

export function verifyOAuthState(state: string) {
  const secret = getOAuthSecret();
  if (!secret || !state.includes(".")) return false;

  const [nonce, signature] = state.split(".");
  if (!nonce || !signature) return false;

  const expected = createHmac("sha256", secret).update(nonce).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return true;
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to complete Google sign-in.");
  }

  return (await response.json()) as { access_token: string };
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Unable to load Google profile.");
  }

  return (await response.json()) as {
    id: string;
    email: string;
    verified_email?: boolean;
    name: string;
    picture?: string;
  };
}

export async function setGoogleOAuthCookies(state: string, nextPath: string) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  cookieStore.set(GOOGLE_OAUTH_NEXT_COOKIE, nextPath, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function clearGoogleOAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(GOOGLE_OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
}
