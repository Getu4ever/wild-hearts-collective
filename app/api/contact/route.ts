import { NextResponse } from "next/server";
import { isEmailConfigured, sendContactEnquiryEmails } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECTS = new Set([
  "General enquiry",
  "Class booking help",
  "Party booking",
  "Studio hire",
]);

type ContactBody = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Please email the studio directly or try again later.",
      },
      { status: 503 },
    );
  }

  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (!subject || !SUBJECTS.has(subject)) {
    return NextResponse.json({ error: "Please choose a subject." }, { status: 400 });
  }
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  }

  const result = await sendContactEnquiryEmails({
    name,
    email,
    subject,
    message,
  });

  if (result.admin.skipped || result.visitor.skipped) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Please email the studio directly or try again later.",
      },
      { status: 503 },
    );
  }

  if (!result.admin.ok || !result.visitor.ok) {
    return NextResponse.json(
      {
        error:
          "We could not send your message just now. Please try again or email the studio directly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Thank you — your message has been sent. We will get back to you shortly.",
  });
}
