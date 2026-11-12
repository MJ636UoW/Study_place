import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  bookingRef: string;
  userId?: mongoose.Types.ObjectId | string;
  userName: string;
  userEmail: string;
  seatId: string;
  tierName: string;
  hours: number;
  startDate: Date;
  endDate: Date;
  status: "confirmed" | "pending" | "cancelled";
  amountPaise: number;
  biometricPassCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    bookingRef: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.Mixed, default: null },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, index: true },
    seatId: { type: String, required: true },
    tierName: { type: String, required: true },
    hours: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["confirmed", "pending", "cancelled"], default: "confirmed" },
    amountPaise: { type: Number, required: true },
    biometricPassCode: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
export default Booking;
