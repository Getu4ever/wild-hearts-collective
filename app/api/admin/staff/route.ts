import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  createAdminUser,
  listAdminUsers,
} from "@/lib/admin-staff-service";
import { isAdminRole } from "@/lib/admin-permissions";
import { sanitizePermissions } from "@/lib/admin-permissions";

export async function GET() {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.staff);
  if (!admin.authed) return admin.response;

  try {
    const users = await listAdminUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to list staff:", error);
    return NextResponse.json(
      { error: "Unable to load staff accounts." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.staff);
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const name = typeof body.name === "string" ? body.name : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role : "";
    const useRoleDefaults = body.useRoleDefaults === true;
    const permissions = useRoleDefaults
      ? null
      : sanitizePermissions(body.permissions);

    if (!isAdminRole(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (role === "master" && admin.session.role !== "master") {
      return NextResponse.json(
        { error: "Only a master admin can create another master." },
        { status: 403 },
      );
    }

    const user = await createAdminUser({
      email,
      name,
      password,
      role,
      permissions,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create staff account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
