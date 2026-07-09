import { NextResponse } from "next/server";

export function verifyCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "CRON_SECRET is not configured." },
        { status: 503 },
      ),
    };
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const headerSecret = request.headers.get("x-cron-secret");

  if (bearer !== secret && headerSecret !== secret) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true as const };
}
