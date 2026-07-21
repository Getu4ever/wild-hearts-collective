import type { PrismaClient } from "@prisma/client";
import { UK_TIMEZONE, ukLocalToUtc } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { seedShopProductsIfEmpty } from "@/lib/shop-catalog-service";

const classSeed = [
  {
    slug: "pole",
    title: "Pole Dancing",
    description:
      "Build strength, flow, and confidence in a supportive studio environment for all levels.",
    maxCapacity: 12,
  },
  {
    slug: "aerial-hoop",
    title: "Aerial Hoop",
    description:
      "Learn beautiful poses, spins, and transitions on the hoop with fully qualified instructors.",
    maxCapacity: 10,
  },
  {
    slug: "aerial-silks",
    title: "Aerial Silks",
    description:
      "Climb, wrap, and create stunning lines with step-by-step instruction from certified teachers.",
    maxCapacity: 10,
  },
  {
    slug: "creative-arts-workshops",
    title: "Creative Arts Workshops",
    description:
      "Expressive workshops blending movement, creativity, and community in a welcoming studio space.",
    maxCapacity: 15,
  },
];

const sessionTemplates = [
  { day: 2, hour: 18, minute: 0, classSlug: "pole" },
  { day: 4, hour: 18, minute: 0, classSlug: "aerial-hoop" },
  { day: 4, hour: 19, minute: 15, classSlug: "aerial-silks" },
  { day: 6, hour: 10, minute: 0, classSlug: "aerial-hoop" },
];

function getUkYmd(date: Date) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: UK_TIMEZONE,
  })
    .format(date)
    .split("-")
    .map(Number);

  return { year, month, day };
}

function getUkWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? 0;
}

function getUkMinutes(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UK_TIMEZONE,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return Number(parts.hour) * 60 + Number(parts.minute);
}

function nextDateForWeekday(day: number, hour: number, minute: number, weeksAhead: number) {
  const now = new Date();
  const { year, month, day: todayDay } = getUkYmd(now);
  const currentDay = getUkWeekday(now);

  let daysUntil = (day - currentDay + 7) % 7;
  if (daysUntil === 0 && getUkMinutes(now) >= hour * 60 + minute) {
    daysUntil = 7;
  }

  const totalDays = daysUntil + weeksAhead * 7;
  const target = new Date(Date.UTC(year, month - 1, todayDay + totalDays, 12));
  const { year: targetYear, month: targetMonth, day: targetDay } = getUkYmd(target);

  return ukLocalToUtc(targetYear, targetMonth, targetDay, hour, minute);
}

export async function seedDatabaseIfEmpty(client: PrismaClient) {
  for (const item of classSeed) {
    await client.class.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        maxCapacity: item.maxCapacity,
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

const classPackSeed = [
  {
    slug: "5-class-pack",
    name: "5-Class Pack",
    description: "Ideal for regular movers who want a flexible bundle of studio credits.",
    credits: 5,
    pricePence: 4500,
    validDays: 90,
    sortOrder: 1,
  },
  {
    slug: "10-class-pack",
    name: "10-Class Pack",
    description: "Best value for committed students booking multiple classes each month.",
    credits: 10,
    pricePence: 8500,
    validDays: 120,
    sortOrder: 2,
  },
];

export async function seedClassPacks(client: PrismaClient) {
  for (const pack of classPackSeed) {
    await client.classPack.upsert({
      where: { slug: pack.slug },
      // Preserve admin edits — only create missing default packs.
      update: {},
      create: { ...pack, active: true },
    });
  }
}

let seedPromise: Promise<void> | null = null;

export async function ensureSeededDatabase() {
  if (!seedPromise) {
    seedPromise = seedDatabaseIfEmpty(db)
      .then(async () => {
        await seedClassPacks(db);
        await seedShopProductsIfEmpty();
      })
      .catch((error) => {
        seedPromise = null;
        throw error;
      });
  }

  await seedPromise;
}
