import { revalidatePath } from "next/cache";

/** Bust cached membership and class-pack surfaces after admin pricing edits. */
export function revalidateMembershipPricingPages() {
  revalidatePath("/membership");
  revalidatePath("/account/credits");
  revalidatePath("/api/bundles");
}
