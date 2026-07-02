import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const MEMBER_COOKIE = "whc_member_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function getMemberSecret() {
  return (
    process.env.MEMBER_SESSION_SECRET ??
    process.env.ADMIN_SECRET ??
    process.env.ADMIN_PASSWORD ??
    ""
  );
}

export type MemberSessionPayload = {
  role: "member";
  userId: string;
  issuedAt: number;
};

export function createMemberSessionToken(userId: string) {
  const secret = getMemberSecret();
  if (!secret) {
    throw new Error("Member sessions are not configured.");
  }

  const payload: MemberSessionPayload = {
    role: "member",
    userId,
    issuedAt: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyMemberSessionToken(token: string) {
  const secret = getMemberSecret();
  if (!secret || !token.includes(".")) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as MemberSessionPayload;

    if (payload.role !== "member" || !payload.userId) return null;
    if (Date.now() - payload.issuedAt > SESSION_MAX_AGE_MS) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getMemberSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  return verifyMemberSessionToken(token);
}

export type PublicMember = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  membershipPlan: string;
  membershipStatus: string;
  membershipRenewsAt: Date | null;
  createdAt: Date;
};

export function toPublicMember(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image?: string | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  membershipPlan: string;
  membershipStatus: string;
  membershipRenewsAt: Date | null;
  createdAt: Date;
}): PublicMember {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    image: user.image ?? null,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    membershipPlan: user.membershipPlan,
    membershipStatus: user.membershipStatus,
    membershipRenewsAt: user.membershipRenewsAt,
    createdAt: user.createdAt,
  };
}

export async function getCurrentMember() {
  const session = await getMemberSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
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

  if (!user) return null;
  return toPublicMember(user);
}

export function setMemberSessionCookie(token: string) {
  return {
    name: MEMBER_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
