import { db } from "@/lib/db";

export async function logAdminAction(input: {
  action: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
}) {
  await db.adminAuditLog.create({
    data: {
      action: input.action,
      targetUserId: input.targetUserId,
      details: input.details ? JSON.stringify(input.details) : null,
    },
  });
}
