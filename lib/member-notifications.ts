import { sendNewMemberRegisteredEmail } from "@/lib/email";

export async function notifyAdminOfNewMember(member: {
  name: string;
  email: string;
  phone?: string | null;
  signupMethod: "email" | "google";
  emailVerified: boolean;
}) {
  try {
    await sendNewMemberRegisteredEmail(member);
  } catch (error) {
    console.error("[member-notify]", error);
  }
}
