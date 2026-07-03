export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
] as const;

export const DISCIPLINE_INTERESTS = [
  { id: "pole", label: "Pole" },
  { id: "aerial-hoop", label: "Aerial Hoop" },
  { id: "silks", label: "Silks" },
  { id: "flexibility", label: "Flexibility" },
  { id: "creative-workshops", label: "Creative Workshops" },
] as const;

export const NOTIFICATION_KEYS = [
  { id: "classReminders", label: "Class reminders" },
  { id: "scheduleChanges", label: "Schedule changes" },
  { id: "membershipRenewals", label: "Membership renewals" },
  { id: "marketing", label: "Marketing communications" },
] as const;

export type NotificationPreferences = {
  classReminders: boolean;
  scheduleChanges: boolean;
  membershipRenewals: boolean;
  marketing: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  classReminders: true,
  scheduleChanges: true,
  membershipRenewals: true,
  marketing: false,
};

export const ACCOUNT_STATUS = {
  active: "active",
  suspended: "suspended",
  banned: "banned",
} as const;

export const MEMBERSHIP_EVENT_TYPE = {
  started: "started",
  paused: "paused",
  resumed: "resumed",
  cancelled: "cancelled",
  terminated: "terminated",
  planChanged: "plan_changed",
} as const;

export const CANCELLATION_REASONS = [
  "Too expensive",
  "Schedule no longer suits me",
  "Moving away",
  "Injury or health",
  "Trying something else",
  "Other",
] as const;
