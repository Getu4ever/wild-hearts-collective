import { PrismaClient } from "@prisma/client";
import { seedDatabaseIfEmpty } from "../lib/seed-database";

const db = new PrismaClient();

async function main() {
  const result = await seedDatabaseIfEmpty(db);
  if (result.seeded) {
    console.log("Database seeded with classes and upcoming sessions.");
  } else {
    console.log(`Database ready — ${result.futureSessionCount} upcoming session(s) already exist.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
