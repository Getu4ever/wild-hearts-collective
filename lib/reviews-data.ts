import { formatUkDateShort } from "@/lib/booking-config";
import { db } from "@/lib/db";

export type PublicSiteReview = {
  id: string;
  displayName: string;
  rating: number;
  comments: string;
  classTitle: string | null;
  submittedAtLabel: string | null;
  source: "member" | "featured";
};

/** Featured quotes shown until member opt-in reviews are available. */
export const featuredSiteReviews: PublicSiteReview[] = [
  {
    id: "featured-1",
    displayName: "Emma",
    rating: 5,
    comments:
      "I was nervous about starting pole, but the instructors made me feel welcome from the first warm-up. Clear progressions, genuine encouragement, and a room full of people cheering each other on — I left smiling every week.",
    classTitle: "Pole",
    submittedAtLabel: null,
    source: "featured",
  },
  {
    id: "featured-2",
    displayName: "Jordan",
    rating: 5,
    comments:
      "Wild Hearts feels like a proper community, not just a fitness class. Aerial hoop has challenged me in the best way, and the teaching is careful, skilled, and never judgemental. Highly recommend for anyone curious about aerial.",
    classTitle: "Aerial Hoop",
    submittedAtLabel: null,
    source: "featured",
  },
  {
    id: "featured-3",
    displayName: "Priya",
    rating: 5,
    comments:
      "As a complete beginner I never felt left behind. The studio is inclusive, the space is beautiful, and the team genuinely care about safety and confidence. Booking online was easy and the whole experience felt professional and warm.",
    classTitle: "Aerial Silks",
    submittedAtLabel: null,
    source: "featured",
  },
  {
    id: "featured-4",
    displayName: "Sam",
    rating: 5,
    comments:
      "We booked a party for a friend’s birthday and it was a highlight of the year. Organised, fun, and perfectly pitched for mixed abilities. The studio hire and party team made everything simple from enquiry to the day itself.",
    classTitle: "Parties & events",
    submittedAtLabel: null,
    source: "featured",
  },
];

function feedbackClient() {
  if (!("classFeedback" in db) || !db.classFeedback) {
    return null;
  }
  return db.classFeedback;
}

/** First name + optional last initial for public display. */
export function formatReviewDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Studio friend";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Member feedback submitted with “share on website” opted in.
 * Falls back to featured quotes when none are available yet.
 */
export async function listPublicSiteReviews(limit = 24): Promise<PublicSiteReview[]> {
  const client = feedbackClient();
  if (!client) return featuredSiteReviews;

  try {
    const rows = await client.findMany({
      where: {
        shareOnWebsite: true,
        submittedAt: { not: null },
        comments: { not: null },
        rating: { gte: 1 },
      },
      orderBy: { submittedAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        rating: true,
        comments: true,
        classTitle: true,
        submittedAt: true,
      },
    });

    const memberReviews: PublicSiteReview[] = [];
    for (const row of rows) {
      const comments = row.comments?.trim() ?? "";
      if (!comments || row.rating == null) continue;
      memberReviews.push({
        id: row.id,
        displayName: formatReviewDisplayName(row.name),
        rating: row.rating,
        comments,
        classTitle: row.classTitle,
        submittedAtLabel: row.submittedAt
          ? formatUkDateShort(row.submittedAt)
          : null,
        source: "member",
      });
    }

    if (memberReviews.length === 0) return featuredSiteReviews;
    return memberReviews;
  } catch (error) {
    console.error("[reviews] failed to load public feedback:", error);
    return featuredSiteReviews;
  }
}
