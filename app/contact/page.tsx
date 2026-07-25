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

const phoneHref = `tel:${contact.phone.replace(/\s/g, "")}`;

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
                <strong>Phone:</strong>{" "}
                <a href={phoneHref}>{contact.phone}</a>
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
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href={contact.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand hover:underline"
                  >
                    Open in Google Maps
                  </Link>
                  <Link
                    href={contact.openStreetMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand hover:underline"
                  >
                    Open in OpenStreetMap
                  </Link>
                </span>
              </p>
            </ProseBlock>
          </div>

          <ContactForm />
        </div>
      </ContentSection>

      <ContentSection className="bg-white">
        <SectionHeading
          title="Find us"
          subtitle="Visit our studio at Old Mill Lane Industrial Estate, Mansfield — pinned below."
        />
        <div className="mt-8 overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm">
          <iframe
            title="Wild Hearts Collective studio location"
            src={contact.mapsEmbedUrl}
            className="aspect-[16/10] w-full border-0 sm:aspect-[21/9]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {contact.address}
        </p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm">
          <Link
            href={contact.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand hover:underline"
          >
            Get directions (Google)
          </Link>
          <Link
            href={contact.openStreetMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand hover:underline"
          >
            View pin (OpenStreetMap)
          </Link>
        </p>
      </ContentSection>
    </>
  );
}
