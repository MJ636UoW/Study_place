import { connectToDatabase } from "./mongodb";
import { User, IUser } from "@/models/User";
import { HourlyMagicPass, IHourlyMagicPass } from "@/models/HourlyMagicPass";
import { hashPassword, comparePassword } from "./auth";
import crypto from "crypto";

// Fallback in-memory store if MongoDB Atlas IP whitelist is still being configured
const fallbackUsers: Map<string, Partial<IUser>> = new Map([
  [
    "mandarj2412@gmail.com",
    {
      name: "Mandar Joshi",
      email: "mandarj2412@gmail.com",
      phone: "+91 98753 59327",
      role: "student",
      emailVerified: true,
      allottedHours: 48,
      usedHours: 0,
      deskNumber: "Desk #04",
      lockerNumber: "Locker #14",
      biometricPin: "001",
      authProvider: "email",
    },
  ],
]);

const fallbackPasses: Map<string, Partial<IHourlyMagicPass>> = new Map();

export async function isMongoAvailable(): Promise<boolean> {
  try {
    const mongoose = await Promise.race([
      connectToDatabase(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Mongo connection timeout")), 4000)
      ),
    ]);
    return !!mongoose;
  } catch (err) {
    console.warn("MongoDB Atlas not reachable yet (likely IP whitelist 0.0.0.0/0 pending). Using resilient store.");
    return false;
  }
}

export async function findUserByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const mongoOk = await isMongoAvailable();
  if (mongoOk) {
    try {
      return await User.findOne({ email: cleanEmail });
    } catch (e) {
      console.warn("Error querying mongo user:", e);
    }
  }
  return fallbackUsers.get(cleanEmail) || null;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  authProvider?: "email" | "google";
  emailVerified?: boolean;
}) {
  const cleanEmail = userData.email.trim().toLowerCase();
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const passwordHash = userData.password ? await hashPassword(userData.password) : null;
  const pin = String(Math.floor(100 + Math.random() * 900));

  const mongoOk = await isMongoAvailable();
  if (mongoOk) {
    try {
      const newUser = await User.create({
        name: userData.name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: userData.phone || "",
        role: "student",
        emailVerified: userData.emailVerified || false,
        verificationToken,
        authProvider: userData.authProvider || "email",
        allottedHours: 48,
        usedHours: 0,
        deskNumber: "Desk #04",
        lockerNumber: "Locker #14",
        biometricPin: pin,
      });
      return { user: newUser, token: verificationToken };
    } catch (e) {
      console.warn("MongoDB create failed, falling back to memory:", e);
    }
  }

  // Resilient memory user
  const memoryUser: Partial<IUser> = {
    name: userData.name.trim(),
    email: cleanEmail,
    passwordHash: passwordHash || undefined,
    phone: userData.phone || "",
    role: "student",
    emailVerified: userData.emailVerified || false,
    verificationToken,
    authProvider: userData.authProvider || "email",
    allottedHours: 48,
    usedHours: 0,
    deskNumber: "Desk #04",
    lockerNumber: "Locker #14",
    biometricPin: pin,
  };
  fallbackUsers.set(cleanEmail, memoryUser);
  return { user: memoryUser, token: verificationToken };
}

export async function verifyUserCredentials(email: string, passwordAttempt: string) {
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, error: "No account found with this email. Please register." };

  if (user.passwordHash) {
    const matches = await comparePassword(passwordAttempt, user.passwordHash);
    if (!matches) return { ok: false, error: "Incorrect password. Please try again." };
  }

  if (!user.emailVerified) {
    return {
      ok: false,
      error: "Your email address is pending confirmation. Please click the confirmation link in your email.",
      unverified: true,
    };
  }

  return { ok: true, user };
}

export async function createMagicPass(email: string, hours: number, name: string = "Hourly Scholar") {
  const cleanEmail = email.trim().toLowerCase();
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const durationHours = Math.max(1, Math.min(12, Number(hours) || 2));
  const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

  const mongoOk = await isMongoAvailable();
  if (mongoOk) {
    try {
      await HourlyMagicPass.create({
        pin,
        email: cleanEmail,
        userName: name,
        hoursAllocated: durationHours,
        expiresAt,
        status: "ACTIVE",
      });
    } catch (e) {
      console.warn("MongoDB create magic pass fallback:", e);
    }
  }

  fallbackPasses.set(pin, {
    pin,
    email: cleanEmail,
    userName: name,
    hoursAllocated: durationHours,
    expiresAt,
    status: "ACTIVE",
  });

  return { pin, durationHours, expiresAt };
}
