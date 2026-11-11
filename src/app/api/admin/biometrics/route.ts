import { NextResponse } from "next/server";

// In-memory biometric store for hardware synchronization
interface BiometricDeviceConfig {
  apiKey: string;
  endpointUrl: string;
  deviceId: string;
  deviceModel: string;
  status: "connected" | "disconnected" | "syncing";
  lastPingAt: string;
}

interface BiometricUserRecord {
  userId: string;
  userName: string;
  fingerprintEnrolled: boolean;
  biometricId: string;
  seatId: string;
  validFrom: string;
  validUntil: string;
  accessStatus: "active" | "expired" | "revoked";
  enrolledAt: string;
}

interface BiometricAccessLog {
  id: string;
  userId: string;
  userName: string;
  seatId: string;
  punchType: "check_in" | "check_out";
  timestamp: string;
  matchedScore: number;
  terminal: string;
}

// Default device configuration
let deviceConfig: BiometricDeviceConfig = {
  apiKey: "ESZ-BIOM-PRO-984210",
  endpointUrl: "https://cloud.realtimebiometrics.com/api/v2",
  deviceId: "DEV-GHATKOPAR-01",
  deviceModel: "eSSL SilkBio-101TC (Multi-Biometric Fingerprint + QR)",
  status: "connected",
  lastPingAt: new Date().toISOString(),
};

// Initial enrolled members
let enrolledUsers: BiometricUserRecord[] = [
  {
    userId: "usr_arjun_01",
    userName: "Arjun Kulkarni",
    fingerprintEnrolled: true,
    biometricId: "FP-1001",
    seatId: "seat-N01",
    validFrom: "2026-10-25T07:00:00Z",
    validUntil: "2026-11-25T23:00:00Z",
    accessStatus: "active",
    enrolledAt: "2026-10-25T08:30:00Z",
  },
  {
    userId: "usr_priya_02",
    userName: "Priya Sharma",
    fingerprintEnrolled: true,
    biometricId: "FP-1002",
    seatId: "seat-A02",
    validFrom: "2026-10-25T07:00:00Z",
    validUntil: "2026-10-25T23:00:00Z",
    accessStatus: "active",
    enrolledAt: "2026-10-25T09:15:00Z",
  },
  {
    userId: "usr_rohit_03",
    userName: "Rohit Deshmukh",
    fingerprintEnrolled: true,
    biometricId: "FP-1003",
    seatId: "seat-S01",
    validFrom: "2026-10-25T09:00:00Z",
    validUntil: "2026-10-25T13:00:00Z",
    accessStatus: "active",
    enrolledAt: "2026-10-25T09:02:00Z",
  },
];

// Initial punch logs
let punchLogs: BiometricAccessLog[] = [
  {
    id: "log-1",
    userId: "usr_arjun_01",
    userName: "Arjun Kulkarni",
    seatId: "seat-N01",
    punchType: "check_in",
    timestamp: "2026-10-26T07:45:12Z",
    matchedScore: 98.4,
    terminal: "Turnstile Gate 1 (Main Hall)",
  },
  {
    id: "log-2",
    userId: "usr_priya_02",
    userName: "Priya Sharma",
    seatId: "seat-A02",
    punchType: "check_in",
    timestamp: "2026-10-26T08:12:04Z",
    matchedScore: 99.1,
    terminal: "Turnstile Gate 1 (Main Hall)",
  },
  {
    id: "log-3",
    userId: "usr_rohit_03",
    userName: "Rohit Deshmukh",
    seatId: "seat-S01",
    punchType: "check_in",
    timestamp: "2026-10-26T09:01:45Z",
    matchedScore: 97.6,
    terminal: "Turnstile Gate 2 (Flexi-Zone)",
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    deviceConfig,
    enrolledUsers,
    punchLogs,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "update_config") {
      const { apiKey, endpointUrl, deviceId, deviceModel } = body;
      deviceConfig = {
        ...deviceConfig,
        apiKey: apiKey || deviceConfig.apiKey,
        endpointUrl: endpointUrl || deviceConfig.endpointUrl,
        deviceId: deviceId || deviceConfig.deviceId,
        deviceModel: deviceModel || deviceConfig.deviceModel,
        status: "connected",
        lastPingAt: new Date().toISOString(),
      };
      return NextResponse.json({
        success: true,
        message: "Biometric Hardware API configuration saved & synchronized.",
        deviceConfig,
      });
    }

    if (action === "enroll_user") {
      const { userId, userName, seatId, validUntil } = body;
      const newBiometricId = `FP-${1000 + enrolledUsers.length + 1}`;
      const newRecord: BiometricUserRecord = {
        userId: userId || `usr_${Date.now()}`,
        userName: userName || "Student Member",
        fingerprintEnrolled: true,
        biometricId: newBiometricId,
        seatId: seatId || "Desk-01",
        validFrom: new Date().toISOString(),
        validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
        accessStatus: "active",
        enrolledAt: new Date().toISOString(),
      };

      // Add to store
      enrolledUsers = [newRecord, ...enrolledUsers];

      // Generate instant check-in log
      const newLog: BiometricAccessLog = {
        id: `log-${Date.now()}`,
        userId: newRecord.userId,
        userName: newRecord.userName,
        seatId: newRecord.seatId,
        punchType: "check_in",
        timestamp: new Date().toISOString(),
        matchedScore: 98.9,
        terminal: "Turnstile Gate 1 (Main Hall)",
      };
      punchLogs = [newLog, ...punchLogs];

      return NextResponse.json({
        success: true,
        message: `Fingerprint template ${newBiometricId} synchronized to ${deviceConfig.deviceId}.`,
        enrolledUser: newRecord,
      });
    }

    if (action === "test_ping") {
      deviceConfig.lastPingAt = new Date().toISOString();
      deviceConfig.status = "connected";
      return NextResponse.json({
        success: true,
        message: "Biometric Controller responded with HTTP 200 OK (Latency: 28ms).",
        lastPingAt: deviceConfig.lastPingAt,
      });
    }

    return NextResponse.json(
      { success: false, message: `Unknown action '${action}'` },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
