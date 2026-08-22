import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  getRewardCampaignSettings,
  normalizeMilestoneSteps,
  normalizeWinbackSteps,
  updateRewardCampaignSettings,
  validateRewardValidDays,
  validateWinbackDiscountPercent,
} from "@/lib/reward-campaign-settings";

export async function GET() {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.analytics);
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
  const admin = await requireAdmin(ADMIN_PERMISSIONS.analytics);
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

    const birthdayDiscountPercent =
      body.birthdayDiscountPercent !== undefined
        ? validateWinbackDiscountPercent(body.birthdayDiscountPercent)
        : undefined;

    const birthdayValidDays =
      body.birthdayValidDays !== undefined
        ? validateRewardValidDays(body.birthdayValidDays)
        : undefined;

    const milestoneSteps =
      body.milestoneSteps !== undefined
        ? normalizeMilestoneSteps(body.milestoneSteps)
        : undefined;

    if (
      winbackEnabled === undefined &&
      birthdayEnabled === undefined &&
      milestoneEnabled === undefined &&
      winbackSteps === undefined &&
      birthdayDiscountPercent === undefined &&
      birthdayValidDays === undefined &&
      milestoneSteps === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Provide winbackEnabled, birthdayEnabled, milestoneEnabled, winbackSteps, birthdayDiscountPercent, birthdayValidDays, or milestoneSteps.",
        },
        { status: 400 },
      );
    }

    const settings = await updateRewardCampaignSettings({
      winbackEnabled,
      birthdayEnabled,
      milestoneEnabled,
      winbackSteps,
      birthdayDiscountPercent,
      birthdayValidDays,
      milestoneSteps,
    });
    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update engagement settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
