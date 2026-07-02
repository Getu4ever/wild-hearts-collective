import type { Metadata } from "next";
import { ContactForm } from "@/app/components/contact-form";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { contact } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Wild Hearts Collective about classes, parties, studio hire, and more.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you. Get in touch about classes, parties, or hire."
        image="contact"
      />

      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading title="Get in touch" />
            <ProseBlock>
              <p>
                Whether you&apos;re booking your first class, planning a party,
                or enquiring about studio hire, our team is here to help.
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                <br />
                <strong>Phone:</strong> {contact.phone}
                <br />
                <strong>Address:</strong> {contact.address}
              </p>
            </ProseBlock>
          </div>

          <ContactForm />
        </div>
      </ContentSection>
    </>
  );
}
