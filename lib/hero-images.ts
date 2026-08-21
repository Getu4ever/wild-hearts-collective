export type HeroImageKey =
  | "home"
  | "about"
  | "team"
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
  | "shop"
  | "teens"
  | "children"
  | "aerial-workshops"
  | "pole-workshops"
  | "reviews";

export const heroImages: Record<HeroImageKey, string> = {
  home: "/hero/hero-home.jpg",
  about: "/hero/hero-about02.jpg",
  team: "/hero/hero-about-team02.jpg",
  classes: "/hero/hero-classes.jpg",
  pole: "/hero/hero-pole.jpg",
  "aerial-hoop": "/hero/hero-aerial-hoop.jpg",
  "aerial-silks": "/hero/hero-aerial-silks.jpg",
  community: "/hero/hero-community-hub.jpg",
  "creative-arts": "/hero/hero-creative-arts-table.jpg",
  parties: "/hero/hero-parties.jpg",
  hire: "/hero/hero-hire.jpg",
  contact: "/hero/hero-contact.jpg",
  faqs: "/hero/hero-faqs.jpg",
  terms: "/hero/hero-terms.jpg",
  shop: "/hero/hero-shop.jpg",
  teens: "/hero/hero-teens.jpg",
  children: "/hero/hero-children.jpg",
  "aerial-workshops": "/hero/hero-aerial-workshops.jpg",
  "pole-workshops": "/hero/hero-pole-workshops.jpg",
  reviews: "/hero/hero-reviews.jpg",
};

export const classSlugToHero: Record<string, HeroImageKey> = {
  pole: "pole",
  "aerial-hoop": "aerial-hoop",
  "aerial-silks": "aerial-silks",
  "creative-arts-workshops": "creative-arts",
  family: "classes",
  teens: "teens",
  children: "children",
  "aerial-workshops": "aerial-workshops",
  "pole-workshops": "pole-workshops",
  "beginner-courses": "classes",
};
