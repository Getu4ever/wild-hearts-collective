import type { MetadataRoute } from "next";
import { LIVE_SITE_URL } from "@/lib/booking-config";

const siteUrl = LIVE_SITE_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/api/",
        "/login",
        "/register",
        "/verify",
        "/forgot-password",
        "/reset-password",
        "/feedback/",
        "/bundles",
        "/shop/success",
        "/book/success",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
