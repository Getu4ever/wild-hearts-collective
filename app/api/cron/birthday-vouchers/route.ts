import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { issueBirthdayVouchersForToday } from "@/lib/voucher-service";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) return auth.response;

  const result = await issueBirthdayVouchersForToday();
  return NextResponse.json({ ok: true, ...result });
}
