import { heroImages, type HeroImageKey } from "@/lib/hero-images";

export const siteVideos = {
  services: {
    src: "/video/wild-hearts-collective-services.mp4",
    posterKey: "classes" as HeroImageKey,
    title: "Wild Hearts Collective classes overview",
  },
  pole: {
    src: "/video/pole-dancing.mp4",
    posterKey: "pole" as HeroImageKey,
    title: "Pole dancing at Wild Hearts Collective",
  },
  "aerial-hoop": {
    src: "/video/aerial-hoop.mp4",
    posterKey: "aerial-hoop" as HeroImageKey,
    title: "Aerial hoop at Wild Hearts Collective",
  },
  "aerial-silks": {
    src: "/video/aerial-silks.mp4",
    posterKey: "aerial-silks" as HeroImageKey,
    title: "Aerial silks at Wild Hearts Collective",
  },
  "creative-arts-workshops": {
    src: "/video/art-workshop.mp4",
    posterKey: "creative-arts" as HeroImageKey,
    title: "Creative arts workshops at Wild Hearts Collective",
  },
  parties: {
    src: "/video/birthday-party.mp4",
    posterKey: "parties" as HeroImageKey,
    title: "Parties and kids activities at Wild Hearts Collective",
  },
} as const;

export type SiteVideoKey = keyof typeof siteVideos;

export function getSiteVideo(key: SiteVideoKey) {
  const video = siteVideos[key];
  return {
    src: video.src,
    poster: heroImages[video.posterKey],
    title: video.title,
  };
}

export function getClassVideo(slug: string) {
  if (slug in siteVideos && slug !== "services" && slug !== "parties") {
    return getSiteVideo(slug as Exclude<SiteVideoKey, "services" | "parties">);
  }
  return null;
}
