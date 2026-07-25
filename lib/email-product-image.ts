import { getAppBaseUrl } from "@/lib/booking-config";

/**
 * Build an absolute product image URL that email clients can render.
 * Shop catalog images are SVG. Clients like Zoho Mail (and often Outlook)
 * fail on remote SVG `<img src>` and show a broken icon, while Gmail may still
 * display them. SVG paths are routed through a PNG conversion endpoint.
 *
 * Uses a path-based URL (not `?src=`) because Zoho Mail’s image proxy often
 * strips query strings, which broke the previous PNG endpoint for admin mail.
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
    // /shop/foo.svg → /api/email/product-image/shop/foo.svg (serves PNG)
    return `${baseUrl}/api/email/product-image${normalized}`;
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
