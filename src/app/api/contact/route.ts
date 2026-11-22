import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";
import { NotificationService } from "@/lib/notifications/notificationService";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// In-memory rate limiting store: identifier -> array of submission timestamps (ms)
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 5;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      topic,
      message,
      website,      // Honeypot field - must be empty
      renderedAt,   // Timestamp when form was loaded in ms
    } = body;

    // 1. Spam protection: Honeypot trap
    if (website && website.trim() !== "") {
      return NextResponse.json(
        { error: "SPAM_DETECTED: Automated submission rejected by curatorial filter." },
        { status: 400 }
      );
    }

    // 2. Spam protection: Instant submission timestamp check (bots submit in < 2 seconds)
    if (renderedAt && typeof renderedAt === "number") {
      const elapsedMs = Date.now() - renderedAt;
      if (elapsedMs < 2000) {
        return NextResponse.json(
          { error: "BOT_TIMING_VIOLATION: Form submitted too rapidly for human entry." },
          { status: 400 }
        );
      }
    }

    // 3. Server-side validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR: Full name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR: Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR: Message must be at least 10 characters in length." },
        { status: 400 }
      );
    }

    // 4. Rate limiting: by IP or email
    const ip = req.headers.get("x-forwarded-for") || "local_client";
    const rateLimitKey = `${ip}_${email.trim().toLowerCase()}`;
    const withinLimit = checkRateLimit(rateLimitKey);

    if (!withinLimit) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT_EXCEEDED: Maximum 5 inquiries per hour permitted. Please contact desk by phone for urgent assistance.",
        },
        { status: 429 }
      );
    }

    // 5. Database persistence into AdminService enquiries store
    const enquiry = AdminService.addEnquiry({
      fullName: name.trim(),
      email: email.trim(),
      phone: phone ? String(phone).trim() : undefined,
      topic: topic || "general",
      message: message.trim(),
    });

    // 6. Send live email acknowledgment and notification via SMTP
    try {
      sendEmail({
        to: email.trim(),
        subject: `Enquiry Received: #${enquiry.id} - Elite Study Zone`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
            <h2>Hello ${name.trim()},</h2>
            <p>Thank you for reaching out to Elite Study Zone (Ghatkopar West). We have received your inquiry regarding <strong>${topic || "Study Zone Access"}</strong>.</p>
            <p>Our concierge team will respond shortly. If you require urgent assistance, please call us at +91 93246 89280 / +91 99878 18182.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748b;">Elite Study Zone &bull; Amrut Nagar, Near Shreyas Cinema, Ghatkopar West &bull; info@elitestudyzone.in</p>
          </div>
        `,
      }).catch((e) => console.warn("[Contact Email] error:", e));

      // Admin alert
      const adminEmail = process.env.SMTP_USER || "info@elitestudyzone.in";
      sendEmail({
        to: adminEmail,
        subject: `[New Website Lead] ${name.trim()} (${phone || "No phone"})`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3>New Inquiry on Elite Study Zone</h3>
            <p><strong>Name:</strong> ${name.trim()}</p>
            <p><strong>Email:</strong> ${email.trim()}</p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p><strong>Topic:</strong> ${topic || "general"}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #0f172a;">${message.trim()}</blockquote>
          </div>
        `,
      }).catch((e) => console.warn("[Contact Admin Email] error:", e));
    } catch (notifErr) {
      console.error("[Contact API] Non-fatal notification error:", notifErr);
    }

    // 7. Truthful submission response
    return NextResponse.json(
      {
        success: true,
        enquiryId: enquiry.id,
        message: `Inquiry #${enquiry.id} successfully recorded in the Sanctuary Curatorial Ledger. Our desk reviews dispatches twice daily and will respond within 12 business hours.`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
