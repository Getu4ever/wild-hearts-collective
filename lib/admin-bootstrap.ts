import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { hashPassword } from "@/lib/password";

function bootstrapEmail() {
  return (
    process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() ||
    process.env.STUDIO_EMAIL?.trim().toLowerCase() ||
    "hello@wildheartscollective.org"
  );
}

let bootstrapPromise: Promise<void> | null = null;

/** Create the first master admin from env if the staff table is empty. */
export async function ensureBootstrapAdmin() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        const count = await db.adminUser.count();
        if (count > 0) return;

        const password = process.env.ADMIN_PASSWORD?.trim();
        if (!password) return;

        const email = bootstrapEmail();
        await db.adminUser.create({
          data: {
            email,
            name: "Master admin",
            passwordHash: hashPassword(password),
            role: ADMIN_ROLES.master,
            permissions: Prisma.DbNull,
            active: true,
          },
        });
        console.info(`[admin] Bootstrapped master admin ${email}`);
      } catch (error) {
        bootstrapPromise = null;
        console.error("[admin] bootstrap failed:", error);
      }
    })();
  }

  await bootstrapPromise;
}
