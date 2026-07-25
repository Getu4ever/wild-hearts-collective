import { getAppBaseUrl } from "@/lib/booking-config";

/**
 * Build an absolute product image URL that email clients can render.
 * Shop catalog images are SVG. Clients like Zoho Mail (and often Outlook)
 * fail on remote SVG `<img src>` and show a broken icon, while Gmail may still
 * display them. SVG paths are routed through a PNG conversion endpoint.
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
    return `${baseUrl}/api/email/product-image?src=${encodeURIComponent(normalized)}`;
  }

  return `${baseUrl}${normalized}`;
}
