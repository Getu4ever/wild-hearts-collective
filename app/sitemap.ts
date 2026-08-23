import type { MetadataRoute } from "next";
import { LIVE_SITE_URL } from "@/lib/booking-config";
import { classes } from "@/lib/site-data";
import { teamMembers } from "@/lib/team-data";

const siteUrl = LIVE_SITE_URL.replace(/\/$/, "");

function url(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    url("/", "weekly", 1),
    url("/about", "monthly", 0.8),
    url("/about/team", "monthly", 0.7),
    ...teamMembers.map((member) => url(`/about/team/${member.slug}`, "monthly", 0.6)),
    url("/classes", "weekly", 0.9),
    ...classes.map((classItem) => url(`/classes/${classItem.slug}`, "monthly", 0.8)),
    url("/book", "weekly", 0.9),
    url("/membership", "weekly", 0.8),
    url("/community", "monthly", 0.6),
    url("/parties", "monthly", 0.7),
    url("/hire", "monthly", 0.7),
    url("/shop", "weekly", 0.7),
    url("/reviews", "weekly", 0.6),
    url("/contact", "monthly", 0.7),
    url("/faqs", "monthly", 0.5),
    url("/terms", "yearly", 0.3),
    url("/cookie-policy", "yearly", 0.3),
    url("/disclaimer", "yearly", 0.3),
    url("/privacy", "yearly", 0.3),
  ];
}
