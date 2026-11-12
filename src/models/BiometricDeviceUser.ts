import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBiometricDeviceUser extends Document {
  pin: number;
  name: string;
  fingerIndex: number;
  enrolled: boolean;
  userId?: string;
  privilege: number; // 0=normal, 3=admin
  card?: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  createdAt: Date;
  updatedAt: Date;
}

const BiometricDeviceUserSchema: Schema<IBiometricDeviceUser> = new Schema(
  {
    pin: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    fingerIndex: { type: Number, default: 0 },
    enrolled: { type: Boolean, default: true },
    userId: { type: String, default: null },
    privilege: { type: Number, default: 0 },
    card: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "PENDING"], default: "ACTIVE" },
  },
  {
    timestamps: true,
  }
);

export const BiometricDeviceUser: Model<IBiometricDeviceUser> =
  mongoose.models.BiometricDeviceUser ||
  mongoose.model<IBiometricDeviceUser>("BiometricDeviceUser", BiometricDeviceUserSchema);
export default BiometricDeviceUser;
