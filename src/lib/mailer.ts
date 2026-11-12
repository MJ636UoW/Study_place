import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporter;
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
    return transporter;
  }

  return null;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; previewUrl?: string }> {
  const mailer = getTransporter();

  if (mailer) {
    try {
      const info = await mailer.sendMail({
        from: process.env.SMTP_FROM || `"Elite Study Zone" <${process.env.SMTP_USER || process.env.GMAIL_USER || "noreply@elitestudyzone.in"}>`,
        to,
        subject,
        html,
      });
      console.log("Email dispatched successfully to:", to, "MessageId:", info.messageId);
      return { success: true };
    } catch (err) {
      console.error("Failed to dispatch email via SMTP:", err);
      return { success: false };
    }
  }

  // If no SMTP configured yet, log clearly to console
  console.log(`\n======================================================`);
  console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
  console.log(`No direct SMTP credentials found in .env (Add SMTP_HOST/SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASS).`);
  console.log(`======================================================\n`);
  return { success: true };
}

export async function sendVerificationEmail(email: string, name: string, token: string, siteUrl: string) {
  const confirmUrl = `${siteUrl}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 24px; text-align: center; }
          .logo { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
          .content { padding: 32px 28px; }
          h2 { font-size: 20px; margin-top: 0; color: #0f172a; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; margin: 20px 0; }
          .btn:hover { background-color: #1d4ed8; }
          .footer { background: #f1f5f9; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">Elite Study Zone</h1>
          </div>
          <div class="content">
            <h2>Welcome to Elite Study Zone, ${name}!</h2>
            <p>Thank you for registering. Please confirm your email address to activate your scholar portal and start reserving your workstation.</p>
            <div style="text-align: center;">
              <a href="${confirmUrl}" class="btn" target="_blank">Confirm Email Address</a>
            </div>
            <p>Or paste this link into your browser:</p>
            <p style="word-break: break-all; font-family: monospace; font-size: 12px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
              ${confirmUrl}
            </p>
            <p>If you did not create this account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            Elite Study Zone &bull; Amrut Nagar, Ghatkopar West, Mumbai &bull; 24/7 Biometric Access
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Confirm your email address - Elite Study Zone",
    html,
  });
}
