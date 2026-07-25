import { NextResponse } from "next/server";
import {
  getFeedbackByToken,
  submitClassFeedback,
} from "@/lib/class-feedback-service";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  try {
    const feedback = await getFeedbackByToken(token);
    if (!feedback) {
      return NextResponse.json({ error: "Feedback link not found." }, { status: 404 });
    }
    return NextResponse.json({
      name: feedback.name,
      classTitle: feedback.classTitle,
      submitted: Boolean(feedback.submittedAt),
    });
  } catch (error) {
    console.error("Failed to load feedback:", error);
    return NextResponse.json({ error: "Unable to load feedback." }, { status: 503 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const body = await request.json();
    const rating =
      typeof body.rating === "number"
        ? body.rating
        : Number.parseInt(String(body.rating ?? ""), 10);
    const comments = typeof body.comments === "string" ? body.comments : "";
    const shareOnWebsite = Boolean(body.shareOnWebsite);

    const feedback = await submitClassFeedback(token, {
      rating,
      comments,
      shareOnWebsite,
    });

    return NextResponse.json({
      ok: true,
      submittedAt: feedback.submittedAt,
      shareOnWebsite: feedback.shareOnWebsite,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit feedback.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
