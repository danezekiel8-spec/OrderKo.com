type LeadNotificationInput = {
  id: string;
  name: string;
  email: string;
  restaurantName: string;
  phone: string | null;
  message: string | null;
  createdAt: Date;
};

function envValue(name: string) {
  return process.env[name]?.trim().replace(/^['"]|['"]$/g, "") || "";
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

export async function sendLeadNotificationEmail(lead: LeadNotificationInput) {
  const apiKey = envValue("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, skipped: true, reason: "RESEND_API_KEY is not configured." };
  }

  const to = envValue("LEAD_NOTIFICATION_EMAIL") || "hello.orderko@gmail.com";
  const from = envValue("LEAD_EMAIL_FROM") || "OrderKo <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: lead.email,
      subject: `New OrderKo demo request: ${lead.restaurantName}`,
      text: formatLeadText(lead),
      html: formatLeadHtml(lead),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      skipped: false,
      reason: `Resend email failed with ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    };
  }

  return { ok: true, skipped: false, reason: "" };
}
