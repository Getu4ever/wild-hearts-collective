import type { Metadata } from "next";
import { Raleway, Satisfy } from "next/font/google";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import "./globals.css";

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: ["400"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Wild Hearts Collective | Inclusive Aerial & Pole Studio",
    template: "%s | Wild Hearts Collective",
  },
  description:
    "A joyful, inclusive aerial and pole studio offering pole, hoop, silks, and creative arts for all ages, abilities, and backgrounds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satisfy.variable} ${raleway.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col font-body">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
