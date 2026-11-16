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
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema: Schema<IAdminSettings> = new Schema(
  {
    adminEmail: { type: String, default: "admin@elitestudyzone.in", lowercase: true, trim: true },
    adminPasswordHash: { type: String, default: null },
    upiId: { type: String, default: "elitestudyzone@okhdfcbank", trim: true },
    accountHolder: { type: String, default: "Elite Study Zone", trim: true },
    accountNumber: { type: String, default: "50200084920192", trim: true },
    ifscCode: { type: String, default: "HDFC0000123", trim: true },
    qrCodeUrl: { type: String, default: "" },
    centerPhone: { type: String, default: "+91 98753 59327", trim: true },
    razorpayKeyId: { type: String, default: "", trim: true },
    razorpayKeySecret: { type: String, default: "", trim: true },
    gmailUser: { type: String, default: "", trim: true },
    gmailAppPass: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  }
);

export const AdminSettings: Model<IAdminSettings> =
  mongoose.models.AdminSettings || mongoose.model<IAdminSettings>("AdminSettings", AdminSettingsSchema);
export default AdminSettings;
