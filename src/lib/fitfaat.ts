/**
 * FitFaat & eSSL Biometric Integration Service
 * Connects Elite Study Zone bookings directly to FitFaat Partner API & eSSL Door Keypad
 */

const FITFAAT_CONFIG = {
  baseUrl: process.env.FITFAAT_BASE_URL || "https://www.fitfaat.com",
  masterId: process.env.FITFAAT_MASTER_ID || "Ihs8s9ycjkbOJw1mWNQq6Q",
  bearerToken: process.env.FITFAAT_BEARER_TOKEN || "elite@22zone",
  deviceId: process.env.FITFAAT_DEVICE_ID || "SDE7261100184",
  gymId: 5619,
};

interface SyncStudentParams {
  name: string;
  mobile: string;
  email?: string;
  biometricPin?: string;
  planDuration?: string;
}

export async function syncStudentWithFitFaat(params: SyncStudentParams): Promise<{
  success: boolean;
  message?: string;
  raw?: unknown;
}> {
  const { name, mobile, email = "", biometricPin, planDuration } = params;

  // Clean 10-digit mobile number
  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  if (!cleanMobile || cleanMobile.length !== 10) {
    return { success: false, message: "Valid 10-digit mobile number required for biometric sync." };
  }

  try {
    const postBody = new URLSearchParams({
      GymId: FITFAAT_CONFIG.masterId,
      Name: name || "Elite Scholar",
      Mobile: cleanMobile,
      Email: email,
      Gender: "Male",
      CountryId: "1",
      Image_base64String: "",
    });

    const regRes = await fetch(`${FITFAAT_CONFIG.baseUrl}/Api/Web/User_Registration_With_Gym_Prospect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FITFAAT_CONFIG.bearerToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: postBody.toString(),
    });

    const regData = await regRes.json();

    // Next, trigger Biometric Device association with the eSSL machine
    try {
      const bioBody = new URLSearchParams({
        MasterId: FITFAAT_CONFIG.masterId,
        UserId: cleanMobile,
        UserMobile: cleanMobile,
        Type: "Add",
        DeviceNo: FITFAAT_CONFIG.deviceId,
        GymUserMembershipId: "1",
      });

      await fetch(`${FITFAAT_CONFIG.baseUrl}/Api/Web/User_Biometric`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FITFAAT_CONFIG.bearerToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bioBody.toString(),
      });
    } catch (bioErr) {
      console.warn("[FitFaat] User_Biometric warning:", bioErr);
    }

    return {
      success: regData?.IsSuccess ?? true,
      message: regData?.Message || `Student registered in FitFaat & linked to eSSL machine ${FITFAAT_CONFIG.deviceId}`,
      raw: regData,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "FitFaat sync failed";
    console.warn("[FitFaat] Sync error:", msg);
    return { success: false, message: msg };
  }
}
