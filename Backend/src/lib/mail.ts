// Email via Resend API — pure HTTP, works in Cloudflare Workers.
// Sign up at resend.com (free tier: 3,000 emails/month, 100/day).

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailConfig {
  apiKey: string;
  from: string;
}

export async function sendEmail(
  options: SendEmailOptions,
  config: EmailConfig
): Promise<boolean> {
  const { to, subject, html, from } = options;
  const sender = from || config.from || "noreply@nl-furniture.nl";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: sender, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("sendEmail failed:", err);
    return false;
  }
}

export function passwordResetHtml(username: string, resetUrl: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
    <h2 style="color:#111827;margin-top:0;font-size:24px;text-align:center;border-bottom:1px solid #f3f4f6;padding-bottom:20px;">
      Wachtwoord opnieuw instellen
    </h2>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin-top:20px;">
      Hallo <strong>${username}</strong>,
    </p>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Je hebt aangevraagd om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder:
    </p>
    <div style="text-align:center;margin:35px 0;">
      <a href="${resetUrl}" style="background:#000;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
        Wachtwoord opnieuw instellen
      </a>
    </div>
    <p style="color:#9ca3af;font-size:14px;border-top:1px solid #f3f4f6;padding-top:20px;margin-bottom:0;">
      Deze link is <strong>1 uur</strong> geldig.
    </p>
  </div>
  `;
}

export function newsletterWelcomeHtml(email: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
    <h2 style="color:#111827;margin-top:0;font-size:22px;text-align:center;">
      Welkom bij NL Furniture!
    </h2>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
      Bedankt voor je aanmelding voor de NL Furniture-nieuwsbrief.<br>
      Vanaf nu ontvang je de beste meubeldeals en aanbiedingen rechtstreeks in je inbox.
    </p>
  </div>
  `;
}
