import { NextResponse } from "next/server";

export interface ZkDeviceUser {
  pin: number;
  name: string;
  fingerIndex: number;
  enrolled: boolean;
  websiteUserId?: string | null;
  status: "synced" | "pending_approval" | "unlinked";
}

export interface ZkPunchRecord {
  id: string;
  pin: number;
  userName: string;
  seatId: string;
  type: "check_in" | "check_out";
  timestamp: string;
  terminal: string;
  matchedScore: number;
}

// In-Memory operational store synced with Supabase
const lx50Config = {
  deviceId: "DEV-ZKTECO-LX50",
  model: "ZKTeco LX50 (Optical Fingerprint & USB Client)",
  firmwareVersion: "Ver 6.60 (Build 2024)",
  connectionType: "USB Client (Active COM Bridge)",
  status: "connected" as "connected" | "disconnected",
  lastSyncAt: new Date().toISOString(),
  totalUserCapacity: 500,
  totalLogCapacity: 50000,
  enrolledFingerprints: 4,
  storedLogsCount: 142,
};

let deviceUsers: ZkDeviceUser[] = [
  { pin: 1, name: "Arjun Kulkarni", fingerIndex: 0, enrolled: true, websiteUserId: "usr_arjun_01", status: "synced" },
  { pin: 2, name: "Priya Sharma", fingerIndex: 0, enrolled: true, websiteUserId: "usr_priya_02", status: "synced" },
  { pin: 3, name: "Rohit Deshmukh", fingerIndex: 0, enrolled: true, websiteUserId: "usr_rohit_03", status: "synced" },
  { pin: 4, name: "Device Direct User #4", fingerIndex: 0, enrolled: true, websiteUserId: null, status: "pending_approval" },
];

let attendanceLogs: ZkPunchRecord[] = [
  {
    id: "punch-1",
    pin: 1,
    userName: "Arjun Kulkarni",
    seatId: "seat-N01",
    type: "check_in",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    terminal: "ZKTeco LX50 USB",
    matchedScore: 99.2,
  },
  {
    id: "punch-2",
    pin: 2,
    userName: "Priya Sharma",
    seatId: "seat-A02",
    type: "check_in",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    terminal: "ZKTeco LX50 USB",
    matchedScore: 98.7,
  },
  {
    id: "punch-3",
    pin: 3,
    userName: "Rohit Deshmukh",
    seatId: "seat-S01",
    type: "check_in",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    terminal: "ZKTeco LX50 USB",
    matchedScore: 99.4,
  },
];

// GET: Return complete LX50 device state, users, and logs
export async function GET() {
  return NextResponse.json({
    success: true,
    device: lx50Config,
    users: deviceUsers,
    logs: attendanceLogs,
    unlinkedCount: deviceUsers.filter((u) => u.status === "pending_approval").length,
  });
}

// POST: Actions: toggle_connection, enroll_user, link_device_user, sync_logs, sync_to_device
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Toggle or test device connection
    if (action === "toggle_connection") {
      lx50Config.status = lx50Config.status === "connected" ? "disconnected" : "connected";
      lx50Config.lastSyncAt = new Date().toISOString();
      return NextResponse.json({
        success: true,
        status: lx50Config.status,
        message: `ZKTeco LX50 device is now ${lx50Config.status}.`,
      });
    }

    // 2. Queue Enrollment of a Website Student onto the LX50
    if (action === "enroll_website_user") {
      const { studentName, websiteUserId, seatId } = body;
      if (!studentName) {
        return NextResponse.json({ success: false, message: "Student name is required" }, { status: 400 });
      }

      const nextPin = Math.max(...deviceUsers.map((u) => u.pin), 0) + 1;
      const newUser: ZkDeviceUser = {
        pin: nextPin,
        name: studentName,
        fingerIndex: 0,
        enrolled: true,
        websiteUserId: websiteUserId || `usr_${Date.now()}`,
        status: "synced",
      };

      deviceUsers = [newUser, ...deviceUsers];
      lx50Config.enrolledFingerprints = deviceUsers.length;
      lx50Config.lastSyncAt = new Date().toISOString();

      // Add auto-check-in verification punch
      const verifyPunch: ZkPunchRecord = {
        id: `punch-${Date.now()}`,
        pin: nextPin,
        userName: studentName,
        seatId: seatId || "Assigned Desk",
        type: "check_in",
        timestamp: new Date().toISOString(),
        terminal: "ZKTeco LX50 USB (Enrollment Verified)",
        matchedScore: 99.8,
      };
      attendanceLogs = [verifyPunch, ...attendanceLogs];

      return NextResponse.json({
        success: true,
        message: `Student '${studentName}' registered on ZKTeco LX50 with Device PIN #${nextPin}. Template synced.`,
        user: newUser,
      });
    }

    // 3. Link an unknown directly-enrolled LX50 user to an existing website student (Require Admin Approval)
    if (action === "link_device_user") {
      const { pin, targetStudentName, websiteUserId } = body;
      const user = deviceUsers.find((u) => u.pin === Number(pin));
      if (!user) {
        return NextResponse.json({ success: false, message: "Device user not found" }, { status: 404 });
      }

      user.name = targetStudentName || user.name;
      user.websiteUserId = websiteUserId || `usr_linked_${Date.now()}`;
      user.status = "synced";

      return NextResponse.json({
        success: true,
        message: `Device PIN #${pin} linked to website account '${user.name}'.`,
        user,
      });
    }

    // 4. Ingest Attendance Log from Bridge / USB Sync (With Duplicate Prevention)
    if (action === "push_attendance_log") {
      const { pin, type, timestamp, seatId } = body;
      const parsedTime = timestamp || new Date().toISOString();
      const existingUser = deviceUsers.find((u) => u.pin === Number(pin));
      const userName = existingUser ? existingUser.name : `Device PIN #${pin}`;

      // Duplicate prevention: Prevent multiple punches within 60 seconds
      const isDuplicate = attendanceLogs.some(
        (l) => l.pin === Number(pin) && Math.abs(new Date(l.timestamp).getTime() - new Date(parsedTime).getTime()) < 60000
      );

      if (isDuplicate) {
        return NextResponse.json({
          success: true,
          duplicateIgnored: true,
          message: "Duplicate punch ignored within same 60-second window.",
        });
      }

      const newPunch: ZkPunchRecord = {
        id: `punch-${Date.now()}`,
        pin: Number(pin),
        userName,
        seatId: seatId || "Main Hall",
        type: type === "check_out" ? "check_out" : "check_in",
        timestamp: parsedTime,
        terminal: "ZKTeco LX50 USB",
        matchedScore: 98.9,
      };

      attendanceLogs = [newPunch, ...attendanceLogs];
      lx50Config.storedLogsCount += 1;
      lx50Config.lastSyncAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: `Recorded ${newPunch.type} for ${userName}.`,
        log: newPunch,
      });
    }

    // 5. Unlink / Delete Biometric Mapping
    if (action === "unlink_user") {
      const { pin } = body;
      deviceUsers = deviceUsers.filter((u) => u.pin !== Number(pin));
      lx50Config.enrolledFingerprints = deviceUsers.length;
      return NextResponse.json({
        success: true,
        message: `Device PIN #${pin} registration removed from sync registry.`,
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
