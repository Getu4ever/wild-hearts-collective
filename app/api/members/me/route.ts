import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/member-auth";

export async function GET() {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: member });
}
