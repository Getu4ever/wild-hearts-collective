import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

const classSeed = [
  {
    slug: "pole",
    title: "Pole Dancing",
    description:
      "Build strength, flow, and confidence in a supportive studio environment for all levels.",
  },
  {
    slug: "aerial-hoop",
    title: "Aerial Hoop",
    description:
      "Learn beautiful poses, spins, and transitions on the hoop with fully qualified instructors.",
  },
  {
    slug: "aerial-silks",
    title: "Aerial Silks",
    description:
      "Climb, wrap, and create stunning lines with step-by-step instruction from certified teachers.",
  },
];

const sessionTemplates = [
  { day: 2, hour: 18, minute: 0, classSlug: "pole" },
  { day: 4, hour: 18, minute: 0, classSlug: "aerial-hoop" },
  { day: 4, hour: 19, minute: 15, classSlug: "aerial-silks" },
  { day: 6, hour: 10, minute: 0, classSlug: "aerial-hoop" },
];

function nextDateForWeekday(day: number, hour: number, minute: number, weeksAhead: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  const currentDay = date.getDay();
  let daysUntil = (day - currentDay + 7) % 7;
  if (daysUntil === 0 && date <= new Date()) {
    daysUntil = 7;
  }
  date.setDate(date.getDate() + daysUntil + weeksAhead * 7);
  return date;
}

export async function seedDatabaseIfEmpty(client: PrismaClient) {
  for (const item of classSeed) {
    await client.class.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
      },
      create: item,
    });
  }

  const futureSessionCount = await client.session.count({
    where: { startsAt: { gte: new Date() } },
  });

  if (futureSessionCount > 0) {
    return { seeded: false, futureSessionCount };
  }

  const classes = await client.class.findMany();
  const classBySlug = Object.fromEntries(classes.map((item) => [item.slug, item]));

  for (let week = 0; week < 6; week += 1) {
    for (const template of sessionTemplates) {
      const classRecord = classBySlug[template.classSlug];
      if (!classRecord) continue;

      await client.session.create({
        data: {
          classId: classRecord.id,
          startsAt: nextDateForWeekday(
            template.day,
            template.hour,
            template.minute,
            week,
          ),
          capacity: template.classSlug === "pole" ? 10 : 12,
        },
      });
    }
  }

  return { seeded: true, futureSessionCount: sessionTemplates.length * 6 };
}

let seedPromise: Promise<void> | null = null;

export async function ensureSeededDatabase() {
  if (!seedPromise) {
    seedPromise = seedDatabaseIfEmpty(db).then(() => undefined);
  }

  await seedPromise;
}
