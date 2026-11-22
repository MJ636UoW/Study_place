import nodemailer, { type Transporter } from "nodemailer";
import { AdminSettings } from "@/models/AdminSettings";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function getTransporter(): Promise<{ transporter: Transporter | null; senderEmail: string }> {
  // 1. Check environment variables
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const envUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const envPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (host && envUser && envPass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: envUser, pass: envPass },
      }),
      senderEmail: envUser,
    };
  }

  if (envUser && envPass) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: { user: envUser, pass: envPass },
      }),
      senderEmail: envUser,
    };
  }

  // 2. Check AdminSettings in MongoDB Atlas
  try {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const connected = await connectToDatabase();
    if (connected) {
      const settings = await AdminSettings.findOne();
      const dbUser = settings?.gmailUser?.trim();
      const dbPass = settings?.gmailAppPass?.trim()?.replace(/\s+/g, "");
      if (dbUser && dbPass) {
        return {
          transporter: nodemailer.createTransport({
            service: "gmail",
            auth: { user: dbUser, pass: dbPass },
          }),
          senderEmail: dbUser,
        };
      }
    }
  } catch (err) {
    console.warn("Mailer settings query error:", err);
  }

  return { transporter: null, senderEmail: "noreply@elitestudyzone.in" };
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; previewUrl?: string }> {
  const { transporter: mailer, senderEmail } = await getTransporter();

  if (mailer) {
    try {
      const info = await mailer.sendMail({
        from: `"Elite Study Zone" <${senderEmail}>`,
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
  console.log(`No active SMTP credentials found in Admin Settings or .env.`);
  console.log(`Configure your Gmail + Google App Password in /admin settings to deliver directly to inboxes.`);
  console.log(`======================================================\n`);
  return { success: true };
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  siteUrl: string,
  doorPin?: string
) {
  const confirmUrl = `${siteUrl}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const pinSection = doorPin
    ? `
      <div style="background: #0f172a; color: #f8fafc; padding: 22px; border-radius: 10px; margin: 24px 0; text-align: center; border: 1px solid #334155;">
        <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Your 6-Digit Door Keypad Access PIN</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #f59e0b; font-family: 'Courier New', Courier, monospace; margin: 8px 0;">#${doorPin}</div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
          Enter this PIN followed by <strong>#</strong> on the digital keypad outside to unlock.<br>
          To exit the study hall, press the green push-to-exit button inside.
        </p>
      </div>
    `
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 26px; text-align: center; border-bottom: 3px solid #d97706; }
          .logo { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
          .tagline { color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; }
          .content { padding: 32px 28px; }
          h2 { font-size: 20px; margin-top: 0; color: #0f172a; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
          .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; padding: 13px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; margin: 18px 0; border: 1px solid #334155; }
          .btn:hover { background-color: #1e293b; }
          .footer { background: #f8fafc; padding: 20px 28px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">Elite Study Zone</h1>
            <div class="tagline">Premium 24/7 Air-Conditioned Study Sanctuary</div>
          </div>
          <div class="content">
            <h2>Welcome to Elite Study Zone, ${name}!</h2>
            <p>Your scholar registration has been successfully recorded. Below is your 24/7 smart door keypad access pass:</p>
            
            ${pinSection}

            <p>Please confirm your email address below to finalize your account and access your booking portal:</p>
            <div style="text-align: center;">
              <a href="${confirmUrl}" class="btn" target="_blank">Confirm Email & Open Dashboard &rarr;</a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Or copy and paste this verification URL in your browser:</p>
            <p style="word-break: break-all; font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; color: #334155;">
              ${confirmUrl}
            </p>
          </div>
          <div class="footer">
            Elite Study Zone &bull; Amrut Nagar, Near Shreyas Cinema, Ghatkopar West, Mumbai 400086<br>
            Contact: +91 93246 89280 / +91 99878 18182 &bull; Email: info@elitestudyzone.in
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to Elite Study Zone - Your Access PIN is #${doorPin || "Active"}`,
    html,
  });
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  name: string;
  bookingRef: string;
  seatLabel: string;
  roomName?: string;
  timeSlotOrDuration: string;
  startDate: string;
  endDate?: string;
  amountRupees: string;
  doorPin?: string;
  siteUrl?: string;
}) {
  const {
    to,
    name,
    bookingRef,
    seatLabel,
    roomName = "Main Study Sanctuary",
    timeSlotOrDuration,
    startDate,
    amountRupees,
    doorPin = "394821",
    siteUrl = "https://elitestudyzone.in",
  } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 26px; text-align: center; border-bottom: 3px solid #10b981; }
          .logo { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #a7f3d0; margin-bottom: 12px; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
          .details-table td.label { color: #64748b; font-weight: 500; width: 40%; }
          .details-table td.val { color: #0f172a; font-weight: 600; text-align: right; }
          .pin-card { background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; border: 1px solid #334155; }
          .footer { background: #f8fafc; padding: 20px 28px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">Elite Study Zone</h1>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em;">Official Reservation & Tax Receipt</div>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">&check; Payment Confirmed & Workstation Allocated</span>
            </div>
            <h2 style="font-size: 20px; margin: 12px 0 6px 0; color: #0f172a; text-align: center;">Workstation Confirmed, ${name}!</h2>
            <p style="font-size: 13px; text-align: center; color: #64748b; margin-bottom: 24px;">Booking Reference: <strong>${bookingRef}</strong></p>

            <div class="pin-card">
              <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Your 24/7 Door Keypad PIN</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #f59e0b; font-family: monospace; margin: 6px 0;">#${doorPin}</div>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1;">Enter <strong>#${doorPin}</strong> on the digital keypad at the entrance door to unlock.</p>
            </div>

            <table class="details-table">
              <tr>
                <td class="label">Allocated Seat</td>
                <td class="val">${seatLabel}</td>
              </tr>
              <tr>
                <td class="label">Study Hall Zone</td>
                <td class="val">${roomName}</td>
              </tr>
              <tr>
                <td class="label">Plan / Time Slot</td>
                <td class="val">${timeSlotOrDuration}</td>
              </tr>
              <tr>
                <td class="label">Date</td>
                <td class="val">${startDate}</td>
              </tr>
              <tr>
                <td class="label">Total Paid (Incl. GST)</td>
                <td class="val" style="color: #047857; font-size: 15px;">&#8377;${amountRupees}</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 24px 0 10px 0;">
              <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none;">View Workstation in Student Portal &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Elite Study Zone &bull; Amrut Nagar, Near Shreyas Cinema, Ghatkopar West, Mumbai 400086<br>
            24/7 Smart Keypad Access &bull; Push-to-Exit &bull; Superfast Wi-Fi &bull; Air Conditioned<br>
            GST Reg: 27AASFE1892B1Z8 &bull; info@elitestudyzone.in &bull; +91 93246 89280
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Booking Confirmed: ${seatLabel} (Access PIN: #${doorPin}) - Elite Study Zone`,
    html,
  });
}
