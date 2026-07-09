import { PrismaClient } from "@prisma/client";
import { seedDatabaseIfEmpty, seedClassPacks } from "../lib/seed-database";

const db = new PrismaClient();

async function main() {
  const result = await seedDatabaseIfEmpty(db);
  await seedClassPacks(db);
  if (result.seeded) {
    console.log("Database seeded with classes and upcoming sessions.");
  } else {
    console.log(`Database ready — ${result.futureSessionCount} upcoming session(s) already exist.`);
  }
  console.log("Class packs seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
