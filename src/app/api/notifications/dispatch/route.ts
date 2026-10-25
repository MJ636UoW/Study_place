import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications/notificationService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET || "sanctuary-cron-secret-production-9021";

    const isAuthorized =
      (authHeader && authHeader === `Bearer ${expectedSecret}`) ||
      (cronSecretHeader && cronSecretHeader === expectedSecret);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "UNAUTHORIZED_CRON_REQUEST: Valid CRON_SECRET is required to trigger notification dispatch." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const forceSimulateFailure = Boolean(body.forceSimulateFailure);

    const result = await NotificationService.dispatchPendingNotifications({
      forceSimulateFailure,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} notifications: ${result.succeeded} sent, ${result.failed} failed.`,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
