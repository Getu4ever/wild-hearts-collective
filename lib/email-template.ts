import { getAppBaseUrl, getStudioEmail } from "@/lib/booking-config";
import { contact, siteConfig } from "@/lib/site-data";

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

export function buildBrandedEmail(content: EmailContent) {
  const baseUrl = getAppBaseUrl();
  const logoUrl = `${baseUrl}/wild-hearts-logo.jpeg`;
  const studioEmail = getStudioEmail();
  const phone = contact.phone;
  const address = contact.address;

  const ctaBlock = content.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0;">
        <tr>
          <td style="border-radius:4px;background:#3B1F38;">
            <a href="${content.cta.href}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
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
  <body style="margin:0;padding:0;background:#FAF6F8;font-family:Arial,Helvetica,sans-serif;color:#2B2D2F;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(content.previewText)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAF6F8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #eadde6;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 18px;text-align:center;background:linear-gradient(180deg,#fff7fa 0%,#ffffff 100%);">
                <img src="${logoUrl}" alt="${escapeHtml(siteConfig.name)}" width="120" style="display:block;margin:0 auto 16px;max-width:120px;height:auto;" />
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#AA336A;">
                  ${escapeHtml(siteConfig.tagline)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="height:3px;background:linear-gradient(90deg,#FFB6C1 0%,#3B1F38 100%);"></td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#3B1F38;font-weight:700;">
                  ${escapeHtml(content.heading)}
                </h1>
                <div style="font-size:15px;line-height:1.7;color:#2B2D2F;">
                  ${content.bodyHtml}
                </div>
                ${ctaBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:#F5EEF2;border-top:1px solid #eadde6;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#3B1F38;">
                  ${escapeHtml(contact.name)}
                </p>
                <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#6B5B68;">
                  ${escapeHtml(address)}<br />
                  ${escapeHtml(phone)}<br />
                  <a href="mailto:${studioEmail}" style="color:#3B1F38;text-decoration:none;">${escapeHtml(studioEmail)}</a><br />
                  <a href="${baseUrl}" style="color:#AA336A;text-decoration:none;">${escapeHtml(baseUrl.replace(/^https?:\/\//, ""))}</a>
                </p>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#6B5B68;">
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
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;background:#FAF6F8;border:1px solid #eadde6;border-radius:6px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#AA336A;">
            Session details
          </p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#3B1F38;">${escapeHtml(classTitle)}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#6B5B68;">${escapeHtml(formatted)}</p>
        </td>
      </tr>
    </table>
  `;
}
