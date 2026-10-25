import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications/notificationService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr_sterling_01";

    const notifications = NotificationService.getNotificationsForUser(userId);

    return NextResponse.json({
      success: true,
      userId,
      notifications,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
