import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  role: "student" | "admin";
  emailVerified: boolean;
  verificationToken?: string | null;
  resetPasswordToken?: string | null;
  authProvider: "email" | "google";
  allottedHours: number;
  usedHours: number;
  deskNumber: string;
  lockerNumber: string;
  biometricPin: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: null },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    authProvider: { type: String, enum: ["email", "google"], default: "email" },
    allottedHours: { type: Number, default: 48 },
    usedHours: { type: Number, default: 0 },
    deskNumber: { type: String, default: "Desk #04" },
    lockerNumber: { type: String, default: "Locker #14" },
    biometricPin: { type: String, default: "001" },
    avatarUrl: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development hot-reloading
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
