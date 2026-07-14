export type HeroImageKey =
  | "home"
  | "about"
  | "classes"
  | "pole"
  | "aerial-hoop"
  | "aerial-silks"
  | "community"
  | "creative-arts"
  | "parties"
  | "hire"
  | "contact"
  | "faqs"
  | "terms"
  | "shop";

export const heroImages: Record<HeroImageKey, string> = {
  home: "/hero/hero-home.jpg",
  about: "/hero/hero-about.jpg",
  classes: "/hero/hero-classes.jpg",
  pole: "/hero/hero-pole.jpg",
  "aerial-hoop": "/hero/hero-aerial-hoop.jpg",
  "aerial-silks": "/hero/hero-aerial-silks.jpg",
  community: "/hero/hero-community-hub.jpg",
  "creative-arts": "/hero/hero-creative-arts.jpg",
  parties: "/hero/hero-parties.jpg",
  hire: "/hero/hero-hire.jpg",
  contact: "/hero/hero-contact.jpg",
  faqs: "/hero/hero-faqs.jpg",
  terms: "/hero/hero-terms.jpg",
  shop: "/hero/hero-shop.jpg",
};

export const classSlugToHero: Record<string, HeroImageKey> = {
  pole: "pole",
  "aerial-hoop": "aerial-hoop",
  "aerial-silks": "aerial-silks",
  "creative-arts-workshops": "creative-arts",
};
