import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParQForm } from "@/app/components/parq-form";
import { ContentSection } from "@/app/components/content-section";
import { SectionHeading } from "@/app/components/section-heading";
import { getParQStatus } from "@/lib/parq-service";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Health questionnaire (PAR-Q)",
  robots: { index: false, follow: false },
};

export default async function ParQPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/account/parq");

  const status = await getParQStatus(session.userId);

  return (
    <ContentSection>
      <SectionHeading
        title="Health questionnaire"
        subtitle="Required before booking pole, aerial hoop, or aerial silks classes."
      />
      <div className="mt-10 max-w-3xl">
        <ParQForm completed={status?.completed} />
      </div>
    </ContentSection>
  );
}
