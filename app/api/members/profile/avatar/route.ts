import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { profileSelectFields, toMemberProfile } from "@/lib/member-profile-service";
import { db } from "@/lib/db";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose a photo to upload." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, or WebP image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 2 MB or smaller." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  if (dataUrl.length > 1_500_000) {
    return NextResponse.json(
      { error: "Image is too large after processing. Please choose a smaller photo." },
      { status: 400 },
    );
  }

  const updated = await db.user.update({
    where: { id: session.userId },
    data: { image: dataUrl },
    select: profileSelectFields,
  });

  return NextResponse.json({ profile: toMemberProfile(updated) });
}

export async function DELETE() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const googleAccount = await db.oAuthAccount.findFirst({
    where: { userId: session.userId, provider: "google" },
    select: { profileImageUrl: true },
  });

  const updated = await db.user.update({
    where: { id: session.userId },
    data: { image: googleAccount?.profileImageUrl ?? null },
    select: profileSelectFields,
  });

  return NextResponse.json({ profile: toMemberProfile(updated) });
}
