import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

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
  { day: 2, hour: 18, minute: 0, classSlug: "pole", title: "Mixed Level Pole" },
  { day: 4, hour: 18, minute: 0, classSlug: "aerial-hoop", title: "Intro to Aerial Hoop" },
  { day: 4, hour: 19, minute: 15, classSlug: "aerial-silks", title: "Mixed Ability Aerial" },
  { day: 6, hour: 10, minute: 0, classSlug: "aerial-hoop", title: "Open Training" },
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

async function main() {
  await db.booking.deleteMany();
  await db.session.deleteMany();
  await db.class.deleteMany();

  for (const item of classSeed) {
    await db.class.create({ data: item });
  }

  const classes = await db.class.findMany();
  const classBySlug = Object.fromEntries(classes.map((c) => [c.slug, c]));

  for (let week = 0; week < 6; week += 1) {
    for (const template of sessionTemplates) {
      const classRecord = classBySlug[template.classSlug];
      if (!classRecord) continue;

      await db.session.create({
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

  console.log("Database seeded with classes and upcoming sessions.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
