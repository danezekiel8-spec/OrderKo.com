import nodemailer from "nodemailer";

type LeadNotificationInput = {
  id: string;
  name: string;
  email: string;
  restaurantName: string;
  phone: string | null;
  message: string | null;
  createdAt: Date;
};

export function envValue(name: string) {
  return process.env[name]?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function envNumber(name: string, fallback: number) {
  const value = Number(envValue(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatLeadText(lead: LeadNotificationInput) {
  return [
    "New OrderKo demo request",
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Restaurant: ${lead.restaurantName}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Message: ${lead.message || "Not provided"}`,
    `Submitted: ${lead.createdAt.toISOString()}`,
    `Lead ID: ${lead.id}`,
  ].join("\n");
}

function formatLeadHtml(lead: LeadNotificationInput) {
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Restaurant", lead.restaurantName],
    ["Phone", lead.phone || "Not provided"],
    ["Message", lead.message || "Not provided"],
    ["Submitted", lead.createdAt.toISOString()],
    ["Lead ID", lead.id],
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #17211f; line-height: 1.55;">
      <h1 style="margin: 0 0 16px; font-size: 22px;">New OrderKo demo request</h1>
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="padding: 8px 12px 8px 0; color: #5f6c68; font-weight: 700; width: 120px;">${escapeHtml(label)}</td>
                <td style="padding: 8px 0;">${escapeHtml(value)}</td>
              </tr>
            `,
          )
          .join("")}
      </table>
    </div>
  `;
}

export function leadNotificationEmailStatus() {
  const host = envValue("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(envValue("SMTP_PORT") || "587");
  const user = envValue("SMTP_USER");
  const pass = envValue("SMTP_PASS");
  const to = envValue("LEAD_NOTIFICATION_EMAIL") || user;
  const from = envValue("LEAD_EMAIL_FROM") || (user ? `OrderKo <${user}>` : "");
  const missing = [
    !user ? "SMTP_USER" : "",
    !pass ? "SMTP_PASS" : "",
    !to ? "LEAD_NOTIFICATION_EMAIL" : "",
  ].filter(Boolean);

  return {
    configured: missing.length === 0,
    missing,
    host,
    port,
    to,
    from,
  };
}

export async function sendLeadNotificationEmail(lead: LeadNotificationInput) {
  const host = envValue("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(envValue("SMTP_PORT") || "587");
  const user = envValue("SMTP_USER");
  const pass = envValue("SMTP_PASS");
  const timeoutMs = envNumber("SMTP_TIMEOUT_MS", 8000);

  if (!user || !pass) {
    return { ok: false, skipped: true, reason: "SMTP_USER or SMTP_PASS is not configured." };
  }

  const to = envValue("LEAD_NOTIFICATION_EMAIL") || user;
  const from = envValue("LEAD_EMAIL_FROM") || `OrderKo <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
    auth: {
      user,
      pass,
    },
  });

  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`SMTP email timed out after ${timeoutMs}ms.`)), timeoutMs);
    });

    await Promise.race([
      transporter.sendMail({
        from,
        to,
        replyTo: lead.email,
        subject: `New OrderKo demo request: ${lead.restaurantName}`,
        text: formatLeadText(lead),
        html: formatLeadHtml(lead),
      }),
      timeout,
    ]);
  } catch (error) {
    return { ok: false, skipped: false, reason: error instanceof Error ? error.message : "SMTP email failed." };
  } finally {
    transporter.close();
  }

  return { ok: true, skipped: false, reason: "" };
}
