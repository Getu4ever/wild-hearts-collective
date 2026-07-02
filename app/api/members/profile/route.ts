import { NextResponse } from "next/server";
import { getCurrentMember, getMemberSession, toPublicMember } from "@/lib/member-auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

type ProfileBody = {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function PATCH(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: ProfileBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const data: {
    name?: string;
    phone?: string | null;
    passwordHash?: string;
  } = {};

  if (body.name?.trim()) {
    data.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    data.phone = body.phone.trim() || null;
  }

  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Set a password using Google account settings or contact support." },
        { status: 400 },
      );
    }

    const currentPassword = body.currentPassword ?? "";
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    data.passwordHash = hashPassword(body.newPassword);
  }

  if (Object.keys(data).length === 0) {
    const member = await getCurrentMember();
    return NextResponse.json({ user: member });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data,
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

  return NextResponse.json({ user: toPublicMember(updated) });
}
