import type { Metadata } from "next";
import { MemberProfileForm } from "@/app/components/member-profile-form";
import { getCurrentMember } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function AccountProfilePage() {
  const member = await getCurrentMember();
  if (!member) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h2 className="font-display text-3xl text-plum">Profile</h2>
      <p className="mt-2 text-sm text-muted">
        Update your contact details and password.
      </p>

      <div className="mt-8 rounded-sm border border-plum/10 bg-surface p-6">
        <MemberProfileForm member={member} />
      </div>
    </div>
  );
}
