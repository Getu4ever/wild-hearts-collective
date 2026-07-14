import type { Metadata } from "next";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { ShopStorefront } from "@/app/components/shop-storefront";
import { productsData } from "@/lib/shop-data";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Gift vouchers, aerial equipment, apparel, and studio essentials from Wild Hearts Collective. Digital e-vouchers available now.",
};

type ShopPageProps = {
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { cancelled } = await searchParams;

  return (
    <>
      <PageHero
        title="Shop"
        subtitle="Gift vouchers you can buy today — plus equipment, apparel, and studio essentials coming soon."
        image="shop"
      />

      <ContentSection className="bg-background">
        <SectionHeading
          title="Studio store"
          subtitle="Browse by category, add gift vouchers to your basket, then checkout securely with Stripe. Digital items arrive by email — everything else is Coming soon."
        />

        <div className="mt-10">
          <ShopStorefront
            products={productsData}
            cancelled={cancelled === "1"}
          />
        </div>
      </ContentSection>
    </>
  );
}
