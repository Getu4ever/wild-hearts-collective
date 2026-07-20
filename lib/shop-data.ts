/**
 * Shop catalog — product data for the storefront.
 * Set `isAvailable: true` to go live. Digital gift vouchers use `digitalDelivery: true`
 * (email codes). Physical catalog items use `digitalDelivery: false` (UK shipping).
 */

export const SHOP_CATEGORIES = {
  "gift-vouchers": {
    id: "gift-vouchers",
    label: "Gift Vouchers",
    shortLabel: "E-Vouchers",
    description: "Digital gift cards and experience vouchers — delivered by email.",
  },
  "aerial-equipment": {
    id: "aerial-equipment",
    label: "Aerial Equipment",
    shortLabel: "Aerial",
    description: "Silks, lyra, frames, and mats for home and studio training.",
  },
  "metalwork-accessories": {
    id: "metalwork-accessories",
    label: "Metalwork Accessories",
    shortLabel: "Metalwork",
    description: "Professional rigging hardware for aerial and pole.",
  },
  clothing: {
    id: "clothing",
    label: "Clothing",
    shortLabel: "Apparel",
    description: "High-grip kit, uniforms, and studio lifestyle wear.",
  },
  accessories: {
    id: "accessories",
    label: "Accessories",
    shortLabel: "Accessories",
    description: "Grip aids, recovery care, and workshop essentials.",
  },
  "studio-snacks": {
    id: "studio-snacks",
    label: "Studio Snacks",
    shortLabel: "Snacks",
    description: "Energy bars, shakes, and healthy refreshments.",
  },
} as const;

export type ShopCategoryId = keyof typeof SHOP_CATEGORIES;

export const shopCategoryList = Object.values(SHOP_CATEGORIES);

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ShopCategoryId;
  /** Price in pence (GBP). */
  pricePence: number;
  /**
   * When true, Stripe checkout is active (Gift Vouchers only).
   * When false, the card shows a disabled Coming soon CTA.
   */
  isAvailable: boolean;
  /** Digital products skip shipping and use email delivery. */
  digitalDelivery: boolean;
  /** ISO date — used for Newest sort. */
  createdAt: string;
  /** Product image under /public (e.g. /shop/slug.svg). */
  image: string;
  /** Tailwind gradient classes used as a soft fallback behind the image. */
  imageGradient: string;
  /** Optional apparel variants — shown for UI even when Coming soon. */
  variants?: {
    sizes?: string[];
    colours?: string[];
  };
};

export const productsData: ShopProduct[] = [
  // ── Category 1: Gift Vouchers (purchasable) ─────────────────────────────
  {
    id: "gv-25",
    slug: "e-gift-card-25",
    image: "/shop/e-gift-card-25.svg",
    name: "E-Gift Card — £25",
    description:
      "An agnostic studio gift card for classes, packs, or experiences. Delivered instantly by email.",
    category: "gift-vouchers",
    pricePence: 2500,
    isAvailable: true,
    digitalDelivery: true,
    createdAt: "2026-06-01T10:00:00.000Z",
    imageGradient: "from-pink-light via-pink-soft to-cream",
  },
  {
    id: "gv-50",
    slug: "e-gift-card-50",
    image: "/shop/e-gift-card-50.svg",
    name: "E-Gift Card — £50",
    description:
      "A flexible £50 e-gift card — perfect for birthdays, thank-yous, or treating a friend.",
    category: "gift-vouchers",
    pricePence: 5000,
    isAvailable: true,
    digitalDelivery: true,
    createdAt: "2026-06-01T10:05:00.000Z",
    imageGradient: "from-brand/30 via-pink-soft to-sage-light",
  },
  {
    id: "gv-100",
    slug: "e-gift-card-100",
    image: "/shop/e-gift-card-100.svg",
    name: "E-Gift Card — £100",
    description:
      "Our largest agnostic gift card. Redeemable against studio classes and selected experiences.",
    category: "gift-vouchers",
    pricePence: 10000,
    isAvailable: true,
    digitalDelivery: true,
    createdAt: "2026-06-01T10:10:00.000Z",
    imageGradient: "from-plum/20 via-pink-light to-cream",
  },
  {
    id: "gv-pole-intro",
    slug: "intro-to-pole-4-week",
    image: "/shop/intro-to-pole-4-week.svg",
    name: "Intro to Pole — 4-Week Course Voucher",
    description:
      "Gift a specific experience: a four-week beginner pole course at Wild Hearts Collective.",
    category: "gift-vouchers",
    pricePence: 8000,
    isAvailable: true,
    digitalDelivery: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    imageGradient: "from-sage-light via-pink-soft to-background",
  },
  {
    id: "gv-art-kit",
    slug: "art-kit-class-bundle",
    image: "/shop/art-kit-class-bundle.svg",
    name: "Art Kit & Class Bundle",
    description:
      "Creative arts workshop place plus a take-home art kit — a thoughtful gift for makers.",
    category: "gift-vouchers",
    pricePence: 6500,
    isAvailable: true,
    digitalDelivery: true,
    createdAt: "2026-06-15T14:00:00.000Z",
    imageGradient: "from-pink-soft via-cream to-sage-light",
  },

  // ── Category 2: Aerial Equipment (Coming soon) ──────────────────────────
  {
    id: "ae-silks",
    slug: "low-stretch-aerial-silks",
    image: "/shop/low-stretch-aerial-silks.svg",
    name: "Low-Stretch Aerial Silks Fabric",
    description:
      "Professional low-stretch silks fabric for training and performance. Sold by length.",
    category: "aerial-equipment",
    pricePence: 12000,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-20T09:00:00.000Z",
    imageGradient: "from-plum/15 via-sage-light to-cream",
  },
  {
    id: "ae-lyra",
    slug: "stainless-steel-lyra",
    image: "/shop/stainless-steel-lyra.svg",
    name: "Stainless Steel Aerial Hoop (Lyra)",
    description:
      "Welded stainless steel lyra with tab or tabless options. Studio-grade finish.",
    category: "aerial-equipment",
    pricePence: 18500,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-21T09:00:00.000Z",
    imageGradient: "from-muted/20 via-pink-soft to-surface",
  },
  {
    id: "ae-aframe",
    slug: "portable-home-a-frame",
    image: "/shop/portable-home-a-frame.svg",
    name: "Portable Home A-Frame",
    description:
      "Freestanding portable A-frame for home aerial practice. Compact fold for storage.",
    category: "aerial-equipment",
    pricePence: 45000,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-22T09:00:00.000Z",
    imageGradient: "from-sage/25 via-cream to-pink-soft",
  },
  {
    id: "ae-mat",
    slug: "safety-crash-mat",
    image: "/shop/safety-crash-mat.svg",
    name: "Safety Crash Mat",
    description:
      "High-density crash mat for aerial and pole training. Non-slip cover, easy clean.",
    category: "aerial-equipment",
    pricePence: 22000,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-23T09:00:00.000Z",
    imageGradient: "from-pink-light via-background to-sage-light",
  },
  {
    id: "ae-rope",
    slug: "aerial-rope-corde-lisse",
    image: "/shop/aerial-rope-corde-lisse.svg",
    name: "Aerial Rope (Corde Lisse)",
    description:
      "Studio-grade cotton aerial rope for climbs, wraps, and dynamic work. Available in standard training lengths.",
    category: "aerial-equipment",
    pricePence: 18200,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-24T09:00:00.000Z",
    imageGradient: "from-plum/20 via-cream to-sage-light",
  },
  {
    id: "ae-chains",
    slug: "aerial-chains",
    image: "/shop/aerial-chains.svg",
    name: "Aerial Chains",
    description:
      "Heavy-duty aerial hanging chains for hoops, ropes, and silks. Sold in training-ready lengths.",
    category: "aerial-equipment",
    pricePence: 11000,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-25T09:00:00.000Z",
    imageGradient: "from-muted/15 via-pink-soft to-cream",
  },
  {
    id: "ae-slings",
    slug: "chain-shortening-slings",
    image: "/shop/chain-shortening-slings.svg",
    name: "Chain Shortening Slings",
    description:
      "Adjustable chain shortening slings for fine-tuning apparatus height between sessions.",
    category: "aerial-equipment",
    pricePence: 1800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-26T09:00:00.000Z",
    imageGradient: "from-sage-light via-cream to-pink-soft",
  },

  // ── Category 3: Metalwork Accessories (Coming soon) ─────────────────────
  {
    id: "mw-carabiner",
    slug: "professional-carabiners",
    image: "/shop/professional-carabiners.svg",
    name: "Heavy-Duty Carabiners",
    description:
      "Professional locking carabiners rated for aerial and rigging use.",
    category: "metalwork-accessories",
    pricePence: 2800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-10T11:00:00.000Z",
    imageGradient: "from-plum/25 via-muted/10 to-cream",
  },
  {
    id: "mw-swivel",
    slug: "aerial-swivel",
    image: "/shop/aerial-swivel.svg",
    name: "Aerial Swivel",
    description:
      "Smooth-bearing swivel for silks and hoop — reduces fabric twist mid-session.",
    category: "metalwork-accessories",
    pricePence: 6500,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-11T11:00:00.000Z",
    imageGradient: "from-sage-light via-surface to-pink-soft",
  },
  {
    id: "mw-plate",
    slug: "rigging-plate",
    image: "/shop/rigging-plate.svg",
    name: "Rigging Plate",
    description:
      "Multi-point rigging plate for professional aerial setups and span sets.",
    category: "metalwork-accessories",
    pricePence: 8900,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-12T11:00:00.000Z",
    imageGradient: "from-foreground/10 via-cream to-pink-light",
  },
  {
    id: "mw-spanet",
    slug: "spanets",
    image: "/shop/spanets.svg",
    name: "Spanets",
    description:
      "Soft spanets for comfortable aerial spans and fabric protection on hardware.",
    category: "metalwork-accessories",
    pricePence: 1800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-05-13T11:00:00.000Z",
    imageGradient: "from-brand/20 via-pink-soft to-background",
  },

  // ── Category 4: Clothing (Coming soon — variants shown for UI) ──────────
  {
    id: "cl-shorts",
    slug: "high-grip-pole-shorts",
    image: "/shop/high-grip-pole-shorts.svg",
    name: "High-Grip Pole Shorts",
    description:
      "Second-skin pole shorts with high-grip fabric for holds and climbs.",
    category: "clothing",
    pricePence: 3200,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-20T08:00:00.000Z",
    imageGradient: "from-pink via-pink-light to-cream",
    variants: {
      sizes: ["XS", "S", "M", "L", "XL"],
      colours: ["Black", "Dusty Pink", "Sage"],
    },
  },
  {
    id: "cl-bra",
    slug: "sports-bra",
    image: "/shop/sports-bra.svg",
    name: "Support Sports Bra",
    description:
      "Medium-support sports bra designed for aerial and pole movement.",
    category: "clothing",
    pricePence: 2800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-21T08:00:00.000Z",
    imageGradient: "from-sage-light via-pink-soft to-surface",
    variants: {
      sizes: ["XS", "S", "M", "L", "XL"],
      colours: ["Black", "Ivory", "Brand Pink"],
    },
  },
  {
    id: "cl-leggings",
    slug: "aerial-safe-leggings",
    image: "/shop/aerial-safe-leggings.svg",
    name: "Aerial-Safe Long Leggings",
    description:
      "Seamless long leggings that stay put on silks and hoop without catching.",
    category: "clothing",
    pricePence: 4200,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-22T08:00:00.000Z",
    imageGradient: "from-plum/20 via-cream to-sage-light",
    variants: {
      sizes: ["XS", "S", "M", "L", "XL"],
      colours: ["Black", "Charcoal"],
    },
  },
  {
    id: "cl-unitard",
    slug: "fitted-unitard",
    image: "/shop/fitted-unitard.svg",
    name: "Fitted Unitard",
    description:
      "Full-body fitted unitard for training and performance — grip-friendly fabric.",
    category: "clothing",
    pricePence: 5800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-23T08:00:00.000Z",
    imageGradient: "from-brand/25 via-pink-soft to-background",
    variants: {
      sizes: ["XS", "S", "M", "L", "XL"],
      colours: ["Black", "Wine"],
    },
  },
  {
    id: "cl-apron",
    slug: "workshop-canvas-apron",
    image: "/shop/workshop-canvas-apron.svg",
    name: "Workshop Canvas Apron",
    description:
      "Heavy-duty canvas apron for creative arts workshops — pockets and adjustable straps.",
    category: "clothing",
    pricePence: 3500,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-24T08:00:00.000Z",
    imageGradient: "from-muted/15 via-cream to-pink-soft",
    variants: {
      sizes: ["One size"],
      colours: ["Natural", "Sage"],
    },
  },
  {
    id: "cl-hoodie",
    slug: "studio-lifestyle-hoodie",
    image: "/shop/studio-lifestyle-hoodie.svg",
    name: "Studio Lifestyle Hoodie",
    description:
      "Branded Wild Hearts hoodie — soft fleece for warm-ups and everyday wear.",
    category: "clothing",
    pricePence: 4800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-25T08:00:00.000Z",
    imageGradient: "from-sage/30 via-pink-soft to-cream",
    variants: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      colours: ["Sage", "Plum", "Cream"],
    },
  },
  {
    id: "cl-tote",
    slug: "branded-studio-tote",
    image: "/shop/branded-studio-tote.svg",
    name: "Branded Studio Tote",
    description:
      "Sturdy canvas tote with studio branding — kit bag for classes and life.",
    category: "clothing",
    pricePence: 1800,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-04-26T08:00:00.000Z",
    imageGradient: "from-pink-light via-surface to-sage-light",
    variants: {
      colours: ["Natural", "Dusty Pink"],
    },
  },

  // ── Category 5: Accessories (Coming soon) ───────────────────────────────
  {
    id: "ac-liquid-chalk",
    slug: "liquid-chalk",
    image: "/shop/liquid-chalk.svg",
    name: "Liquid Chalk Grip Aid",
    description:
      "Quick-dry liquid chalk for pole and aerial grip — sweat-resistant hold.",
    category: "accessories",
    pricePence: 1200,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-15T10:00:00.000Z",
    imageGradient: "from-cream via-pink-soft to-sage-light",
  },
  {
    id: "ac-rosin-sock",
    slug: "rosin-sock",
    image: "/shop/rosin-sock.svg",
    name: "Rosin Sock",
    description:
      "Mess-free rosin sock for aerial and pole grip — toss, catch, and go.",
    category: "accessories",
    pricePence: 600,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-15T12:00:00.000Z",
    imageGradient: "from-pink-soft via-cream to-background",
  },
  {
    id: "ac-dry-hands",
    slug: "dry-hands",
    image: "/shop/dry-hands.svg",
    name: "Dry Hands Grip Aid",
    description:
      "Classic dry-hands formula for maximum skin-to-pole friction.",
    category: "accessories",
    pricePence: 1400,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-16T10:00:00.000Z",
    imageGradient: "from-pink-soft via-background to-plum/10",
  },
  {
    id: "ac-wax",
    slug: "grip-enhancing-wax",
    image: "/shop/grip-enhancing-wax.svg",
    name: "Grip-Enhancing Wax",
    description:
      "Targeted grip wax for tricky holds — pocket-sized tin for your kit bag.",
    category: "accessories",
    pricePence: 1100,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-17T10:00:00.000Z",
    imageGradient: "from-sage-light via-cream to-pink-light",
  },
  {
    id: "ac-arnica",
    slug: "arnica-cream",
    image: "/shop/arnica-cream.svg",
    name: "Arnica Cream",
    description:
      "Soothing arnica cream for bruising after aerial and pole sessions.",
    category: "accessories",
    pricePence: 950,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-18T10:00:00.000Z",
    imageGradient: "from-brand/20 via-pink-soft to-surface",
  },
  {
    id: "ac-muscle-rub",
    slug: "muscle-rub",
    image: "/shop/muscle-rub.svg",
    name: "Muscle Rub",
    description:
      "Warming muscle rub for post-class recovery and tired shoulders.",
    category: "accessories",
    pricePence: 1050,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-19T10:00:00.000Z",
    imageGradient: "from-plum/15 via-cream to-sage-light",
  },
  {
    id: "ac-goggles",
    slug: "safety-goggles",
    image: "/shop/safety-goggles.svg",
    name: "Safety Goggles",
    description:
      "Protective goggles for creative workshops involving dust or fine materials.",
    category: "accessories",
    pricePence: 850,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-20T10:00:00.000Z",
    imageGradient: "from-muted/20 via-pink-soft to-background",
  },
  {
    id: "ac-mask",
    slug: "dust-mask",
    image: "/shop/dust-mask.svg",
    name: "Workshop Dust Mask",
    description:
      "Comfortable dust mask for creative arts workshops and sanding sessions.",
    category: "accessories",
    pricePence: 650,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-21T10:00:00.000Z",
    imageGradient: "from-sage/20 via-cream to-pink-soft",
  },
  {
    id: "ac-bottle",
    slug: "studio-water-bottle",
    image: "/shop/studio-water-bottle.svg",
    name: "Studio Water Bottle",
    description:
      "Branded insulated water bottle — keeps drinks cold through long sessions.",
    category: "accessories",
    pricePence: 2200,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-03-22T10:00:00.000Z",
    imageGradient: "from-pink-light via-sage-light to-cream",
  },

  // ── Category 6: Studio Snacks (Coming soon) ─────────────────────────────
  {
    id: "ss-bar",
    slug: "energy-bar",
    image: "/shop/energy-bar.svg",
    name: "Energy Bar",
    description:
      "Plant-based energy bar — a quick fuel-up between classes.",
    category: "studio-snacks",
    pricePence: 250,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-02-10T09:00:00.000Z",
    imageGradient: "from-brand/25 via-pink-soft to-cream",
  },
  {
    id: "ss-shake",
    slug: "protein-shake",
    image: "/shop/protein-shake.svg",
    name: "Protein Shake",
    description:
      "Ready-to-drink protein shake for post-class recovery.",
    category: "studio-snacks",
    pricePence: 350,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-02-11T09:00:00.000Z",
    imageGradient: "from-sage-light via-surface to-pink-light",
  },
  {
    id: "ss-electrolyte",
    slug: "electrolyte-water",
    image: "/shop/electrolyte-water.svg",
    name: "Electrolyte Water",
    description:
      "Lightly flavoured electrolyte water to rehydrate after sweaty sessions.",
    category: "studio-snacks",
    pricePence: 200,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-02-12T09:00:00.000Z",
    imageGradient: "from-cream via-pink-soft to-sage/20",
  },
  {
    id: "ss-refreshment",
    slug: "healthy-refreshment",
    image: "/shop/healthy-refreshment.svg",
    name: "Healthy Refreshment",
    description:
      "Seasonal healthy refreshment from our studio snack fridge.",
    category: "studio-snacks",
    pricePence: 300,
    isAvailable: false,
    digitalDelivery: false,
    createdAt: "2026-02-13T09:00:00.000Z",
    imageGradient: "from-pink-soft via-background to-plum/10",
  },
];

export type ShopSortOption = "newest" | "price-asc" | "price-desc";

/** Digital gift vouchers / e-gift cards that issue redeemable codes. */
export function isGiftVoucherProduct(product: Pick<ShopProduct, "digitalDelivery">) {
  return product.digitalDelivery;
}

export function getShopFulfillmentType(
  product: Pick<ShopProduct, "digitalDelivery">,
): "gift_card" | "physical" {
  return product.digitalDelivery ? "gift_card" : "physical";
}

export function slugifyProductName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function filterAndSortProducts({
  products,
  category,
  query,
  sort = "newest",
}: {
  products: ShopProduct[];
  category?: ShopCategoryId | "all";
  query?: string;
  sort?: ShopSortOption;
}) {
  const normalisedQuery = query?.trim().toLowerCase() ?? "";

  let result = products.filter((product) => {
    if (category && category !== "all" && product.category !== category) {
      return false;
    }
    if (!normalisedQuery) return true;
    return (
      product.name.toLowerCase().includes(normalisedQuery) ||
      product.description.toLowerCase().includes(normalisedQuery)
    );
  });

  result = [...result].sort((a, b) => {
    if (sort === "price-asc") return a.pricePence - b.pricePence;
    if (sort === "price-desc") return b.pricePence - a.pricePence;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return result;
}
