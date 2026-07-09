import type { Metadata } from "next";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for Wild Hearts Collective classes and bookings.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms & Conditions"
        subtitle="Booking policies, health and safety, and studio guidelines."
        image="terms"
      />

      <ContentSection>
        <SectionHeading title="Booking & cancellation" />
        <ProseBlock>
          <p>
            All classes must be booked in advance through this website. The full
            class fee is paid online when you book. Cancellation policies will be
            confirmed at the time of booking.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Health & safety" />
        <ProseBlock>
          <p>
            Participants must complete any required health forms before
            attending. Please inform your instructor of any injuries or medical
            conditions. Wild Hearts Collective reserves the right to refuse
            participation if safety cannot be assured.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Studio rules" />
        <ProseBlock>
          <p>
            Please arrive 5–10 minutes before class. Appropriate clothing is
            required. The studio must be kept clean and equipment treated with
            care. Full terms will be provided to members upon joining.
          </p>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
