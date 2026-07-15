import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const sql = neon(databaseUrl);

async function run(statement: string) {
  await sql.query(statement);
  console.log(`Applied: ${statement.split("\n")[0]}`);
}

async function runOptional(statement: string) {
  try {
    await run(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Skipped (optional): ${statement.split("\n")[0]} — ${message}`);
  }
}

async function main() {
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancellationType" TEXT',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paidWithCredit" BOOLEAN NOT NULL DEFAULT false',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "packPurchaseId" TEXT',
  );
  await run('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parQData" JSONB');

  await run(`
    CREATE TABLE IF NOT EXISTS "ClassPack" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "credits" INTEGER NOT NULL,
      "pricePence" INTEGER NOT NULL,
      "validDays" INTEGER NOT NULL DEFAULT 90,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClassPack_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ClassPack_slug_key" ON "ClassPack"("slug")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "ClassPackPurchase" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "packId" TEXT NOT NULL,
      "creditsGranted" INTEGER NOT NULL,
      "creditsRemaining" INTEGER NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "stripeSessionId" TEXT,
      "stripePaymentId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClassPackPurchase_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ClassPackPurchase_stripeSessionId_key" ON "ClassPackPurchase"("stripeSessionId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_userId_idx" ON "ClassPackPurchase"("userId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_status_idx" ON "ClassPackPurchase"("status")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_expiresAt_idx" ON "ClassPackPurchase"("expiresAt")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "CreditTransaction" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "purchaseId" TEXT,
      "bookingId" TEXT,
      "amount" INTEGER NOT NULL,
      "balanceAfter" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "CreditTransaction_bookingId_idx" ON "CreditTransaction"("bookingId")',
  );

  await run(
    'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER NOT NULL DEFAULT 100',
  );
  await run('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "usedAt" TIMESTAMP(3)');
  await run('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "bookingId" TEXT');
  await run('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "metadata" JSONB');
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Voucher_bookingId_key" ON "Voucher"("bookingId")',
  );

  await run(
    'ALTER TABLE "EngagementLog" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'pending\'',
  );
  await run('ALTER TABLE "EngagementLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB');
  await run(
    'ALTER TABLE "EngagementLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "EngagementLog_userId_type_idx" ON "EngagementLog"("userId", "type")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "EngagementLog_status_createdAt_idx" ON "EngagementLog"("status", "createdAt")',
  );

  await run('ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER NOT NULL DEFAULT 12');

  await run(`
    CREATE TABLE IF NOT EXISTS "Tutor" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "bio" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
    )
  `);
  await run('CREATE INDEX IF NOT EXISTS "Tutor_active_idx" ON "Tutor"("active")');

  await run('ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "tutorId" TEXT');
  await run('ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3)');
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'scheduled\'',
  );
  await run('ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT');
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await run('CREATE INDEX IF NOT EXISTS "Session_tutorId_idx" ON "Session"("tutorId")');
  await run('CREATE INDEX IF NOT EXISTS "Session_status_idx" ON "Session"("status")');

  await run(`
    CREATE TABLE IF NOT EXISTS "ParQResponse" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "data" JSONB NOT NULL DEFAULT '{}',
      "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ParQResponse_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ParQResponse_userId_key" ON "ParQResponse"("userId")',
  );
  await run('ALTER TABLE "ParQResponse" ADD COLUMN IF NOT EXISTS "data" JSONB');
  await run(
    'ALTER TABLE "ParQResponse" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP',
  );
  await run(
    'ALTER TABLE "ParQResponse" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await runOptional(
    'UPDATE "ParQResponse" SET "data" = "answers"::jsonb WHERE "data" IS NULL AND "answers" IS NOT NULL',
  );
  await run(
    'UPDATE "ParQResponse" SET "data" = \'{}\'::jsonb WHERE "data" IS NULL',
  );
  await runOptional(
    'UPDATE "ParQResponse" SET "submittedAt" = "completedAt" WHERE "submittedAt" IS NULL AND "completedAt" IS NOT NULL',
  );
  await run(
    'UPDATE "ParQResponse" SET "submittedAt" = "updatedAt" WHERE "submittedAt" IS NULL AND "updatedAt" IS NOT NULL',
  );
  await runOptional('ALTER TABLE "ParQResponse" ALTER COLUMN "answers" DROP NOT NULL');
  await run('ALTER TABLE "ParQResponse" ALTER COLUMN "data" SET NOT NULL');
  await runOptional(
    'UPDATE "User" u SET "parQCompletedAt" = p."completedAt" FROM "ParQResponse" p WHERE u."id" = p."userId" AND u."parQCompletedAt" IS NULL AND p."completedAt" IS NOT NULL',
  );
  await run(
    'UPDATE "User" u SET "parQData" = p."data" FROM "ParQResponse" p WHERE u."id" = p."userId" AND u."parQData" IS NULL AND p."data" IS NOT NULL',
  );

  await run(
    'ALTER TABLE "OAuthAccount" ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "GiftCard" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "initialBalancePence" INTEGER NOT NULL,
      "balancePence" INTEGER NOT NULL,
      "productId" TEXT,
      "productName" TEXT NOT NULL,
      "purchaserEmail" TEXT,
      "purchaserName" TEXT,
      "stripeSessionId" TEXT,
      "expiresAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
    )
  `);
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_code_key" ON "GiftCard"("code")');
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCard_stripeSessionId_idx" ON "GiftCard"("stripeSessionId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCard_balancePence_idx" ON "GiftCard"("balancePence")',
  );
  await run('CREATE INDEX IF NOT EXISTS "GiftCard_expiresAt_idx" ON "GiftCard"("expiresAt")');

  await run(`
    CREATE TABLE IF NOT EXISTS "GiftCardRedemption" (
      "id" TEXT NOT NULL,
      "giftCardId" TEXT NOT NULL,
      "amountPence" INTEGER NOT NULL,
      "balanceAfter" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "bookingId" TEXT,
      "packPurchaseId" TEXT,
      "userId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GiftCardRedemption_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCardRedemption_giftCardId_createdAt_idx" ON "GiftCardRedemption"("giftCardId", "createdAt")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCardRedemption_bookingId_idx" ON "GiftCardRedemption"("bookingId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCardRedemption_packPurchaseId_idx" ON "GiftCardRedemption"("packPurchaseId")',
  );

  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "giftCardId" TEXT',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "giftAmountApplied" INTEGER',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "Booking_giftCardId_idx" ON "Booking"("giftCardId")',
  );

  await run(
    'ALTER TABLE "ClassPackPurchase" ADD COLUMN IF NOT EXISTS "giftCardId" TEXT',
  );
  await run(
    'ALTER TABLE "ClassPackPurchase" ADD COLUMN IF NOT EXISTS "giftAmountApplied" INTEGER',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_giftCardId_idx" ON "ClassPackPurchase"("giftCardId")',
  );

  console.log("Schema sync complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
