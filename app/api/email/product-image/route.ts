import { NextResponse } from "next/server";
import { renderEmailProductPng } from "@/lib/email-product-image-render";

export const runtime = "nodejs";

/**
 * Legacy query-string form kept for older emails already in inboxes.
 * Prefer /api/email/product-image/shop/….png (path form) for new mail.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")?.trim() ?? "";
  const png = await renderEmailProductPng(src);

  if (!png) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
