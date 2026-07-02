import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "whc_admin_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function getAdminSecret() {
  return process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function createSessionToken() {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  const payload = JSON.stringify({ role: "admin", issuedAt: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string) {
  const secret = getAdminSecret();
  if (!secret || !token.includes(".")) return false;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as { role: string; issuedAt: number };

    if (payload.role !== "admin") return false;
    if (Date.now() - payload.issuedAt > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
