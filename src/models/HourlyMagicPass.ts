import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHourlyMagicPass extends Document {
  pin: string; // 4 to 6 digit biometric access code
  email: string;
  userName: string;
  hoursAllocated: number;
  expiresAt: Date;
  status: "ACTIVE" | "EXPIRED" | "USED";
  createdAt: Date;
  updatedAt: Date;
}

const HourlyMagicPassSchema: Schema<IHourlyMagicPass> = new Schema(
  {
    pin: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    userName: { type: String, default: "Hourly Scholar" },
    hoursAllocated: { type: Number, default: 2 },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "USED"], default: "ACTIVE" },
  },
  {
    timestamps: true,
  }
);

export const HourlyMagicPass: Model<IHourlyMagicPass> =
  mongoose.models.HourlyMagicPass ||
  mongoose.model<IHourlyMagicPass>("HourlyMagicPass", HourlyMagicPassSchema);
export default HourlyMagicPass;
