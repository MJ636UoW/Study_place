import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "elite_study_zone_jwt_secret_secure_key_2026_sanctuary";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "student" | "admin";
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: TokenPayload, expiresIn: string = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUserFromCookies(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyJwtToken(token);
  } catch {
    return null;
  }
}

export function getCurrentUserFromRequest(req: NextRequest): TokenPayload | null {
  const token =
    req.cookies.get("auth_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyJwtToken(token);
}
