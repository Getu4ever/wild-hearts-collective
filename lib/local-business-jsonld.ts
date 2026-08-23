import { LIVE_SITE_URL } from "@/lib/booking-config";
import { contact, socialLinks } from "@/lib/site-data";

const SITE_URL = LIVE_SITE_URL.replace(/\/$/, "");

export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${SITE_URL}/#business`,
    name: contact.name,
    url: SITE_URL,
    telephone: "+441158718090",
    email: contact.email,
    image: `${SITE_URL}/logo/logo-email-green.png`,
    description:
      "Inclusive aerial and pole studio in Mansfield offering pole, hoop, silks, and creative arts for all ages, abilities, and backgrounds.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Unit 25, Block 7 Hallam Way, Old Mill Lane Industrial Estate",
      addressLocality: "Mansfield",
      postalCode: "NG19 9BG",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.latitude,
      longitude: contact.longitude,
    },
    hasMap: contact.mapsUrl,
    sameAs: [contact.googleBusinessUrl, ...socialLinks.map((link) => link.href)],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "09:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "16:00",
        closes: "21:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Friday",
        opens: "17:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "16:00",
      },
    ],
  };
}
