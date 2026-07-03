import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/profile-config";

export type ProfileUserRecord = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  dateOfBirth: Date | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  injuriesLimitations: string | null;
  allergiesSafetyAlerts: string | null;
  safetyConsentAt: Date | null;
  experienceLevel: string | null;
  disciplineInterests: string | null;
  notificationPreferences: string | null;
  membershipPlan: string;
  membershipStatus: string;
  accountStatus: string;
  membershipStartedAt: Date | null;
  membershipRenewsAt: Date | null;
  membershipPausedAt: Date | null;
  membershipResumeAt: Date | null;
  membershipCancelledAt: Date | null;
  cancellationReason: string | null;
  creditsRemaining: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
};

export type MemberProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  dateOfBirth: string | null;
  emergencyContact: {
    name: string | null;
    relationship: string | null;
    phone: string | null;
  };
  healthSafety: {
    medicalNotes: string | null;
    injuriesLimitations: string | null;
    allergiesSafetyAlerts: string | null;
    safetyConsentAt: string | null;
  };
  experienceLevel: string | null;
  disciplineInterests: string[];
  notificationPreferences: NotificationPreferences;
  membership: {
    plan: string;
    status: string;
    accountStatus: string;
    startedAt: string | null;
    renewsAt: string | null;
    pausedAt: string | null;
    resumeAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    creditsRemaining: number;
    hasStripeSubscription: boolean;
  };
  profileCompletion: {
    percent: number;
    missingSteps: string[];
  };
  createdAt: string;
};

function parseJsonArray(value: string | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function parseNotificationPreferences(value: string | null): NotificationPreferences {
  if (!value) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function serializeNotificationPreferences(prefs: NotificationPreferences) {
  return JSON.stringify(prefs);
}

export function serializeDisciplineInterests(interests: string[]) {
  return JSON.stringify(interests);
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function calculateProfileCompletion(user: ProfileUserRecord) {
  const steps: { id: string; label: string; complete: boolean }[] = [
    { id: "photo", label: "Add a profile photo", complete: Boolean(user.image) },
    { id: "phone", label: "Add your phone number", complete: Boolean(user.phone) },
    {
      id: "emergency",
      label: "Add an emergency contact",
      complete: Boolean(user.emergencyContactName && user.emergencyContactPhone),
    },
    {
      id: "experience",
      label: "Set your experience level",
      complete: Boolean(user.experienceLevel),
    },
    {
      id: "interests",
      label: "Choose your discipline interests",
      complete: parseJsonArray(user.disciplineInterests).length > 0,
    },
    {
      id: "safety",
      label: "Review health & safety information",
      complete: Boolean(user.safetyConsentAt),
    },
  ];

  const completeCount = steps.filter((step) => step.complete).length;
  const percent = Math.round((completeCount / steps.length) * 100);

  return {
    percent,
    missingSteps: steps.filter((step) => !step.complete).map((step) => step.label),
  };
}

export function toMemberProfile(user: ProfileUserRecord): MemberProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    image: user.image,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    emergencyContact: {
      name: user.emergencyContactName,
      relationship: user.emergencyContactRelationship,
      phone: user.emergencyContactPhone,
    },
    healthSafety: {
      medicalNotes: user.medicalNotes,
      injuriesLimitations: user.injuriesLimitations,
      allergiesSafetyAlerts: user.allergiesSafetyAlerts,
      safetyConsentAt: toIso(user.safetyConsentAt),
    },
    experienceLevel: user.experienceLevel,
    disciplineInterests: parseJsonArray(user.disciplineInterests),
    notificationPreferences: parseNotificationPreferences(user.notificationPreferences),
    membership: {
      plan: user.membershipPlan,
      status: user.membershipStatus,
      accountStatus: user.accountStatus,
      startedAt: toIso(user.membershipStartedAt ?? user.createdAt),
      renewsAt: toIso(user.membershipRenewsAt),
      pausedAt: toIso(user.membershipPausedAt),
      resumeAt: toIso(user.membershipResumeAt),
      cancelledAt: toIso(user.membershipCancelledAt),
      cancellationReason: user.cancellationReason,
      creditsRemaining: user.creditsRemaining,
      hasStripeSubscription: Boolean(user.stripeSubscriptionId),
    },
    profileCompletion: calculateProfileCompletion(user),
    createdAt: user.createdAt.toISOString(),
  };
}

export const profileSelectFields = {
  id: true,
  email: true,
  name: true,
  phone: true,
  image: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  dateOfBirth: true,
  emergencyContactName: true,
  emergencyContactRelationship: true,
  emergencyContactPhone: true,
  medicalNotes: true,
  injuriesLimitations: true,
  allergiesSafetyAlerts: true,
  safetyConsentAt: true,
  experienceLevel: true,
  disciplineInterests: true,
  notificationPreferences: true,
  membershipPlan: true,
  membershipStatus: true,
  accountStatus: true,
  membershipStartedAt: true,
  membershipRenewsAt: true,
  membershipPausedAt: true,
  membershipResumeAt: true,
  membershipCancelledAt: true,
  cancellationReason: true,
  creditsRemaining: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  createdAt: true,
} as const;
