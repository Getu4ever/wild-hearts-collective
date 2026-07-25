import { access, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { emailProductImageAssetCandidates } from "@/lib/email-product-image";

function toAbsolutePublicFile(src: string) {
  const absolute = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  const publicRoot = path.join(process.cwd(), "public");
  if (!absolute.startsWith(publicRoot + path.sep)) {
    return null;
  }
  return absolute;
}

async function resolveExistingPublicFile(src: string) {
  for (const candidate of emailProductImageAssetCandidates(src)) {
    const absolute = toAbsolutePublicFile(candidate);
    if (!absolute) continue;
    try {
      await access(absolute);
      return { filePath: absolute, src: candidate };
    } catch {
      // try next candidate (e.g. .png email URL → .svg on disk)
    }
  }
  return null;
}

/**
 * Rasterise a public asset to a 144×144 PNG for email clients.
 * Returns null when the path is unsafe or the file cannot be read/converted.
 */
export async function renderEmailProductPng(src: string) {
  const resolved = await resolveExistingPublicFile(src);
  if (!resolved) return null;

  try {
    const input = await readFile(resolved.filePath);
    const isSvg = /\.svg$/i.test(resolved.filePath);

    return await sharp(input, isSvg ? { density: 180 } : undefined)
      .resize(144, 144, {
        fit: "cover",
        background: { r: 247, g: 244, b: 239, alpha: 1 },
      })
      .png()
      .toBuffer();
  } catch (error) {
    console.error("[email:product-image]", resolved.src, error);
    return null;
  }
}
