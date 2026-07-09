import type { Metadata } from "next";
import BookingFormSection from "@/app/components/booking-form-section";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";

export const metadata: Metadata = {
  title: "Book a Class",
  description:
    "Book pole, aerial hoop, and aerial silks classes at Wild Hearts Collective.",
};

export default function BookPage() {
  return (
    <>
      <PageHero
        title="Book a Class"
        subtitle="Choose your session, pay your deposit or use class credits, and receive confirmation by email."
        image="classes"
      />

      <ContentSection className="bg-background">
        <SectionHeading
          title="Book your class"
          subtitle="Filter by class type, pick a time, and confirm your booking in a few steps. Members can pay with credits or a voucher code."
        />
        <div className="mt-10">
          <BookingFormSection />
        </div>
      </ContentSection>
    </>
  );
}
