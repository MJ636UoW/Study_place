import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/lib/admin/adminService";
import { NotificationService } from "@/lib/notifications/notificationService";

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

    // 6. Durable notification queue for curatorial record
    try {
      NotificationService.queueNotification({
        userId: "anonymous_inquiry",
        type: "request_submission",
        recipientEmail: email.trim(),
        recipientName: name.trim(),
        subject: `Sanctuary Concierge Dispatch Acknowledged — ${enquiry.id}`,
        templateName: "enquiry_acknowledgment_template",
        payload: {
          enquiryId: enquiry.id,
          topic: enquiry.topic,
          messageSnippet: enquiry.message.slice(0, 100),
        },
      });
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
