import { getAppBaseUrl } from "@/lib/booking-config";

/**
 * Build an absolute product image URL that email clients can render.
 * Shop catalog images are SVG. Clients like Zoho Mail (and often Outlook)
 * fail on remote SVG `<img src>` and show a broken icon, while Gmail may still
 * display them. SVG paths are routed through a PNG conversion endpoint.
 *
 * Uses a path-based URL ending in `.png` (not `.svg` or `?src=`):
 * - Zoho Mail’s image proxy often strips query strings
 * - Zoho also drops `src` entirely when the URL path looks like SVG (`.svg`)
 */
export function resolveEmailProductImageUrl(
  image: string | null | undefined,
  baseUrl = getAppBaseUrl(),
): string | null {
  if (!image?.trim()) return null;

  const normalized = image.trim().startsWith("/")
    ? image.trim()
    : `/${image.trim()}`;

  if (/\.svg$/i.test(normalized)) {
    // /shop/foo.svg → /api/email/product-image/shop/foo.png (serves PNG)
    const pngPath = normalized.replace(/\.svg$/i, ".png");
    return `${baseUrl}/api/email/product-image${pngPath}`;
  }

  return `${baseUrl}${normalized}`;
}

/** Only public shop (and similar) assets — no path traversal. */
export function resolveSafeEmailPublicAssetPath(src: string) {
  const normalized = src.trim().startsWith("/")
    ? src.trim()
    : `/${src.trim()}`;

  if (
    !normalized.startsWith("/") ||
    normalized.includes("..") ||
    normalized.includes("\\") ||
    normalized.includes("\0")
  ) {
    return null;
  }
  if (!/^\/(shop|logo|hero)\//i.test(normalized)) {
    return null;
  }
  if (!/\.(svg|png|jpe?g|webp|gif)$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Map an email product-image path back to candidate public asset paths.
 * New emails use `.png` in the URL while the catalog file may still be `.svg`.
 * Old emails may still request the `.svg` path directly.
 */
export function emailProductImageAssetCandidates(src: string): string[] {
  const safeSrc = resolveSafeEmailPublicAssetPath(src);
  if (!safeSrc) return [];

  const candidates = [safeSrc];
  if (/\.png$/i.test(safeSrc)) {
    const svgSrc = safeSrc.replace(/\.png$/i, ".svg");
    if (resolveSafeEmailPublicAssetPath(svgSrc)) {
      candidates.push(svgSrc);
    }
  }
  return candidates;
}
