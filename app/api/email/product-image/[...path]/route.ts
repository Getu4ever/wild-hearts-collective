import { NextResponse } from "next/server";
import { renderEmailProductPng } from "@/lib/email-product-image-render";

export const runtime = "nodejs";

/**
 * Email-safe raster thumbnail for catalog images (especially SVG → PNG).
 * Path form: /api/email/product-image/shop/liquid-chalk.svg
 * Prefer this over ?src= — Zoho Mail’s image proxy often strips query strings.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const src = `/${(segments ?? []).join("/")}`;
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
