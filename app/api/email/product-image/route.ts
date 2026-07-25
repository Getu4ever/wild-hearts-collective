import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

/** Only public shop (and similar) assets — no path traversal. */
function resolveSafePublicAsset(src: string) {
  if (!src.startsWith("/") || src.includes("..") || src.includes("\\")) {
    return null;
  }
  if (!/^\/(shop|logo|hero)\//i.test(src)) {
    return null;
  }
  if (!/\.(svg|png|jpe?g|webp|gif)$/i.test(src)) {
    return null;
  }

  const absolute = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  const publicRoot = path.join(process.cwd(), "public");
  if (!absolute.startsWith(publicRoot + path.sep)) {
    return null;
  }
  return absolute;
}

/**
 * Email-safe raster thumbnail for catalog images (especially SVG → PNG).
 * Used by shop order / gift voucher emails so Gmail and Outlook show product art.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")?.trim() ?? "";
  const filePath = resolveSafePublicAsset(src);

  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const input = await readFile(filePath);
    const isSvg = /\.svg$/i.test(filePath);

    const png = await sharp(input, isSvg ? { density: 180 } : undefined)
      .resize(144, 144, {
        fit: "cover",
        background: { r: 247, g: 244, b: 239, alpha: 1 },
      })
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("[email:product-image]", src, error);
    return new NextResponse("Not found", { status: 404 });
  }
}
