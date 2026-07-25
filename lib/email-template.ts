import { formatSessionDateTime, getAppBaseUrl } from "@/lib/booking-config";
import { EMAIL_LOGO_PATH } from "@/lib/branding";
import { contact, siteConfig } from "@/lib/site-data";

/** Brand colours aligned with the website (sage primary, plum text — not the old pink-led email look). */
export const EMAIL_BRAND = {
  sage: "#8A9A85",
  sageHover: "#758574",
  plum: "#6B5F54",
  foreground: "#4A433C",
  muted: "#7A7168",
  cream: "#F7F4EF",
  creamDeep: "#F3EEE8",
  white: "#FFFFFF",
  border: "#E4DDD4",
} as const;

type EmailContent = {
  previewText: string;
  heading: string;
  bodyHtml: string;
  cta?: {
    label: string;
    href: string;
  };
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export { escapeHtml };

export function buildBrandedEmail(content: EmailContent) {
  const baseUrl = getAppBaseUrl();
  const logoUrl = `${baseUrl}${EMAIL_LOGO_PATH}`;
  /** Public-facing contact shown in footers — independent of env until the live domain is published. */
  const publicEmail = contact.email;
  const publicWebsite = contact.website.replace(/^www\./, "");
  const publicWebsiteUrl = `https://${publicWebsite}`;
  const phone = contact.phone;
  const address = contact.address;
  const c = EMAIL_BRAND;

  const ctaBlock = content.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0;">
        <tr>
          <td style="border-radius:4px;background:${c.sage};">
            <a href="${content.cta.href}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${c.white};text-decoration:none;">
              ${escapeHtml(content.cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(content.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${c.cream};font-family:Arial,Helvetica,sans-serif;color:${c.foreground};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(content.previewText)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${c.cream};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:${c.white};border:1px solid ${c.border};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 18px;text-align:center;background:linear-gradient(180deg,${c.cream} 0%,${c.white} 100%);">
                <img src="${logoUrl}" alt="${escapeHtml(siteConfig.name)}" width="140" style="display:block;margin:0 auto 16px;max-width:140px;height:auto;" />
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${c.sage};">
                  ${escapeHtml(siteConfig.tagline)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="height:3px;background:linear-gradient(90deg,${c.sage} 0%,${c.plum} 100%);"></td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:${c.plum};font-weight:700;">
                  ${escapeHtml(content.heading)}
                </h1>
                <div style="font-size:15px;line-height:1.7;color:${c.foreground};">
                  ${content.bodyHtml}
                </div>
                ${ctaBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:${c.creamDeep};border-top:1px solid ${c.border};">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${c.plum};">
                  ${escapeHtml(contact.name)}
                </p>
                <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:${c.muted};">
                  ${escapeHtml(address)}<br />
                  ${escapeHtml(phone)}<br />
                  <a href="mailto:${publicEmail}" style="color:${c.plum};text-decoration:none;">${escapeHtml(publicEmail)}</a><br />
                  <a href="${publicWebsiteUrl}" style="color:${c.sage};text-decoration:none;">${escapeHtml(publicWebsite)}</a>
                </p>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${c.muted};">
                  Please arrive 5–10 minutes before your class starts.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

export function sessionDetailBlock(classTitle: string, startsAt: Date) {
  const formatted = formatSessionDateTime(startsAt);
  const c = EMAIL_BRAND;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;background:${c.cream};border:1px solid ${c.border};border-radius:6px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${c.sage};">
            Session details
          </p>
          <p style="margin:0;font-size:16px;font-weight:700;color:${c.plum};">${escapeHtml(classTitle)}</p>
          <p style="margin:8px 0 0;font-size:14px;color:${c.muted};">${escapeHtml(formatted)}</p>
        </td>
      </tr>
    </table>
  `;
}

export function calendarLinksBlock(input: {
  googleUrl: string;
  outlookUrl: string;
}) {
  const c = EMAIL_BRAND;
  return `
    <p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:${c.plum};">
      Add to your calendar
    </p>
    <p style="margin:0 0 4px;font-size:14px;line-height:1.7;">
      <a href="${input.googleUrl}" style="color:${c.sage};font-weight:700;text-decoration:underline;">Google Calendar</a>
      &nbsp;·&nbsp;
      <a href="${input.outlookUrl}" style="color:${c.sage};font-weight:700;text-decoration:underline;">Outlook Calendar</a>
    </p>
  `;
}
