import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBiometricPunchLog extends Document {
  pin: number;
  userName: string;
  seatId: string;
  type: "IN" | "OUT" | "CHECK";
  terminal: string;
  timestamp: Date;
  matchedScore: number;
  verifyMode: number;
}

const BiometricPunchLogSchema: Schema<IBiometricPunchLog> = new Schema(
  {
    pin: { type: Number, required: true, index: true },
    userName: { type: String, required: true },
    seatId: { type: String, default: "Desk #04" },
    type: { type: String, enum: ["IN", "OUT", "CHECK"], default: "IN" },
    terminal: { type: String, default: "ZKTeco LX50 (Main Entrance)" },
    timestamp: { type: Date, default: Date.now, index: true },
    matchedScore: { type: Number, default: 98 },
    verifyMode: { type: Number, default: 1 }, // 1=fingerprint, 2=password/PIN, 3=card
  },
  {
    timestamps: true,
  }
);

export const BiometricPunchLog: Model<IBiometricPunchLog> =
  mongoose.models.BiometricPunchLog ||
  mongoose.model<IBiometricPunchLog>("BiometricPunchLog", BiometricPunchLogSchema);
export default BiometricPunchLog;
