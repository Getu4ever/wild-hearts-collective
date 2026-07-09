import { requiresParQ } from "@/lib/booking-advanced-config";
import { db } from "@/lib/db";

export type ParQFormData = {
  hasHeartCondition: boolean;
  hasChestPain: boolean;
  hasBoneJointProblem: boolean;
  hasHighBloodPressure: boolean;
  hasOtherMedicalReason: boolean;
  isPregnant: boolean;
  additionalNotes?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  consentGiven: boolean;
};

export class ParQRequiredError extends Error {
  constructor(message = "Please complete your PAR-Q health questionnaire before booking aerial or pole classes.") {
    super(message);
    this.name = "ParQRequiredError";
  }
}

export async function getParQStatus(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      parQCompletedAt: true,
      parQData: true,
      parQResponse: { select: { submittedAt: true, data: true } },
    },
  });

  if (!user) return null;

  return {
    completed: Boolean(user.parQCompletedAt),
    completedAt: user.parQCompletedAt?.toISOString() ?? null,
    data: user.parQData ?? user.parQResponse?.data ?? null,
  };
}

export async function submitParQ(userId: string, data: ParQFormData) {
  if (!data.consentGiven) {
    throw new Error("You must confirm your consent to submit the PAR-Q form.");
  }

  if (!data.emergencyContactName.trim() || !data.emergencyContactPhone.trim()) {
    throw new Error("Emergency contact details are required.");
  }

  const now = new Date();
  const payload = {
    ...data,
    additionalNotes: data.additionalNotes?.trim() || null,
    emergencyContactName: data.emergencyContactName.trim(),
    emergencyContactPhone: data.emergencyContactPhone.trim(),
  };

  return db.$transaction(async (tx) => {
    await tx.parQResponse.upsert({
      where: { userId },
      create: { userId, data: payload },
      update: { data: payload },
    });

    return tx.user.update({
      where: { id: userId },
      data: {
        parQCompletedAt: now,
        parQData: payload,
        emergencyContactName: payload.emergencyContactName,
        emergencyContactPhone: payload.emergencyContactPhone,
      },
      select: {
        id: true,
        parQCompletedAt: true,
      },
    });
  });
}

export async function assertParQCompleteForClass(userId: string | null, classSlug: string) {
  if (!userId || !requiresParQ(classSlug)) {
    return;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { parQCompletedAt: true },
  });

  if (!user?.parQCompletedAt) {
    throw new ParQRequiredError();
  }
}

export async function assertParQCompleteForSession(userId: string | null, sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { class: { select: { slug: true } } },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  await assertParQCompleteForClass(userId, session.class.slug);
}
