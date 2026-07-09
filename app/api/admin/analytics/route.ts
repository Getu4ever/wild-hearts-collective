import { NextResponse } from "next/server";
import { getAdminAnalytics } from "@/lib/analytics-service";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const analytics = await getAdminAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
    return NextResponse.json(
      { error: "Unable to load analytics. Check the database connection." },
      { status: 503 },
    );
  }
}
