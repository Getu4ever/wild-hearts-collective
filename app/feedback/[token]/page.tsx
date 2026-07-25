import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassFeedbackForm } from "@/app/components/class-feedback-form";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { getFeedbackByToken } from "@/lib/class-feedback-service";

export const metadata: Metadata = {
  title: "Class feedback",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function FeedbackPage({ params }: PageProps) {
  const { token } = await params;
  let feedback;
  try {
    feedback = await getFeedbackByToken(token);
  } catch {
    notFound();
  }

  if (!feedback) notFound();

  return (
    <>
      <PageHero
        title="Class feedback"
        subtitle="Tell us how your first lesson went — it helps us keep improving."
        image="contact"
      />
      <ContentSection>
        <div className="mx-auto max-w-xl">
          <ClassFeedbackForm
            token={feedback.token}
            name={feedback.name}
            classTitle={feedback.classTitle}
            alreadySubmitted={Boolean(feedback.submittedAt)}
          />
        </div>
      </ContentSection>
    </>
  );
}
