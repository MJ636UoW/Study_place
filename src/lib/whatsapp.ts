import { isMongoAvailable } from "./hybridDb";
import { AdminSettings } from "@/models/AdminSettings";

export interface WhatsAppDispatchResult {
  success: boolean;
  provider: "meta_cloud_api" | "direct_link" | "simulated";
  deepLink: string;
  messageId?: string;
  error?: string;
}

/**
 * Format raw phone input into valid international E.164 digits without "+"
 * e.g., "+91 98753 59327" -> "919875359327"
 */
export function formatWhatsAppNumber(rawPhone: string): string {
  let cleaned = (rawPhone || "").replace(/\D/g, "");
  // Default to India (91) if 10-digit mobile is provided
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

/**
 * Core WhatsApp Dispatcher:
 * Uses Meta WhatsApp Cloud API if configured in AdminSettings / env;
 * otherwise provides an immediate 1-click WhatsApp deep link.
 */
export async function sendWhatsAppMessage(params: {
  toPhone: string;
  message: string;
}): Promise<WhatsAppDispatchResult> {
  const { toPhone, message } = params;
  const cleanPhone = formatWhatsAppNumber(toPhone);

  const deepLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      provider: "direct_link",
      deepLink,
      error: "Invalid phone number.",
    };
  }

  // Check database settings for Meta WhatsApp Cloud API credentials
  let phoneId = process.env.WHATSAPP_PHONE_ID || "";
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";

  try {
    const mongoOk = await isMongoAvailable();
    if (mongoOk) {
      const settings = await AdminSettings.findOne();
      if (settings?.whatsappPhoneId) phoneId = settings.whatsappPhoneId;
      if (settings?.whatsappToken) accessToken = settings.whatsappToken;
    }
  } catch (err) {
    console.warn("[WhatsApp] Settings fetch fallback:", err);
  }

  // 1. If Meta Cloud API credentials exist, dispatch via Meta Graph API
  if (phoneId && accessToken) {
    try {
      const metaUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: true,
            body: message,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data?.messages?.[0]?.id) {
        console.log(`[WhatsApp] Meta API message sent to ${cleanPhone}:`, data.messages[0].id);
        return {
          success: true,
          provider: "meta_cloud_api",
          messageId: data.messages[0].id,
          deepLink,
        };
      } else {
        console.warn("[WhatsApp] Meta API non-fatal dispatch error:", data);
      }
    } catch (apiErr) {
      console.warn("[WhatsApp] Meta API fetch error:", apiErr);
    }
  }

  // 2. Fallback: Log and provide immediate 1-click WhatsApp URL
  console.log(`[WhatsApp] Dispatch recorded for ${cleanPhone}. 1-click Link: ${deepLink}`);
  return {
    success: true,
    provider: "direct_link",
    deepLink,
  };
}

/**
 * Send official WhatsApp message for Hourly Pass & Workstation Bookings
 */
export async function sendWhatsAppBookingPass(params: {
  phone: string;
  name: string;
  passCode: string;
  seatOrPass: string;
  slotOrDates: string;
  amountRupees?: string;
}): Promise<WhatsAppDispatchResult> {
  const { phone, name, passCode, seatOrPass, slotOrDates, amountRupees } = params;

  const text = 
`🏛️ *ELITE STUDY ZONE - Access Confirmation*
Hello *${name || "Scholar"}*, your workstation reservation is confirmed!

🔑 *Door Access PIN:* *#${passCode}*
💺 *Allocation:* ${seatOrPass}
⏱️ *Active Time Slot / Dates:* ${slotOrDates}
${amountRupees ? `💳 *Amount Paid:* ₹${amountRupees}\n` : ""}\
📶 *Center Wi-Fi:* EliteStudy_5G
🔒 *Wi-Fi Password:* FocusQuiet2026
📍 *Location:* Amrut Nagar, Ghatkopar West, Mumbai

👉 *How to Enter & Exit:*
• Entry: Type *#${passCode}* on the digital door keypad outside to unlock.
• Exit: Press the interior push-to-exit button next to the door.

For assistance, reply to this message or visit the Curatorial Desk. Have a productive study session!`;

  return sendWhatsAppMessage({ toPhone: phone, message: text });
}

/**
 * Send official WhatsApp message for New Scholar Registration
 */
export async function sendWhatsAppWelcome(params: {
  phone: string;
  name: string;
  email: string;
  initialPassCode?: string;
}): Promise<WhatsAppDispatchResult> {
  const { phone, name, email, initialPassCode } = params;

  const text =
`🏛️ *Welcome to Elite Study Zone!*
Hello *${name}*, welcome to Mumbai's premier self-study space & focus hub.

📧 *Registered Email:* ${email}
${initialPassCode ? `🔑 *Your Keypad Pass PIN:* *#${initialPassCode}*\n` : ""}\
📍 *Center Address:* Amrut Nagar, Ghatkopar West, Mumbai (400086)
⏱️ *Open Hours:* 07:00 AM – 11:00 PM Daily (24/7 for Dedicated Pass Members)
🌐 *Student Portal:* https://elitestudyzone.in

Need a seat? Book an hourly pass or monthly workstation on our portal anytime. Welcome aboard!`;

  return sendWhatsAppMessage({ toPhone: phone, message: text });
}
