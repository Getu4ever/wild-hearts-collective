import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { runDailyEngagementJobs } from "@/lib/engagement-service";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) return auth.response;

  const result = await runDailyEngagementJobs();
  return NextResponse.json({ ok: true, ...result });
}
