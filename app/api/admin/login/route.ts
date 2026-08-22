import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken } from "@/lib/admin-auth";
import { authenticateAdmin } from "@/lib/admin-staff-service";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_SECRET) {
    return NextResponse.json(
      {
        error:
          "Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_SECRET in .env.",
      },
      { status: 503 },
    );
  }

  let email = "";
  let password = "";

  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const admin = await authenticateAdmin(email, password);
    if (!admin) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, createSessionToken(admin.id, admin.role), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      ok: true,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    console.error("[admin/login]", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Restart the local server and try again." },
      { status: 500 },
    );
  }
}
