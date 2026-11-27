import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminSettings extends Document {
  adminEmail: string;
  adminPasswordHash?: string;
  upiId: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  qrCodeUrl: string;
  centerPhone: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  gmailUser?: string;
  gmailAppPass?: string;
  googleClientId?: string;
  whatsappPhoneId?: string;
  whatsappToken?: string;
  whatsappNumber?: string;
  whatsappVerifyToken?: string;
  aiBotPrompt?: string;
  // CMS Content & Media Fields
  heroHeadline?: string;
  heroTagline?: string;
  heroWelcomeText?: string;
  topBannerText?: string;
  heroImageUrl?: string;
  galleryImages?: string[];
  hourlyRate?: number;
  dayPassRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  oneTimeRegistrationFee?: number;
  wifiSsid?: string;
  wifiPassword?: string;
  centerAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema: Schema<IAdminSettings> = new Schema(
  {
    adminEmail: { type: String, default: "admin@elitestudyzone.in", lowercase: true, trim: true },
    adminPasswordHash: { type: String, default: null },
    upiId: { type: String, default: "shettyvarun001@okicici", trim: true },
    accountHolder: { type: String, default: "Varun Shetty", trim: true },
    accountNumber: { type: String, default: "50200084920192", trim: true },
    ifscCode: { type: String, default: "HDFC0000123", trim: true },
    qrCodeUrl: { type: String, default: "/upi-qr.jpg" },
    centerPhone: { type: String, default: "+91 93246 89280", trim: true },
    razorpayKeyId: { type: String, default: "", trim: true },
    razorpayKeySecret: { type: String, default: "", trim: true },
    gmailUser: { type: String, default: "", trim: true },
    gmailAppPass: { type: String, default: "", trim: true },
    googleClientId: { type: String, default: "", trim: true },
    whatsappPhoneId: { type: String, default: "", trim: true },
    whatsappToken: { type: String, default: "", trim: true },
    whatsappNumber: { type: String, default: "+91 93246 89280", trim: true },
    whatsappVerifyToken: { type: String, default: "esz_whatsapp_verify_token_2026", trim: true },
    aiBotPrompt: { type: String, default: "You are the AI Concierge for Elite Study Zone in Ghatkopar West, Mumbai. Help students with timings, passes, Wi-Fi and seat bookings." },
    // CMS defaults
    heroHeadline: { type: String, default: "Your Space for Focus, Productivity & Success." },
    heroTagline: { type: String, default: "Welcome to Elite Study Zone" },
    heroWelcomeText: { type: String, default: "A peaceful, fully air-conditioned, distraction-free sanctuary designed for serious aspirants, students, and professionals in Ghatkopar West, Mumbai." },
    topBannerText: { type: String, default: "📍 Amrut Nagar, Ghatkopar West • 24/7 Smart Keypad Access • Flexible Passes from ₹49/hr" },
    heroImageUrl: { type: String, default: "/desk-render-01.jpg" },
    galleryImages: { type: [String], default: ["/desk-render-01.jpg", "/reading-room-wide.jpg", "/individual-stacks.jpg"] },
    hourlyRate: { type: Number, default: 49 },
    dayPassRate: { type: Number, default: 249 },
    weeklyRate: { type: Number, default: 799 },
    monthlyRate: { type: Number, default: 2499 },
    oneTimeRegistrationFee: { type: Number, default: 200 },
    wifiSsid: { type: String, default: "EliteStudy_5G" },
    wifiPassword: { type: String, default: "FocusQuiet2026" },
    centerAddress: { type: String, default: "Amrut Nagar, Near Shreyas Cinema, LBS Marg, Ghatkopar West, Mumbai 400086" },
  },
  {
    timestamps: true,
  }
);

export const AdminSettings: Model<IAdminSettings> =
  mongoose.models.AdminSettings || mongoose.model<IAdminSettings>("AdminSettings", AdminSettingsSchema);
export default AdminSettings;
