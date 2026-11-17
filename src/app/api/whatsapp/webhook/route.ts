import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, formatWhatsAppNumber } from "@/lib/whatsapp";
import { AdminSettings } from "@/models/AdminSettings";
import { isMongoAvailable } from "@/lib/hybridDb";

/**
 * 1. Meta Webhook Verification (GET)
 * Meta calls this endpoint when configuring the webhook in Meta for Developers.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    let expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "esz_whatsapp_verify_token_2026";

    try {
      const mongoOk = await isMongoAvailable();
      if (mongoOk) {
        const settings = await AdminSettings.findOne();
        if (settings?.whatsappVerifyToken) {
          expectedVerifyToken = settings.whatsappVerifyToken;
        }
      }
    } catch (_) {}

    if (mode === "subscribe" && token === expectedVerifyToken) {
      console.log("[WhatsApp Webhook] Verification successful.");
      return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error: any) {
    console.error("[WhatsApp Webhook] GET Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}

/**
 * 2. Inbound Message Handler & AI Bot (POST)
 * Receives messages sent by students on WhatsApp and replies automatically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a WhatsApp message event
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") {
      // Return 200 immediately to acknowledge non-text or status webhook events
      return NextResponse.json({ status: "ignored" });
    }

    const senderPhone = message.from; // e.g. "919875359327"
    const incomingText = (message.text?.body || "").trim();
    const lower = incomingText.toLowerCase();

    console.log(`[WhatsApp AI Bot] Incoming query from ${senderPhone}: "${incomingText}"`);

    // AI Concierge Knowledge Base Engine
    let botReply = "";

    if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet") || lower.includes("password")) {
      botReply = 
`📶 *Elite Study Zone Wi-Fi Credentials:*
• Network (SSID): *EliteStudy_5G* (or *EliteStudy_Guest*)
• Password: *FocusQuiet2026*
• Speed: 300 Mbps Ultra-low latency fiber.

Enjoy seamless studying!`;
    } else if (lower.includes("door") || lower.includes("pin") || lower.includes("code") || lower.includes("keypad") || lower.includes("unlock") || lower.includes("exit")) {
      botReply = 
`🔑 *How to Enter and Exit the Door:*
• *To Enter:* Type your assigned *6-digit PIN* on the digital keypad outside. The indicator turns green and the electromagnetic door lock releases.
• *To Exit:* Simply press the push-to-exit button mounted on the interior wall next to the door.

Need to check your active PIN? Log in at: https://study-place.onrender.com/login`;
    } else if (lower.includes("time") || lower.includes("timing") || lower.includes("hours") || lower.includes("open") || lower.includes("close")) {
      botReply = 
`⏱️ *Elite Study Zone Timings:*
• Standard Hours: *07:00 AM – 11:00 PM* (Open 7 Days a Week)
• Dedicated Resident Members: *24/7 Unlimited Keypad Pass Access*
• Silent Zone: Sub-38 dBA acoustic compliance maintained throughout.`;
    } else if (lower.includes("price") || lower.includes("rate") || lower.includes("fee") || lower.includes("cost") || lower.includes("hourly") || lower.includes("plan")) {
      botReply = 
`🏛️ *Membership & Hourly Rates:*
• *Hourly Flex Pass:* ₹49 / hour (choose your custom 1hr, 2hr, 4hr, or 8hr slot)
• *Day Sanctuary Pass:* ₹249 / day
• *Monthly Resident Desk:* ₹2,499 / month (dedicated desk, 24/7 access & locker)

Book instantly online: https://study-place.onrender.com/book`;
    } else if (lower.includes("address") || lower.includes("location") || lower.includes("where") || lower.includes("reach") || lower.includes("map")) {
      botReply = 
`📍 *Center Location:*
Elite Study Zone, Amrut Nagar, Ghatkopar West, Mumbai, Maharashtra 400086.
Near Ghatkopar Metro & Railway Station.
Google Maps: https://maps.google.com/?q=Amrut+Nagar+Ghatkopar+West+Mumbai`;
    } else if (lower === "hi" || lower === "hello" || lower === "hey" || lower === "help" || lower === "start") {
      botReply = 
`👋 *Hello from Elite Study Zone AI Concierge!*
I can help you with:
1️⃣ *Wi-Fi Password* (type 'wifi')
2️⃣ *Door Access PIN Help* (type 'door')
3️⃣ *Center Timings* (type 'timings')
4️⃣ *Rates & Plans* (type 'rates')
5️⃣ *Location & Directions* (type 'location')

Or visit our student portal anytime: https://study-place.onrender.com`;
    } else {
      // Contextual AI Fallback
      botReply = 
`Hello! Thank you for messaging *Elite Study Zone*.
Our team is here to help. You can reply with *'wifi'*, *'door'*, *'timings'*, or *'rates'* for instant answers.
For urgent assistance, our front desk curator is reachable at +91 98753 59327.`;
    }

    // Dispatch AI Bot reply back to student
    await sendWhatsAppMessage({
      toPhone: senderPhone,
      message: botReply,
    });

    return NextResponse.json({ success: true, replied: true });
  } catch (error: any) {
    console.error("[WhatsApp AI Bot] POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process message" }, { status: 500 });
  }
}
