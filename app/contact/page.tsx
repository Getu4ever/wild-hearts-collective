import type { Metadata } from "next";
import Link from "next/link";
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
              </p>
              <p>
                <strong>Address:</strong>
                <br />
                {contact.addressLines.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
                <Link
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-semibold text-brand hover:underline"
                >
                  Open in Google Maps
                </Link>
              </p>
            </ProseBlock>
          </div>

          <ContactForm />
        </div>
      </ContentSection>

      <ContentSection className="bg-background">
        <SectionHeading
          title="Find us"
          subtitle="Visit our studio at Old Mill Lane Industrial Estate, Mansfield."
        />
        <div className="mt-8 overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm">
          <iframe
            title="Wild Hearts Collective on Google Maps"
            src={contact.mapsEmbedUrl}
            className="aspect-[16/10] w-full border-0 sm:aspect-[21/9]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {contact.address} ·{" "}
          <Link
            href={contact.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand hover:underline"
          >
            Get directions
          </Link>
        </p>
      </ContentSection>
    </>
  );
}
