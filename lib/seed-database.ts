import type { PrismaClient } from "@prisma/client";
import { CLASS_TYPE_OPTIONS } from "@/lib/admin-studio-config";
import { UK_TIMEZONE, ukLocalToUtc } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { seedShopProductsIfEmpty } from "@/lib/shop-catalog-service";

/** Marketing/copy descriptions keyed by class slug (capacity/duration come from CLASS_TYPE_OPTIONS). */
const classDescriptions: Record<string, string> = {
  pole: "Build strength, flow, and confidence in a supportive studio environment for all levels.",
  "aerial-hoop":
    "Learn beautiful poses, spins, and transitions on the hoop with our fully qualified and experienced instructors.",
  "aerial-silks":
    "Climb, wrap, and create stunning lines with step-by-step instruction from certified teachers.",
  family:
    "Fun, inclusive sessions for families to move, play, and connect together with our DBS-checked team.",
  teens:
    "Supportive teen classes building strength, self-belief, and creativity with friends.",
  children:
    "Age-appropriate movement and creative play with our qualified, experienced, and DBS-checked instructors.",
  "aerial-workshops":
    "In-house and guest aerial workshops carefully selected to complement our timetable.",
  "pole-workshops":
    "In-house and guest pole workshops carefully selected to complement our timetable.",
  "creative-arts-workshops":
    "Expressive workshops blending movement, creativity, and community in a welcoming studio space.",
  "beginner-courses":
    "Fixed-term beginner courses booked and paid in full for the full four-week block.",
};

/**
 * Upsert every studio class type from CLASS_TYPE_OPTIONS so admin scheduling
 * and booking always have the full service list (including newer offerings).
 */
export async function ensureStudioClassTypes(client: PrismaClient = db) {
  for (const option of CLASS_TYPE_OPTIONS) {
    const description =
      classDescriptions[option.slug] ??
      `${option.title} at Wild Hearts Collective.`;

    // Only seed missing class types — do not overwrite admin edits to
    // description, duration, capacity, price, or credit cost.
    await client.class.upsert({
      where: { slug: option.slug },
      update: {
        title: option.title,
      },
      create: {
        slug: option.slug,
        title: option.title,
        description,
        maxCapacity: option.maxCapacity,
        duration: option.defaultDuration,
        creditCost: 1,
      },
    });
  }
}

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
  await ensureStudioClassTypes(client);

  const futureSessionCount = await client.session.count({
    where: { startsAt: { gte: new Date() } },
  });

  // Never auto-create sample bookable sessions. After go-live cleanup the
  // schedule must stay empty until the studio adds real classes in Admin.
  // Set SEED_DEMO_SESSIONS=true only for local demos.
  if (futureSessionCount > 0 || process.env.SEED_DEMO_SESSIONS !== "true") {
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
    slug: "4-class-pack",
    name: "4-Class Pack",
    description: "Ideal for regular movers who want a flexible bundle of studio credits.",
    credits: 4,
    pricePence: 4400,
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
