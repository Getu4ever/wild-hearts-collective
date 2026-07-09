import { notifyAdminOfNewMember } from "@/lib/member-notifications";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";
import { db } from "@/lib/db";

type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
};

type GoogleUserResult = {
  user: Awaited<ReturnType<typeof db.user.update>>;
  isNew: boolean;
};

function resolveProfileImage(currentImage: string | null, googlePicture?: string) {
  if (currentImage?.startsWith("data:")) {
    return currentImage;
  }

  return googlePicture ?? currentImage;
}

export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<GoogleUserResult> {
  const email = profile.email.trim().toLowerCase();

  const existingAccount = await db.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.id,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    const user = await db.user.update({
      where: { id: existingAccount.userId },
      data: {
        name: profile.name || existingAccount.user.name,
        image: resolveProfileImage(existingAccount.user.image, profile.picture),
        emailVerifiedAt: existingAccount.user.emailVerifiedAt ?? new Date(),
      },
    });

    if (profile.picture) {
      await db.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: { profileImageUrl: profile.picture },
      });
    }

    return { user, isNew: false };
  }

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    await db.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider: "google",
        providerAccountId: profile.id,
        profileImageUrl: profile.picture ?? null,
      },
    });

    const user = await db.user.update({
      where: { id: existingUser.id },
      data: {
        name: profile.name || existingUser.name,
        image: resolveProfileImage(existingUser.image, profile.picture),
        emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
      },
    });

    if (profile.picture) {
      await db.oAuthAccount.updateMany({
        where: { userId: existingUser.id, provider: "google" },
        data: { profileImageUrl: profile.picture },
      });
    }

    return { user, isNew: false };
  }

  const user = await db.user.create({
    data: {
      email,
      name: profile.name || email.split("@")[0] || "Member",
      image: profile.picture,
      emailVerifiedAt: profile.verified_email === false ? null : new Date(),
      membershipPlan: MEMBERSHIP_PLAN.account,
      membershipStatus: MEMBERSHIP_STATUS.active,
      oauthAccounts: {
        create: {
          provider: "google",
          providerAccountId: profile.id,
          profileImageUrl: profile.picture ?? null,
        },
      },
    },
  });

  await Promise.all([
    db.booking.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    }),
    db.waitlistEntry.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    }),
  ]);

  await notifyAdminOfNewMember({
    name: user.name,
    email: user.email,
    phone: user.phone,
    signupMethod: "google",
    emailVerified: Boolean(user.emailVerifiedAt),
  });

  return { user, isNew: true };
}
