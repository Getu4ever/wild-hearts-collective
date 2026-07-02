import { redirect } from "next/navigation";
import { MemberNav } from "@/app/components/member-nav";
import { getCurrentMember } from "@/lib/member-auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();

  if (!member) {
    redirect("/login?next=/account");
  }

  if (!member.emailVerified) {
    redirect(`/verify?email=${encodeURIComponent(member.email)}`);
  }

  return (
    <>
      <MemberNav member={member} />
      {children}
    </>
  );
}
