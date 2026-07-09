import { NextResponse } from "next/server";
import {
  CancellationPolicyError,
  handleMemberCancelRequest,
} from "@/lib/cancellation-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const result = await handleMemberCancelRequest(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CancellationPolicyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to cancel booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
