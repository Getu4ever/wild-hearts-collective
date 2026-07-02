export const VERIFICATION_PURPOSE = {
  signupVerify: "signup_verify",
  passwordReset: "password_reset",
} as const;

export const VERIFICATION_CHANNEL = {
  email: "email",
  phone: "phone",
} as const;

export type VerificationPurpose =
  (typeof VERIFICATION_PURPOSE)[keyof typeof VERIFICATION_PURPOSE];

export type VerificationChannel =
  (typeof VERIFICATION_CHANNEL)[keyof typeof VERIFICATION_CHANNEL];

export const CODE_TTL_MS = 1000 * 60 * 15;
export const CODE_LENGTH = 6;
