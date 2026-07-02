import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassDetailContent } from "@/app/components/class-detail-content";
import { PageHero } from "@/app/components/page-hero";
import { classes } from "@/lib/site-data";
import { classSlugToHero } from "@/lib/hero-images";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return classes.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const classItem = classes.find((item) => item.slug === slug);

  if (!classItem) {
    return { title: "Class Not Found" };
  }

  return {
    title: classItem.title,
    description: classItem.shortDescription,
  };
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const classItem = classes.find((item) => item.slug === slug);

  if (!classItem) {
    notFound();
  }

  const heroImage = classSlugToHero[classItem.slug] ?? classItem.imageKey;

  return (
    <>
      <PageHero
        title={classItem.title}
        subtitle={classItem.shortDescription}
        image={heroImage}
      />

      <ClassDetailContent classItem={classItem} />
    </>
  );
}
