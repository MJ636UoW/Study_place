import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handle multipart/form-data (File uploaded directly from camera or file picker)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const targetType = (formData.get("targetType") as string) || "general"; // 'seat', 'locker', 'layout'
      const targetId = (formData.get("targetId") as string) || "item";

      if (!file) {
        return NextResponse.json({ error: "No image file provided." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate file extension / mime type
      const mime = file.type || "image/jpeg";
      let ext = ".jpg";
      if (mime.includes("png")) ext = ".png";
      else if (mime.includes("webp")) ext = ".webp";
      else if (mime.includes("gif")) ext = ".gif";

      const safeId = targetId.replace(/[^a-zA-Z0-9_-]/g, "");
      const fileName = `${targetType}-${safeId}-${Date.now()}${ext}`;

      // Ensure public/uploads exists
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const publicUrl = `/uploads/${fileName}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          fileName,
          message: "Image uploaded successfully to server.",
        });
      } catch (writeErr) {
        console.warn("[Upload] Disk write fallback to Data URL:", writeErr);
        // Fallback for read-only serverless environments
        const base64Data = buffer.toString("base64");
        const dataUrl = `data:${mime};base64,${base64Data}`;
        return NextResponse.json({
          success: true,
          url: dataUrl,
          message: "Image processed successfully as Data URL.",
        });
      }
    }

    // 2. Handle application/json (Base64 payload)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { base64, targetType = "general", targetId = "item" } = body;

      if (!base64 || typeof base64 !== "string") {
        return NextResponse.json({ error: "Invalid base64 payload." }, { status: 400 });
      }

      // If it's already a Data URL or external URL, return it
      if (base64.startsWith("http://") || base64.startsWith("https://")) {
        return NextResponse.json({ success: true, url: base64 });
      }

      const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = ".jpg";

      if (matches) {
        const mime = matches[1];
        if (mime.includes("png")) ext = ".png";
        else if (mime.includes("webp")) ext = ".webp";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(base64, "base64");
      }

      const safeId = String(targetId).replace(/[^a-zA-Z0-9_-]/g, "");
      const fileName = `${targetType}-${safeId}-${Date.now()}${ext}`;
      const uploadsDir = path.join(process.cwd(), "public", "uploads");

      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/${fileName}`,
          message: "Base64 image saved successfully.",
        });
      } catch (e) {
        return NextResponse.json({
          success: true,
          url: base64, // Keep data URL
          message: "Image saved as Data URL.",
        });
      }
    }

    return NextResponse.json({ error: "Unsupported Content-Type." }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal upload error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
