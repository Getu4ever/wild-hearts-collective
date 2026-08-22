import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import {
  getAdminSession,
  sessionCanAccessSection,
  sessionHasPermission,
  type AdminSession,
} from "@/lib/admin-auth";
import type { AdminPermission } from "@/lib/admin-permissions";

export async function requireAdmin(permission?: AdminPermission | AdminPermission[]) {
  const session = await getAdminSession();

  if (!session) {
    return {
      authed: false as const,
      session: null,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (permission && !sessionHasPermission(session, permission)) {
    return {
      authed: false as const,
      session,
      response: NextResponse.json(
        { error: "You do not have permission to do that." },
        { status: 403 },
      ),
    };
  }

  return { authed: true as const, session };
}

/** Page guard — redirects to login or dashboard when access is denied. */
export async function requireAdminPage(
  permission?: AdminPermission,
  options?: { strict?: boolean },
): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  if (permission) {
    const allowed = options?.strict
      ? sessionHasPermission(session, permission)
      : sessionCanAccessSection(session, permission);
    if (!allowed) {
      redirect("/admin?denied=1");
    }
  }

  return session;
}
