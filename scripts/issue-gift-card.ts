/**
 * Manually issue or top-up a redeemable gift card (ops / recovery).
 *
 * Usage:
 *   npx tsx scripts/issue-gift-card.ts GIFT-ABC12345 2500 "E-Gift Card — £25"
 *
 * Amount is in pence (2500 = £25.00).
 */
import { config } from "dotenv";
import { formatMoneyFromPence } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { issueGiftCard } from "@/lib/gift-card-service";

config({ path: ".env.local" });
config();

async function main() {
  const [code, amountRaw, ...nameParts] = process.argv.slice(2);
  const balancePence = Number.parseInt(amountRaw ?? "", 10);
  const productName = nameParts.join(" ").trim() || "E-Gift Card";

  if (!code || !Number.isFinite(balancePence) || balancePence <= 0) {
    console.error(
      'Usage: npx tsx scripts/issue-gift-card.ts GIFT-XXXXXXXX 2500 "E-Gift Card — £25"',
    );
    process.exit(1);
  }

  const normalised = code.trim().toUpperCase();
  const existing = await db.giftCard.findUnique({ where: { code: normalised } });

  if (existing) {
    console.log(
      `Gift card ${existing.code} already exists with balance ${formatMoneyFromPence(existing.balancePence)}.`,
    );
    process.exit(0);
  }

  const card = await issueGiftCard({
    code: normalised,
    balancePence,
    productName,
  });

  console.log(
    `Issued ${card.code} with ${formatMoneyFromPence(card.balancePence)} balance (expires ${card.expiresAt?.toISOString() ?? "never"}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
