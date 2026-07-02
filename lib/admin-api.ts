import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function requireAdmin() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return {
      authed: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { authed: true as const };
}
