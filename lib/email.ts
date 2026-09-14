// SERVER-ONLY. Never import this from a "use client" file — it needs
// RESEND_API_KEY, a server-only secret that must never reach the browser.

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATIONS_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Email notifications aren't configured (missing RESEND_API_KEY or NOTIFICATIONS_FROM_EMAIL).",
    };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Email provider error: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not send email." };
  }
}

export function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #14181a;">
      <p style="font-family: Georgia, serif; font-size: 22px; margin-bottom: 24px;">Aura</p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #888;">
        This is a demo store built for a rebuild challenge. No real purchase
        was made.
      </p>
    </div>
  `;
}
