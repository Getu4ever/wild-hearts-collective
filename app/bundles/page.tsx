import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/member-auth";

export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const session = await getMemberSession();
  redirect(session ? "/account/credits" : "/login?next=/account/credits");
}
