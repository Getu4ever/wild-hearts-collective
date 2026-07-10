import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { expireStalePendingBookings } from "@/lib/booking-service";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) return auth.response;

  const result = await expireStalePendingBookings();
  return NextResponse.json({ ok: true, ...result });
}
