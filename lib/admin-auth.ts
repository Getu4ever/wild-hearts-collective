import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ensureBootstrapAdmin } from "@/lib/admin-bootstrap";
import {
  type AdminPermission,
  type AdminRole,
  adminHasPermission,
  canAccessAdminSection,
  isAdminRole,
  resolveAdminPermissions,
} from "@/lib/admin-permissions";
import { db } from "@/lib/db";

export const ADMIN_COOKIE = "whc_admin_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

type SessionPayload = {
  adminId: string;
  role: string;
  issuedAt: number;
};

function getAdminSecret() {
  return process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
}

/** @deprecated Shared-password login — kept only for bootstrap / break-glass checks. */
export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function createSessionToken(adminId: string, role: AdminRole) {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("ADMIN_SECRET (or ADMIN_PASSWORD) is not configured.");
  }

  const payload = JSON.stringify({
    adminId,
    role,
    issuedAt: Date.now(),
  } satisfies SessionPayload);
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");

  return `${encoded}.${signature}`;
}

export function parseSessionToken(token: string): SessionPayload | null {
  const secret = getAdminSecret();
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
    ) as SessionPayload;

    if (!payload.adminId || !payload.role || !payload.issuedAt) return null;
    if (Date.now() - payload.issuedAt > SESSION_MAX_AGE_MS) return null;
    if (!isAdminRole(payload.role) && payload.role !== "admin") return null;

    return payload;
  } catch {
    return null;
  }
}

/** Legacy helper — prefer getAdminSession(). */
export function verifySessionToken(token: string) {
  return Boolean(parseSessionToken(token));
}

export async function getAdminSession(): Promise<AdminSession | null> {
  await ensureBootstrapAdmin();

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const payload = parseSessionToken(token);
  if (!payload) return null;

  const admin = await db.adminUser.findUnique({
    where: { id: payload.adminId },
  });

  if (!admin || !admin.active || !isAdminRole(admin.role)) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: resolveAdminPermissions(admin.role, admin.permissions),
  };
}

export async function isAdminAuthenticated() {
  return Boolean(await getAdminSession());
}

export function sessionHasPermission(
  session: AdminSession,
  required: AdminPermission | AdminPermission[],
) {
  return adminHasPermission(session.permissions, required);
}

export function sessionCanAccessSection(
  session: AdminSession,
  section: AdminPermission,
) {
  return canAccessAdminSection(session.permissions, section);
}
