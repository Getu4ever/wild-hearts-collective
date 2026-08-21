import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  getRewardCampaignSettings,
  normalizeWinbackSteps,
  updateRewardCampaignSettings,
} from "@/lib/reward-campaign-settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const settings = await getRewardCampaignSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to load engagement settings:", error);
    return NextResponse.json(
      { error: "Unable to load engagement settings." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const winbackEnabled =
      typeof body.winbackEnabled === "boolean"
        ? body.winbackEnabled
        : typeof body.enabled === "boolean"
          ? body.enabled
          : undefined;
    const birthdayEnabled =
      typeof body.birthdayEnabled === "boolean" ? body.birthdayEnabled : undefined;
    const milestoneEnabled =
      typeof body.milestoneEnabled === "boolean" ? body.milestoneEnabled : undefined;

    const winbackSteps =
      body.winbackSteps !== undefined
        ? normalizeWinbackSteps(body.winbackSteps)
        : undefined;

    if (
      winbackEnabled === undefined &&
      birthdayEnabled === undefined &&
      milestoneEnabled === undefined &&
      winbackSteps === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Provide winbackEnabled, birthdayEnabled, milestoneEnabled, or winbackSteps.",
        },
        { status: 400 },
      );
    }

    const settings = await updateRewardCampaignSettings({
      winbackEnabled,
      birthdayEnabled,
      milestoneEnabled,
      winbackSteps,
    });
    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update engagement settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
