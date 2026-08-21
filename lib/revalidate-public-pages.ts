import { revalidatePath } from "next/cache";

/** Bust cached membership and class-pack surfaces after admin pricing edits. */
export function revalidateMembershipPricingPages() {
  revalidatePath("/membership");
  revalidatePath("/account/credits");
  revalidatePath("/api/bundles");
}

/** Bust homepage marketing timetable after Admin → Timetable saves. */
export function revalidateMarketingTimetablePages() {
  revalidatePath("/");
}

/** Bust shop storefront after category or catalog changes. */
export function revalidateShopCatalogPages() {
  revalidatePath("/shop");
}
