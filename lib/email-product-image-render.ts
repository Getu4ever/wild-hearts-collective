import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { resolveSafeEmailPublicAssetPath } from "@/lib/email-product-image";

function toAbsolutePublicFile(src: string) {
  const absolute = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  const publicRoot = path.join(process.cwd(), "public");
  if (!absolute.startsWith(publicRoot + path.sep)) {
    return null;
  }
  return absolute;
}

/**
 * Rasterise a public asset to a 144×144 PNG for email clients.
 * Returns null when the path is unsafe or the file cannot be read/converted.
 */
export async function renderEmailProductPng(src: string) {
  const safeSrc = resolveSafeEmailPublicAssetPath(src);
  if (!safeSrc) return null;

  const filePath = toAbsolutePublicFile(safeSrc);
  if (!filePath) return null;

  try {
    const input = await readFile(filePath);
    const isSvg = /\.svg$/i.test(filePath);

    return await sharp(input, isSvg ? { density: 180 } : undefined)
      .resize(144, 144, {
        fit: "cover",
        background: { r: 247, g: 244, b: 239, alpha: 1 },
      })
      .png()
      .toBuffer();
  } catch (error) {
    console.error("[email:product-image]", safeSrc, error);
    return null;
  }
}
