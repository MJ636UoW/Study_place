"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  ShieldAlert,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  Clock,
  UserX,
  Wrench,
  MessageSquare,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
  History,
  QrCode,
  Building,
  Save,
  Key,
  Mail,
  ShieldCheck,
  Printer,
  Download,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { ConfigurationBanner } from "@/components/ui/ConfigurationBanner";
import { AdminService, AuditEvent, EnquiryItem, ModeratedReview } from "@/lib/admin/adminService";
import { BookingEngine } from "@/lib/booking/bookingEngine";
import { bookingsFixture } from "@/fixtures";
import { DEFAULT_PRICING_MATRIX, type PlanPricingRow, SHIFTS } from "@/lib/pricingMatrix";

export default function AdminPage() {
  // Operational Navigation
  const [activeQueue, setActiveQueue] = useState<
    "pending" | "holds" | "attendance" | "endings" | "exceptions" | "enquiries" | "reviews" | "audit" | "keypad" | "content" | "settings"
  >("pending");

  // Smart Door Keypad & Access Control Hardware State (Cloud Wi-Fi & Push-to-Exit)
  const [keypadApiKey, setKeypadApiKey] = useState("ESZ-KEYPAD-PRO-984210");
  const [keypadEndpoint, setKeypadEndpoint] = useState("https://elitestudyzone.in/api/door-access");
  const [keypadDeviceId, setKeypadDeviceId] = useState("DEV-WIFI-KEYPAD-01");
  const [keypadDeviceModel, setKeypadDeviceModel] = useState("Smart Wi-Fi Digital Touch Keypad + Interior Exit Button");
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [enrollStudentName, setEnrollStudentName] = useState("");
  const [enrollSeatId, setEnrollSeatId] = useState("Desk-04");
  const [enrollSlotWindow, setEnrollSlotWindow] = useState("07:00 — 11:00");
  const [unlinkedPinToLink, setUnlinkedPinToLink] = useState(482910);
  const [targetStudentForLink, setTargetStudentForLink] = useState("");
  
  // Door Keypad PIN Registry State (Strictly Valid for Student's Booked Slot)
  const [keypadUsers, setKeypadUsers] = useState<Array<{
    pin: number;
    name: string;
    slotWindow: string;
    status: "active_synced" | "scheduled";
  }>>([
    { pin: 839201, name: "Arjun Kulkarni", slotWindow: "07:00 — 11:00 (Today)", status: "active_synced" },
    { pin: 492014, name: "Priya Sharma", slotWindow: "08:00 — 12:00 (Today)", status: "active_synced" },
    { pin: 729104, name: "Rohit Deshmukh", slotWindow: "09:00 — 13:00 (Today)", status: "active_synced" },
    { pin: 482910, name: "Device Direct Entry PIN", slotWindow: "14:00 — 18:00 (Upcoming)", status: "scheduled" },
  ]);

  const [doorAccessLogs, setDoorAccessLogs] = useState<Array<{
    id: string;
    userName: string;
    seatId: string;
    action: string;
    timestamp: string;
    method: string;
    terminal: string;
  }>>([
    {
      id: "log-1",
      userName: "Arjun Kulkarni",
      seatId: "seat-N01",
      action: "Door Unlocked (Entry)",
      timestamp: "Today, 07:45 AM",
      method: "Door Keypad PIN (839201)",
      terminal: "Exterior Keypad",
    },
    {
      id: "log-exit-1",
      userName: "Arjun Kulkarni",
      seatId: "seat-N01",
      action: "Door Unlocked (Exit)",
      timestamp: "Today, 08:05 AM",
      method: "Push-to-Exit Button",
      terminal: "Interior Wall Button",
    },
    {
      id: "log-2",
      userName: "Priya Sharma",
      seatId: "seat-A02",
      action: "Door Unlocked (Entry)",
      timestamp: "Today, 08:12 AM",
      method: "Door Keypad PIN (492014)",
      terminal: "Exterior Keypad",
    },
    {
      id: "log-3",
      userName: "Rohit Deshmukh",
      seatId: "seat-S01",
      action: "Door Unlocked (Entry)",
      timestamp: "Today, 09:01 AM",
      method: "Door Keypad PIN (729104)",
      terminal: "Exterior Keypad",
    },
  ]);

  // Live state from AdminService & BookingEngine
  const [financial, setFinancial] = useState(AdminService.getFinancialBreakdown());
  const [pendingRequests, setPendingRequests] = useState(AdminService.getPendingRequests());
  const [expiringHolds, setExpiringHolds] = useState(AdminService.getExpiringHolds());
  const [selectedDate, setSelectedDate] = useState("2026-10-25");
  const [reservedSeats, setReservedSeats] = useState(AdminService.getReservedSeatsForDate("2026-10-25"));
  const [upcomingEndings, setUpcomingEndings] = useState(AdminService.getUpcomingEndings(7, "2026-10-25"));
  const [exceptions, setExceptions] = useState(AdminService.getPaymentExceptions());
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(AdminService.getEnquiries());
  const [reviews, setReviews] = useState<ModeratedReview[]>(AdminService.getReviews());
  const [auditLog, setAuditLog] = useState<AuditEvent[]>(AdminService.getAuditHistory());
  const [plans, setPlans] = useState(AdminService.getPlans());

  // Staff identity
  const staffId = "staff_curator_1";

  // Dialog states
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [isRestrictOpen, setIsRestrictOpen] = useState(false);
  const [isEnquiryReplyOpen, setIsEnquiryReplyOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [enquiryReplyText, setEnquiryReplyText] = useState("");

  // Operation Forms
  const [walkInSeat, setWalkInSeat] = useState("seat-N01");
  const [walkInGuest, setWalkInGuest] = useState("");
  const [walkInStart, setWalkInStart] = useState("2026-10-26");
  const [walkInEnd, setWalkInEnd] = useState("2026-11-02");

  const [cashReqId, setCashReqId] = useState("");
  const [cashRef, setCashRef] = useState("CASH-2026-");
  const [cashAmountPaise, setCashAmountPaise] = useState(249900);
  const [cashNotes, setCashNotes] = useState("Collected in person at Curatorial desk.");
  const [targetHoldForCash, setTargetHoldForCash] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<{
    invoiceNumber: string;
    receiptRef: string;
    studentName: string;
    studentEmail: string;
    seatId: string;
    planName: string;
    startDate: string;
    endDate: string;
    amountRupees: string;
    settledAt: string;
    passCode: string;
    staffName: string;
  } | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState("tier-resident");
  const [newPlanPriceINR, setNewPlanPriceINR] = useState(2499);
  const [newPlanName, setNewPlanName] = useState("");

  const [pricingMatrix, setPricingMatrix] = useState<PlanPricingRow[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("esz_admin_pricing_matrix");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return JSON.parse(JSON.stringify(DEFAULT_PRICING_MATRIX));
  });

  const handlePricingCellChange = (
    shiftId: string,
    tenure: "one_visit" | "week" | "month" | "weekend",
    val: number
  ) => {
    setPricingMatrix((prev) =>
      prev.map((row) => (row.shiftId === shiftId ? { ...row, [tenure]: val } : row))
    );
  };

  const handleSavePricingMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    AdminService.updatePricingMatrix(pricingMatrix, staffId);
    try {
      localStorage.setItem("esz_admin_pricing_matrix", JSON.stringify(pricingMatrix));
    } catch {}
    showToast("Pricing chart successfully updated and published across center!");
    setIsPlanOpen(false);
    refreshAllState();
  };

  const [maintSeat, setMaintSeat] = useState("seat-A02");
  const [maintStart, setMaintStart] = useState("2026-11-01");
  const [maintEnd, setMaintEnd] = useState("2026-11-07");
  const [maintReason, setMaintReason] = useState("Timber conditioning and acoustic panel realigning");

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("user-resident-1");
  const [restrictType, setRestrictType] = useState<"suspension" | "ban">("suspension");
  const [restrictDurationDays, setRestrictDurationDays] = useState(14);
  const [restrictReason, setRestrictReason] = useState("Acoustic noise threshold repeated violation");
  const [restrictRefundDecision, setRestrictRefundDecision] = useState<"initiate_refund" | "forfeit_per_terms" | "manual_review">("manual_review");
  const [restrictConfirmed, setRestrictConfirmed] = useState(false);

  // Admin & Payment Settings State
  const [adminEmailInput, setAdminEmailInput] = useState("admin@elitestudyzone.in");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("elitestudyzone@okhdfcbank");
  const [accountHolderInput, setAccountHolderInput] = useState("Elite Study Zone");
  const [accountNumberInput, setAccountNumberInput] = useState("50200084920192");
  const [ifscCodeInput, setIfscCodeInput] = useState("HDFC0000123");
  const [qrCodeUrlInput, setQrCodeUrlInput] = useState("");
  const [centerPhoneInput, setCenterPhoneInput] = useState("+91 98753 59327");
  const [razorpayKeyIdInput, setRazorpayKeyIdInput] = useState("");
  const [razorpayKeySecretInput, setRazorpayKeySecretInput] = useState("");
  const [gmailUserInput, setGmailUserInput] = useState("");
  const [gmailAppPassInput, setGmailAppPassInput] = useState("");
  const [googleClientIdInput, setGoogleClientIdInput] = useState("");
  const [whatsappPhoneIdInput, setWhatsappPhoneIdInput] = useState("");
  const [whatsappTokenInput, setWhatsappTokenInput] = useState("");
  const [whatsappNumberInput, setWhatsappNumberInput] = useState("+91 93246 89280");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CMS Content & Media Management State
  const [heroHeadlineInput, setHeroHeadlineInput] = useState("Your Space for Focus, Productivity & Success.");
  const [heroTaglineInput, setHeroTaglineInput] = useState("Welcome to Elite Study Zone");
  const [heroWelcomeTextInput, setHeroWelcomeTextInput] = useState("A peaceful, fully air-conditioned, distraction-free sanctuary designed for serious aspirants, students, and professionals in Ghatkopar West, Mumbai.");
  const [topBannerTextInput, setTopBannerTextInput] = useState("📍 Amrut Nagar, Ghatkopar West • 24/7 Smart Keypad Access • Flexible Passes from ₹49/hr");
  const [heroImageUrlInput, setHeroImageUrlInput] = useState("/desk-render-01.jpg");
  const [galleryImagesInput, setGalleryImagesInput] = useState("/desk-render-01.jpg, /reading-room-wide.jpg, /individual-stacks.jpg");
  const [hourlyRateInput, setHourlyRateInput] = useState(49);
  const [dayPassRateInput, setDayPassRateInput] = useState(249);
  const [weeklyRateInput, setWeeklyRateInput] = useState(799);
  const [monthlyRateInput, setMonthlyRateInput] = useState(2499);
  const [oneTimeRegFeeInput, setOneTimeRegFeeInput] = useState(200);
  const [wifiSsidInput, setWifiSsidInput] = useState("EliteStudy_5G");
  const [wifiPasswordInput, setWifiPasswordInput] = useState("FocusQuiet2026");
  const [centerAddressInput, setCenterAddressInput] = useState("Amrut Nagar, Near Shreyas Cinema, LBS Marg, Ghatkopar West, Mumbai 400086");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) {
          const s = d.settings;
          if (s.adminEmail) setAdminEmailInput(s.adminEmail);
          if (s.upiId) setUpiIdInput(s.upiId);
          if (s.accountHolder) setAccountHolderInput(s.accountHolder);
          if (s.accountNumber) setAccountNumberInput(s.accountNumber);
          if (s.ifscCode) setIfscCodeInput(s.ifscCode);
          if (s.qrCodeUrl) setQrCodeUrlInput(s.qrCodeUrl);
          if (s.centerPhone) setCenterPhoneInput(s.centerPhone);
          if (s.razorpayKeyId) setRazorpayKeyIdInput(s.razorpayKeyId);
          if (s.razorpayKeySecret) setRazorpayKeySecretInput(s.razorpayKeySecret);
          if (s.gmailUser) setGmailUserInput(s.gmailUser);
          if (s.gmailAppPass) setGmailAppPassInput(s.gmailAppPass);
          if (s.googleClientId) setGoogleClientIdInput(s.googleClientId);
          if (s.whatsappPhoneId) setWhatsappPhoneIdInput(s.whatsappPhoneId);
          if (s.whatsappNumber) setWhatsappNumberInput(s.whatsappNumber);
          if (s.heroHeadline) setHeroHeadlineInput(s.heroHeadline);
          if (s.heroTagline) setHeroTaglineInput(s.heroTagline);
          if (s.heroWelcomeText) setHeroWelcomeTextInput(s.heroWelcomeText);
          if (s.topBannerText) setTopBannerTextInput(s.topBannerText);
          if (s.heroImageUrl) setHeroImageUrlInput(s.heroImageUrl);
          if (s.galleryImages) setGalleryImagesInput(Array.isArray(s.galleryImages) ? s.galleryImages.join(", ") : s.galleryImages);
          if (s.hourlyRate) setHourlyRateInput(s.hourlyRate);
          if (s.dayPassRate) setDayPassRateInput(s.dayPassRate);
          if (s.weeklyRate) setWeeklyRateInput(s.weeklyRate);
          if (s.monthlyRate) setMonthlyRateInput(s.monthlyRate);
          if (s.oneTimeRegistrationFee) setOneTimeRegFeeInput(s.oneTimeRegistrationFee);
          if (s.wifiSsid) setWifiSsidInput(s.wifiSsid);
          if (s.wifiPassword) setWifiPasswordInput(s.wifiPassword);
          if (s.centerAddress) setCenterAddressInput(s.centerAddress);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsFeedback(null);

    if (newPasswordInput && newPasswordInput !== confirmPasswordInput) {
      setSettingsFeedback({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: adminEmailInput,
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput || undefined,
          upiId: upiIdInput,
          accountHolder: accountHolderInput,
          accountNumber: accountNumberInput,
          ifscCode: ifscCodeInput,
          qrCodeUrl: qrCodeUrlInput,
          centerPhone: centerPhoneInput,
          razorpayKeyId: razorpayKeyIdInput,
          razorpayKeySecret: razorpayKeySecretInput,
          gmailUser: gmailUserInput,
          gmailAppPass: gmailAppPassInput,
          googleClientId: googleClientIdInput,
          whatsappPhoneId: whatsappPhoneIdInput,
          whatsappToken: whatsappTokenInput,
          whatsappNumber: whatsappNumberInput,
          heroHeadline: heroHeadlineInput,
          heroTagline: heroTaglineInput,
          heroWelcomeText: heroWelcomeTextInput,
          topBannerText: topBannerTextInput,
          heroImageUrl: heroImageUrlInput,
          galleryImages: galleryImagesInput.split(",").map((s) => s.trim()).filter(Boolean),
          hourlyRate: Number(hourlyRateInput),
          dayPassRate: Number(dayPassRateInput),
          weeklyRate: Number(weeklyRateInput),
          monthlyRate: Number(monthlyRateInput),
          oneTimeRegistrationFee: Number(oneTimeRegFeeInput),
          wifiSsid: wifiSsidInput,
          wifiPassword: wifiPasswordInput,
          centerAddress: centerAddressInput,
        }),
      });

      const data = await res.json();
      setIsSavingSettings(false);

      if (!res.ok) {
        setSettingsFeedback({ type: "error", text: data.error || "Failed to save settings." });
        return;
      }

      setSettingsFeedback({ type: "success", text: "Settings saved successfully! Receiving UPI ID & Bank updated." });
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      showToast("Admin credentials and payment accounts updated successfully!");
    } catch (err: unknown) {
      setIsSavingSettings(false);
      setSettingsFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving settings.",
      });
    }
  };

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const refreshAllState = () => {
    setFinancial(AdminService.getFinancialBreakdown());
    setPendingRequests(AdminService.getPendingRequests());
    setExpiringHolds(AdminService.getExpiringHolds());
    setReservedSeats(AdminService.getReservedSeatsForDate(selectedDate));
    setUpcomingEndings(AdminService.getUpcomingEndings(7, selectedDate));
    setExceptions(AdminService.getPaymentExceptions());
    setEnquiries(AdminService.getEnquiries());
    setReviews(AdminService.getReviews());
    setAuditLog(AdminService.getAuditHistory());
    setPlans(AdminService.getPlans());
  };

  useEffect(() => {
    setReservedSeats(AdminService.getReservedSeatsForDate(selectedDate));
    setUpcomingEndings(AdminService.getUpcomingEndings(7, selectedDate));
  }, [selectedDate]);

  // Handlers for Queues
  const handleApproveRequest = async (requestId: string) => {
    const res = await AdminService.approveRequest(requestId, staffId, 15);
    if (res.success) {
      showToast(res.message || `Request Approved! Door PIN issued (#${res.passCode}) and dispatched via WhatsApp & Email.`);
      refreshAllState();
    } else {
      showToast(`Approval Failed: ${res.message}`);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt("State curatorial reason for rejection:") || "Curatorial desk review decision";
    const res = await AdminService.rejectRequest(requestId, staffId, reason);
    if (res.success) {
      showToast("Request rejected and hold released safely.");
      refreshAllState();
    }
  };

  const handleAttendance = (allocId: string, status: "attending" | "completed") => {
    AdminService.recordAttendance(allocId, status, staffId);
    showToast(`Physical Attendance Updated: ${status === "attending" ? "Member Checked In" : "Session Completed"}.`);
    refreshAllState();
  };

  const handleDispatchRefund = async (refundId: string) => {
    const res = await AdminService.dispatchRefund(refundId, staffId);
    if (res.success) {
      showToast(res.message);
      refreshAllState();
    }
  };

  const handleModerateReview = (reviewId: string, status: "approved" | "hidden") => {
    AdminService.moderateReview(reviewId, status, staffId);
    showToast(`Review visibility set to: ${status}.`);
    refreshAllState();
  };

  const handleSendEnquiryReply = () => {
    if (!selectedEnquiry) return;
    AdminService.respondToEnquiry(selectedEnquiry.id, enquiryReplyText, staffId);
    showToast(`Response dispatched to ${selectedEnquiry.email}.`);
    setIsEnquiryReplyOpen(false);
    setEnquiryReplyText("");
    refreshAllState();
  };

  // Operations dialog submissions
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await AdminService.createWalkIn({
      seatId: walkInSeat,
      userId: `user-walkin-${Date.now()}`,
      guestName: walkInGuest || "Walk-in Scholar",
      startDate: walkInStart,
      endDate: walkInEnd,
      staffId,
    });
    if (res.success) {
      showToast(`Walk-in residency confirmed! Pass: ${res.passCode}`);
      setIsWalkInOpen(false);
      setWalkInGuest("");
      refreshAllState();
    } else {
      showToast(`Walk-in failed: ${res.message}`);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await AdminService.recordCashPayment({
      bookingRequestId: cashReqId,
      staffId,
      receiptRef: cashRef,
      amountPaise: Number(cashAmountPaise),
      notes: cashNotes,
    });
    if (res.success) {
      const anyRes = res as any;
      showToast(`Cash payment verified & pass active! Pass: ${anyRes.passCode || ""}`);
      setIsCashOpen(false);
      refreshAllState();

      // Open printable & downloadable PDF Receipt Modal immediately
      setReceiptModalData({
        invoiceNumber: anyRes.invoiceNumber || `ESZ-CASH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        receiptRef: anyRes.receiptRef || cashRef,
        studentName: targetHoldForCash?.userId || "Scholar Member",
        studentEmail: targetHoldForCash?.userId === "user-resident-2" ? "deepakjoshi2149@gmail.com" : `${targetHoldForCash?.userId || "scholar"}@elitestudyzone.in`,
        seatId: targetHoldForCash?.seatId || anyRes.seatId || "Workstation Desk",
        planName: "Dedicated Study Sanctuary Pass (1 Month)",
        startDate: targetHoldForCash?.startDate || anyRes.startDate || "2026-10-25",
        endDate: targetHoldForCash?.endDate || anyRes.endDate || "2026-11-24",
        amountRupees: anyRes.amountRupees || (Number(cashAmountPaise) / 100).toFixed(2),
        settledAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }),
        passCode: anyRes.passCode || targetHoldForCash?.passCode || "PASS-2610-E73F10",
        staffName: "Staff Curator (Front Concierge Desk)",
      });
      setIsReceiptModalOpen(true);
    } else {
      showToast(`Cash recording failed: ${res.message}`);
    }
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AdminService.updatePlan(
      selectedPlanId,
      { priceRupees: Number(newPlanPriceINR), pricePaise: Number(newPlanPriceINR) * 100, name: newPlanName || undefined },
      staffId
    );
    if (res.success) {
      showToast("Plan updated! Historical price snapshots of prior bookings remain preserved.");
      setIsPlanOpen(false);
      refreshAllState();
    }
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AdminService.addMaintenanceBlock(maintSeat, maintStart, maintEnd, maintReason, staffId);
    if (res.success) {
      showToast(res.message);
      setIsMaintOpen(false);
      refreshAllState();
    }
  };

  const handleRestrictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restrictConfirmed) {
      alert("Please confirm the destructive action checkbox after reviewing affected bookings.");
      return;
    }
    const res = AdminService.restrictAccount({
      userId: selectedUserId,
      type: restrictType,
      durationDays: restrictType === "suspension" ? Number(restrictDurationDays) : undefined,
      reason: restrictReason,
      refundDecision: restrictRefundDecision,
      staffId,
    });
    if (res.success) {
      showToast(res.message);
      setIsRestrictOpen(false);
      setRestrictConfirmed(false);
      refreshAllState();
    }
  };

  const restrictionPreview = AdminService.getAccountRestrictionPreview(selectedUserId);

  return (
    <div className="w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 font-sans">
      <ConfigurationBanner />

      {/* Status Toast Alert */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 border border-forest-400 bg-forest-900 text-ivory-50 shadow-2xl text-xs font-mono flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ivory-300 gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
            <span>Curatorial Oversight • Internal Operations</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-charcoal-900 tracking-tight">
            Curator Ledger
          </h1>
          <p className="text-xs text-charcoal-600 font-sans">
            Real-time management of admissions, physical quietude, cash collections, and security governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/mfa"
            className="px-3 py-2 border border-amber-600/40 bg-amber-50 text-amber-900 text-xs font-mono flex items-center gap-1.5 hover:bg-amber-100 min-h-[44px]"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>MFA Security (AAL2)</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWalkInOpen(true)}
            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
          >
            Walk-in Admission
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCashOpen(true)}
            leftIcon={<Banknote className="w-3.5 h-3.5" />}
          >
            Record Cash
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlanOpen(true)}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Edit Plans
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaintOpen(true)}
            leftIcon={<Wrench className="w-3.5 h-3.5" />}
          >
            Maintenance
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsRestrictOpen(true)}
            leftIcon={<UserX className="w-3.5 h-3.5" />}
          >
            Ban / Suspend
          </Button>
        </div>
      </div>

      {/* Financial Breakdown Grid (Strict Accounting Separation) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 border border-ivory-300 bg-ivory-50 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-charcoal-500 font-bold">
            <CreditCard className="w-3.5 h-3.5 text-forest-700" />
            <span>Digital Captured</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            ₹{financial.digitalRupees}
          </div>
          <p className="text-[10px] text-charcoal-500">Razorpay provider settlements</p>
        </div>

        <div className="p-5 border border-ivory-300 bg-ivory-50 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-charcoal-500 font-bold">
            <Banknote className="w-3.5 h-3.5 text-amber-800" />
            <span>Cash Collections</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            ₹{financial.cashRupees}
          </div>
          <p className="text-[10px] text-charcoal-500">Desk receipt audit logs</p>
        </div>

        <div className="p-5 border border-ivory-300 bg-ivory-50 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-charcoal-500 font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-burgundy-700" />
            <span>Dispatched Refunds</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            ₹{financial.refundsRupees}
          </div>
          <p className="text-[10px] text-charcoal-500">Processed per policy</p>
        </div>

        <div className="p-5 border border-forest-300 bg-forest-50/60 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-forest-900 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span>Net Collections</span>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">
            ₹{financial.netRupees}
          </div>
          <p className="text-[10px] text-forest-800">Total net curatorial receipts</p>
        </div>
      </div>

      {/* Prioritized Action Queues Navigation Bar */}
      <div className="border border-ivory-300 bg-ivory-100/60 p-1.5 flex items-center gap-1 overflow-x-auto">
        {[
          { id: "pending", label: "Pending Intake", count: pendingRequests.length },
          { id: "holds", label: "Expiring Holds", count: expiringHolds.length },
          { id: "attendance", label: "Seat & Attendance", count: reservedSeats.length },
          { id: "keypad", label: "Smart Keypad & Door Access", count: keypadUsers.length },
          { id: "endings", label: "Upcoming Expirations", count: upcomingEndings.length },
          { id: "exceptions", label: "Payment Exceptions", count: exceptions.totalExceptionsCount },
          { id: "enquiries", label: "Inbound Enquiries", count: enquiries.filter((e) => e.status === "new").length },
          { id: "reviews", label: "Review Moderation", count: reviews.length },
          { id: "audit", label: "Audit Ledger", count: auditLog.length },
          { id: "content", label: "🎨 Site Content & Images CMS", count: 0 },
          { id: "settings", label: "Admin & Payment Settings", count: 0 },
        ].map((tab) => {
          const isActive = activeQueue === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveQueue(tab.id as typeof activeQueue)}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
                isActive
                  ? "bg-forest-900 text-ivory-50 shadow-editorial font-bold"
                  : "bg-ivory-50 text-charcoal-700 hover:bg-ivory-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isActive ? "bg-amber-600 text-ivory-50" : "bg-ivory-300 text-charcoal-900"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* QUEUE 1: PENDING INTAKE REQUESTS */}
      {activeQueue === "pending" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Pending Intake Requests</h2>
              <p className="text-xs text-charcoal-600">
                Student submissions awaiting curatorial approval. Approval atomically verifies availability and establishes a 15-minute expiring hold.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No pending intake requests at this time. All submissions processed.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {pendingRequests.map((req) => {
                const hasUtr = Boolean((req as any).utrNumber);
                return (
                  <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-900">{req.requestNumber}</span>
                        <span
                          className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold rounded ${
                            hasUtr
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {hasUtr ? "💳 UPI Payment Submitted" : req.status}
                        </span>
                      </div>
                      <div className="text-charcoal-900 font-semibold font-serif text-sm">
                        {req.guestNotes || "Member Applicant"} ({req.userId})
                      </div>
                      <div className="font-mono text-charcoal-600 text-[11px]">
                        Workstation: <strong>{req.seatId}</strong> • Interval: {req.startDate} → {req.endDate}
                      </div>
                      {hasUtr ? (
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 font-mono text-xs text-emerald-950 inline-block space-y-0.5">
                          <div>
                            <span className="text-emerald-700">Bank UTR Reference:</span>{" "}
                            <strong className="tracking-wider">{(req as any).utrNumber}</strong>
                          </div>
                          <div>
                            <span className="text-emerald-700">Payable Amount:</span>{" "}
                            <strong>₹{((req.totalPricePaise || 9900) / 100).toFixed(2)}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-forest-900 font-bold">
                          Price Snapshot: ₹{(req.totalPricePaise / 100).toFixed(2)} ({req.totalPricePaise} paise)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveRequest(req.id)}
                        className={hasUtr ? "bg-emerald-700 hover:bg-emerald-600 text-white font-bold" : ""}
                      >
                        {hasUtr ? "✅ Verify Payment & Issue Door PIN" : "Approve Hold (15 Min)"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-800 hover:bg-red-50 hover:text-red-950"
                        onClick={() => handleRejectRequest(req.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 2: EXPIRING PAYMENT HOLDS */}
      {activeQueue === "holds" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Expiring Curatorial Payment Holds</h2>
              <p className="text-xs text-charcoal-600">
                Workstations reserved temporarily for payment completion. Automatically released upon expiry.
              </p>
            </div>
          </div>

          {expiringHolds.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No active payment holds in countdown.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {expiringHolds.map((hold) => {
                const minutesLeft = Math.max(1, Math.round(((hold.holdExpiresAt || 0) - Date.now()) / 60000));
                return (
                  <div key={hold.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-900 font-serif text-base">{hold.seatId}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires in {minutesLeft} min</span>
                        </span>
                      </div>
                      <div className="text-charcoal-700">Guest Scholar: {hold.userId}</div>
                      <div className="text-charcoal-500 text-[11px]">
                        Pass Code: {hold.passCode} • Dates: {hold.startDate} → {hold.endDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCashReqId(hold.bookingRequestId || hold.id);
                          setCashRef(`CASH-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                          setCashAmountPaise(249900);
                          setCashNotes(`Curatorial counter cash settlement for ${hold.seatId} (${hold.userId}).`);
                          setTargetHoldForCash(hold);
                          setIsCashOpen(true);
                        }}
                      >
                        Settle via Cash
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const res = AdminService.releaseHold(hold.id, staffId);
                          if (res.success) {
                            showToast(`Hold on workstation ${hold.seatId} released immediately. Seat is now vacant.`);
                          } else {
                            showToast(res.message);
                          }
                          refreshAllState();
                        }}
                      >
                        Release
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUEUE: SMART WI-FI KEYPAD & DOOR ACCESS HARDWARE INTEGRATION */}
      {activeQueue === "keypad" && (
        <div className="p-6 border border-forest-200 bg-white rounded-md shadow-md space-y-6">
          {/* Header & Connection Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-forest-100 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-mono rounded font-bold uppercase mb-1">
                <span className={`w-2 h-2 rounded-full ${deviceConnected ? "bg-emerald-600 animate-pulse" : "bg-rose-500"}`} />
                <span>{deviceConnected ? "Smart Cloud Keypad + Exit Button Active & Online" : "Device Disconnected"}</span>
              </div>
              <h2 className="font-sans font-extrabold text-2xl text-charcoal-900">
                Door Access Control (Keypad Entry + Push-to-Exit)
              </h2>
              <p className="text-xs text-charcoal-600 font-sans">
                Real-time door lock management. Outer door unlocks via student PIN (valid strictly during booked slot); interior unlocks via push button.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={deviceConnected ? "outline" : "primary"}
                size="sm"
                onClick={() => {
                  setDeviceConnected(!deviceConnected);
                  showToast(deviceConnected ? "Access Controller disconnected." : "Smart Door Keypad connected over Wi-Fi!");
                }}
              >
                {deviceConnected ? "Disconnect Controller" : "Connect Controller"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => showToast("Door Keypad Synced: 4 active slot PINs verified, lock relay operational.")}
              >
                Sync Device PINs
              </Button>
            </div>
          </div>

          {/* Device Configuration & Telemetry Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Hardware Setup</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">Wi-Fi Smart Touch Keypad</div>
              <div className="text-[11px] text-slate-600">Outer Entry • IP68 Waterproof</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Exit Mechanism</span>
              <div className="font-bold text-forest-700 text-sm mt-0.5">Interior Push-to-Exit Button</div>
              <div className="text-[11px] text-slate-600">Stainless Steel NO/COM Relay</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Lock Hardware</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">600 lbs Electromagnetic Lock</div>
              <div className="text-[11px] text-emerald-600 font-bold">Relay Status: Secured (Energized)</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Active Time-Slot PINs</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{keypadUsers.length} Valid Passcodes</div>
              <div className="text-[11px] text-slate-600">Auto-Expire on Slot End: Active</div>
            </div>
          </div>

          {/* Action 1: Manually Issue / Sync Door PIN for a Student */}
          <div className="p-4 border border-forest-200 bg-forest-50/60 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-forest-950">
                1. Issue & Push Time-Bound Door PIN to Keypad
              </h3>
              <span className="text-[10px] font-mono uppercase bg-forest-200 text-forest-900 px-2 py-0.5 rounded font-bold">
                Cloud-to-Door Sync
              </span>
            </div>
            <p className="text-xs text-forest-900 font-sans">
              Enter student name and booked time slot to generate a random 6-digit PIN and dispatch it to the entrance keypad via Wi-Fi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Student Name (e.g. Rahul Mehta)"
                value={enrollStudentName}
                onChange={(e) => setEnrollStudentName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-charcoal-300 rounded font-sans bg-white"
              />
              <input
                type="text"
                placeholder="Time Slot (e.g. 10:00 — 14:00)"
                value={enrollSlotWindow}
                onChange={(e) => setEnrollSlotWindow(e.target.value)}
                className="w-48 px-3 py-2 text-xs border border-charcoal-300 rounded font-mono bg-white"
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (!enrollStudentName) return showToast("Please enter a student name.");
                  const randomPin = Math.floor(100000 + Math.random() * 900000);
                  const newUser = {
                    pin: randomPin,
                    name: enrollStudentName,
                    slotWindow: enrollSlotWindow || "07:00 — 11:00 (Today)",
                    status: "active_synced" as const,
                  };
                  setKeypadUsers([newUser, ...keypadUsers]);
                  setDoorAccessLogs([
                    {
                      id: `punch-${Date.now()}`,
                      userName: enrollStudentName,
                      seatId: enrollSeatId,
                      action: "Door Unlocked (Entry)",
                      timestamp: "Just now",
                      method: `Door Keypad PIN (${randomPin})`,
                      terminal: "Exterior Keypad",
                    },
                    ...doorAccessLogs,
                  ]);
                  setEnrollStudentName("");
                  showToast(`Student '${newUser.name}' generated PIN #${randomPin} valid for ${newUser.slotWindow}!`);
                }}
              >
                Push PIN to Keypad
              </Button>
            </div>
          </div>

          {/* Action 2: Link Temporary / Direct Guest PINs */}
          <div className="p-4 border border-amber-300 bg-amber-50/70 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-amber-950">
                2. Link Unassigned Keypad Passcode to Student
              </h3>
              <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                Guest Passcode Assignment
              </span>
            </div>
            <p className="text-xs text-amber-900 font-sans">
              Assign an existing keypad passcode to a registered student profile or extend valid slot duration.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-900">Unassigned PIN:</span>
                <select
                  value={unlinkedPinToLink}
                  onChange={(e) => setUnlinkedPinToLink(Number(e.target.value))}
                  className="px-3 py-2 text-xs font-mono border border-amber-300 rounded bg-white"
                >
                  {keypadUsers
                    .filter((u) => u.status === "scheduled")
                    .map((u) => (
                      <option key={u.pin} value={u.pin}>
                        PIN #{u.pin} ({u.name})
                      </option>
                    ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Assign to Student Name"
                value={targetStudentForLink}
                onChange={(e) => setTargetStudentForLink(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-amber-300 rounded font-sans bg-white"
              />

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (!targetStudentForLink) return showToast("Enter a student name to link PIN.");
                  setKeypadUsers(
                    keypadUsers.map((u) => (u.pin === unlinkedPinToLink ? { ...u, name: targetStudentForLink, status: "active_synced" } : u))
                  );
                  showToast(`PIN #${unlinkedPinToLink} successfully assigned to ${targetStudentForLink}!`);
                  setTargetStudentForLink("");
                }}
              >
                Assign & Activate PIN
              </Button>
            </div>
          </div>

          {/* Table: Active Door Keypad PINs Registry */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-sm text-charcoal-900">
              Active & Scheduled Door Keypad PINs ({keypadUsers.length})
            </h3>
            <div className="border border-charcoal-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Door Keypad PIN</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Valid Time Slot Window</th>
                    <th className="p-3">Device Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-200 bg-white">
                  {keypadUsers.map((u) => (
                    <tr key={u.pin} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-forest-700">#{u.pin}</td>
                      <td className="p-3 font-sans font-bold text-charcoal-900">{u.name}</td>
                      <td className="p-3 text-charcoal-700">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {u.slotWindow}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === "active_synced"
                              ? "bg-forest-100 text-forest-900"
                              : "bg-amber-100 text-amber-900 animate-pulse"
                          }`}
                        >
                          {u.status === "active_synced" ? "Active on Keypad" : "Scheduled Slot"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setKeypadUsers(keypadUsers.filter((item) => item.pin !== u.pin));
                            showToast(`Revoked PIN #${u.pin} from door lock keypad.`);
                          }}
                          className="text-rose-600 hover:underline font-bold text-[11px]"
                        >
                          Revoke PIN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Real-Time Door Access Activity Ledger (Entry + Push-to-Exit) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-charcoal-900">
                Live Door Access & Exit Activity Ledger
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Outer keypad PIN entries & interior push-to-exit unlocks
              </span>
            </div>
            <div className="border border-charcoal-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-forest-950 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Assigned Desk</th>
                    <th className="p-3">Door Action</th>
                    <th className="p-3">Access Method</th>
                    <th className="p-3">Hardware Terminal</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-200 bg-white">
                  {doorAccessLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-forest-50/50">
                      <td className="p-3 font-bold font-sans text-charcoal-900">{log.userName}</td>
                      <td className="p-3 text-forest-700 font-bold">{log.seatId}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action.includes("Exit") ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-charcoal-600">{log.method}</td>
                      <td className="p-3 text-charcoal-600">{log.terminal}</td>
                      <td className="p-3 text-right text-charcoal-500">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUEUE 3: SEAT CALENDAR & ATTENDANCE */}
      {activeQueue === "attendance" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-4">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Seat Calendar & Daily Attendance</h2>
              <p className="text-xs text-charcoal-600">
                Distinguishes contractual workstation reservations from physical scholar check-ins.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <label htmlFor="calendar-date" className="text-charcoal-700 font-bold flex items-center gap-1">
                <Calendar className="w-4 h-4 text-forest-800" />
                <span>Date:</span>
              </label>
              <input
                id="calendar-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-ivory-300 bg-ivory-100 text-charcoal-900 font-mono text-xs"
              />
            </div>
          </div>

          {reservedSeats.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No active reservations or walk-ins recorded for {selectedDate}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-ivory-200/60 font-mono text-[10px] uppercase tracking-wider text-charcoal-700 border-b border-ivory-300">
                  <tr>
                    <th className="p-3">Workstation</th>
                    <th className="p-3">Guest Fellow</th>
                    <th className="p-3">Tenure Range</th>
                    <th className="p-3">Reservation State</th>
                    <th className="p-3">Physical Attendance</th>
                    <th className="p-3 text-right">Concierge Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 font-mono text-xs text-charcoal-800">
                  {reservedSeats.map((seat) => (
                    <tr key={seat.id} className="hover:bg-ivory-100/50">
                      <td className="p-3 font-bold text-charcoal-950">{seat.seatId}</td>
                      <td className="p-3 text-charcoal-700 font-sans">{seat.userId}</td>
                      <td className="p-3 text-charcoal-600 text-[11px]">{seat.startDate} → {seat.endDate}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-forest-100 text-forest-900 text-[10px] uppercase font-bold">
                          {seat.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                            seat.attendanceStatus === "attending"
                              ? "bg-emerald-200 text-emerald-950 font-black"
                              : seat.attendanceStatus === "completed"
                              ? "bg-charcoal-200 text-charcoal-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {seat.attendanceStatus === "attending"
                            ? "In Studio (Checked In)"
                            : seat.attendanceStatus === "completed"
                            ? "Checked Out"
                            : "Reserved (Expected)"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {seat.attendanceStatus !== "attending" && seat.attendanceStatus !== "completed" && (
                            <button
                              type="button"
                              onClick={() => handleAttendance(seat.id, "attending")}
                              className="px-2.5 py-1 bg-forest-900 text-ivory-50 text-[10px] uppercase hover:bg-forest-800 min-h-[38px]"
                            >
                              Check In
                            </button>
                          )}
                          {seat.attendanceStatus === "attending" && (
                            <button
                              type="button"
                              onClick={() => handleAttendance(seat.id, "completed")}
                              className="px-2.5 py-1 border border-charcoal-400 text-charcoal-900 text-[10px] uppercase hover:bg-ivory-200 min-h-[38px]"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUEUE 4: UPCOMING MEMBERSHIP EXPIRATIONS */}
      {activeQueue === "endings" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Upcoming Membership Expirations</h2>
              <p className="text-xs text-charcoal-600">
                Fellowships concluding within the next 7 days for turnover or renewal dispatch.
              </p>
            </div>
          </div>

          {upcomingEndings.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No memberships terminating within 7 days of {selectedDate}.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {upcomingEndings.map((ending) => (
                <div key={ending.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-base font-serif font-bold text-charcoal-900">
                      Station: {ending.seatId} ({ending.userId})
                    </div>
                    <div className="text-charcoal-600">
                      Concludes: <strong className="text-amber-900">{ending.endDate}</strong> (Pass: {ending.passCode})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showToast(`Renewal intake opened for ${ending.userId}. Contiguous next tenure created.`);
                      }}
                    >
                      Offer Renewal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 5: PAYMENT & REFUND EXCEPTIONS */}
      {activeQueue === "exceptions" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Payment & Refund Exceptions</h2>
              <p className="text-xs text-charcoal-600">
                Late captured payments routed to refunds, failed attempts, and pending disbursements.
              </p>
            </div>
          </div>

          {exceptions.pendingRefunds.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500 font-mono text-xs">
              No outstanding payment or refund exceptions. All ledgers balanced.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {exceptions.pendingRefunds.map((ref) => (
                <div key={ref.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-burgundy-900">{ref.id}</span>
                      <span className="px-2 py-0.5 bg-burgundy-100 text-burgundy-900 text-[10px] uppercase font-bold">
                        {ref.status}
                      </span>
                    </div>
                    <div className="text-charcoal-900 font-bold">
                      Amount: ₹{(ref.amountPaise / 100).toFixed(2)} ({ref.amountPaise} paise)
                    </div>
                    <p className="text-charcoal-600 font-sans text-xs">{ref.reason}</p>
                    <div className="text-[11px] text-charcoal-500">Provider Payment ID: {ref.paymentAttemptId}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ref.status === "requested" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDispatchRefund(ref.id)}
                        className="bg-burgundy-800 hover:bg-burgundy-900 text-ivory-50"
                      >
                        Dispatch to Razorpay
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE 6: INBOUND CONCIERGE ENQUIRIES */}
      {activeQueue === "enquiries" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Inbound Concierge Enquiries</h2>
              <p className="text-xs text-charcoal-600">
                Prospective scholar dispatches requiring curatorial response.
              </p>
            </div>
          </div>

          <div className="divide-y divide-ivory-200">
            {enquiries.map((enq) => (
              <div key={enq.id} className="py-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-charcoal-950">{enq.fullName}</span>
                    <span className="font-mono text-charcoal-500">({enq.email})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                      enq.status === "new" ? "bg-amber-200 text-amber-950" : "bg-forest-100 text-forest-900"
                    }`}
                  >
                    {enq.status}
                  </span>
                </div>
                <div className="font-serif text-sm font-semibold text-charcoal-900">{enq.topic}</div>
                <p className="text-charcoal-700 italic leading-relaxed">“{enq.message}”</p>
                {enq.curatorResponse && (
                  <div className="p-3 bg-ivory-200/60 border border-ivory-300 font-mono text-[11px] text-charcoal-800">
                    Curator Reply: {enq.curatorResponse}
                  </div>
                )}
                {enq.status === "new" && (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setIsEnquiryReplyOpen(true);
                      }}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Draft Curatorial Reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUEUE 7: REVIEW MODERATION */}
      {activeQueue === "reviews" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">Member Testimonial Moderation</h2>
              <p className="text-xs text-charcoal-600">
                Curate public testimonials displayed across admissions and residency pages.
              </p>
            </div>
          </div>

          <div className="divide-y divide-ivory-200">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-charcoal-950">{rev.author}</span>
                    <span className="text-charcoal-500 font-sans">({rev.role})</span>
                    <span
                      className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                        rev.status === "approved" ? "bg-forest-100 text-forest-900" : "bg-red-100 text-red-900"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <p className="text-charcoal-700 italic">“{rev.quote}”</p>
                  <div className="font-mono text-[11px] text-charcoal-500">{rev.membershipTenure}</div>
                </div>

                <div className="flex items-center gap-2">
                  {rev.status === "approved" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-800 hover:bg-red-50"
                      onClick={() => handleModerateReview(rev.id, "hidden")}
                    >
                      Hide Review
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleModerateReview(rev.id, "approved")}
                    >
                      Approve & Publish
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUEUE 8: IMMUTABLE AUDIT HISTORY */}
      {activeQueue === "audit" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900 flex items-center gap-2">
                <History className="w-5 h-5 text-forest-800" />
                <span>Immutable Curatorial Audit Ledger</span>
              </h2>
              <p className="text-xs text-charcoal-600 font-sans">
                Chronological proof log recording who changed what, when, and why. Tamper-evident record.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-ivory-200/60 text-[10px] uppercase tracking-wider text-charcoal-700 border-b border-ivory-300">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Staff Actor</th>
                  <th className="p-3">Operation Action</th>
                  <th className="p-3">Target Resource</th>
                  <th className="p-3">Curatorial Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 text-charcoal-800 text-[11px]">
                {auditLog.map((log) => (
                  <tr key={log.id} className="hover:bg-ivory-100/50">
                    <td className="p-3 text-charcoal-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-charcoal-950">{log.actorId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-ivory-200 text-charcoal-900 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-charcoal-700">{log.resourceType}: {log.resourceId}</td>
                    <td className="p-3 text-charcoal-600 font-sans">{log.reason || "Operational routine"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUEUE 10: SITE CONTENT, IMAGES & MEDIA CMS */}
      {activeQueue === "content" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-forest-800" />
                <span>Site Content, Images & Media Management (CMS)</span>
              </h2>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Edit all website headlines, welcoming messages, images, photo galleries, Wi-Fi passwords, and pricing fees in real-time.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="bg-forest-700 hover:bg-forest-600 text-white font-bold gap-2 px-6 self-start sm:self-auto"
            >
              {isSavingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving CMS…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Website Content</span>
                </>
              )}
            </Button>
          </div>

          {/* Feedback Banner */}
          {settingsFeedback && (
            <div
              className={`p-3.5 rounded-lg text-xs font-sans flex items-start gap-2.5 ${
                settingsFeedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
                  : "bg-rose-50 border border-rose-300 text-rose-950"
              }`}
            >
              {settingsFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <p className="leading-snug">{settingsFeedback.text}</p>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION 1: HOMEPAGE HEADLINES & TEXT */}
              <div className="p-5 bg-white border border-ivory-200 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-ivory-100">
                  <FileText className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">Homepage Headlines & Welcoming Text</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Main Homepage Headline
                    </label>
                    <input
                      type="text"
                      value={heroHeadlineInput}
                      onChange={(e) => setHeroHeadlineInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Welcome Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={heroTaglineInput}
                      onChange={(e) => setHeroTaglineInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Welcoming Message Description
                    </label>
                    <textarea
                      rows={3}
                      value={heroWelcomeTextInput}
                      onChange={(e) => setHeroWelcomeTextInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Top Announcement Bar Text
                    </label>
                    <input
                      type="text"
                      value={topBannerTextInput}
                      onChange={(e) => setTopBannerTextInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PHOTOS & MEDIA MANAGEMENT */}
              <div className="p-5 bg-white border border-ivory-200 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-ivory-100">
                  <Sparkles className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">Center Photos & Gallery Images</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Primary Study Hall Banner Image URL
                    </label>
                    <input
                      type="text"
                      value={heroImageUrlInput}
                      onChange={(e) => setHeroImageUrlInput(e.target.value)}
                      placeholder="e.g. /desk-render-01.jpg or https://..."
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                    />
                    {heroImageUrlInput && (
                      <div className="mt-2 p-1 border border-charcoal-200 rounded bg-slate-50 w-24 h-16 overflow-hidden">
                        <img
                          src={heroImageUrlInput}
                          alt="Hero Preview"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Study Hall Gallery Images (Comma-separated URLs)
                    </label>
                    <textarea
                      rows={3}
                      value={galleryImagesInput}
                      onChange={(e) => setGalleryImagesInput(e.target.value)}
                      placeholder="/reading-room-wide.jpg, /individual-stacks.jpg"
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                    />
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {galleryImagesInput
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((url, i) => (
                          <div key={i} className="w-16 h-12 border border-charcoal-200 rounded overflow-hidden flex-shrink-0 bg-slate-100">
                            <img
                              src={url}
                              alt={`Thumb ${i}`}
                              className="w-full h-full object-cover"
                              onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: RATES & ONE-TIME REGISTRATION FEE */}
              <div className="p-5 bg-white border border-ivory-200 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-ivory-100">
                  <Banknote className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">Pricing & One-Time Member Registration Fee</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Hourly Flex Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      value={hourlyRateInput}
                      onChange={(e) => setHourlyRateInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono font-bold"
                    />
                    <p className="text-[10px] text-charcoal-500 mt-0.5">Always ₹0 registration fee</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Day Pass Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={dayPassRateInput}
                      onChange={(e) => setDayPassRateInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono font-bold"
                    />
                    <p className="text-[10px] text-charcoal-500 mt-0.5">Always ₹0 registration fee</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Weekly Sprint Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={weeklyRateInput}
                      onChange={(e) => setWeeklyRateInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Monthly Resident Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyRateInput}
                      onChange={(e) => setMonthlyRateInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-ivory-200">
                  <label className="block text-xs font-bold text-forest-950 mb-1">
                    One-Time Member Registration Fee for Weekly/Monthly (₹)
                  </label>
                  <input
                    type="number"
                    value={oneTimeRegFeeInput}
                    onChange={(e) => setOneTimeRegFeeInput(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-emerald-400 bg-emerald-50 text-emerald-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono font-bold"
                  />
                  <p className="text-[10px] text-charcoal-600 mt-1">
                    Charged only ONCE on the first weekly or monthly package purchase. Permanently waived on renewals.
                  </p>
                </div>
              </div>

              {/* SECTION 4: WI-FI & CENTER DETAILS */}
              <div className="p-5 bg-white border border-ivory-200 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-ivory-100">
                  <ShieldCheck className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">Center Wi-Fi, Address & Contact</h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                        Wi-Fi Network SSID
                      </label>
                      <input
                        type="text"
                        value={wifiSsidInput}
                        onChange={(e) => setWifiSsidInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                        Wi-Fi Password
                      </label>
                      <input
                        type="text"
                        value={wifiPasswordInput}
                        onChange={(e) => setWifiPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Center Physical Address
                    </label>
                    <input
                      type="text"
                      value={centerAddressInput}
                      onChange={(e) => setCenterAddressInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Helpline / WhatsApp Contact Number
                    </label>
                    <input
                      type="text"
                      value={centerPhoneInput}
                      onChange={(e) => setCenterPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-ivory-200 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingSettings}
                className="bg-forest-700 hover:bg-forest-600 text-white font-bold gap-2 px-8 py-3 shadow-md"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving CMS Settings…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Website Content & Media</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* QUEUE 11: ADMIN & PAYMENT SETTINGS */}
      {activeQueue === "settings" && (
        <div className="p-6 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-200 gap-2">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-forest-800" />
                <span>Admin Security & Payment Accounts</span>
              </h2>
              <p className="text-xs text-charcoal-600 mt-0.5">
                Manage admin login credentials, email ID, password, and the bank/UPI accounts that receive student payments.
              </p>
            </div>
          </div>

          {/* Feedback Banner */}
          {settingsFeedback && (
            <div
              className={`p-3.5 rounded-lg text-xs font-sans flex items-start gap-2.5 ${
                settingsFeedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
                  : "bg-rose-50 border border-rose-300 text-rose-950"
              }`}
            >
              {settingsFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="leading-snug">{settingsFeedback.text}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              {/* SECTION A: ADMIN LOGIN & SECURITY */}
              <div className="p-5 bg-white border border-ivory-200 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-ivory-100">
                  <Key className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">Admin Account Credentials</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Admin Email ID (Username for Login)
                    </label>
                    <input
                      type="email"
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-slate-50/50"
                    />
                    <p className="text-[10px] text-charcoal-500 mt-1">
                      This email receives admin alerts, booking notifications, and is used to log in.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="text-[11px] font-bold text-charcoal-800">Change Admin Password</div>
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-600 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter current password to verify"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-charcoal-600 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          placeholder="Create new password"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-charcoal-600 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          placeholder="Re-type new password"
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Center Contact Mobile / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={centerPhoneInput}
                      onChange={(e) => setCenterPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: UPI & BANK ACCOUNT FOR STUDENT PAYMENTS */}
              <div className="p-5 bg-white border border-ivory-200 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-ivory-100">
                  <CreditCard className="w-4 h-4 text-forest-700" />
                  <h3 className="font-serif text-base font-bold text-charcoal-900">
                    Student Payment Receiving Accounts (UPI & Bank)
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Receiving UPI ID (PhonePe / GPay / Paytm / BHIM)
                    </label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="e.g. elitestudyzone@okhdfcbank or 9876543210@paytm"
                      required
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono font-bold text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-slate-50/50"
                    />
                    <p className="text-[10px] text-charcoal-500 mt-1">
                      This exact UPI ID is presented to students when booking workstations on the website.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Bank Account Beneficiary / Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolderInput}
                      onChange={(e) => setAccountHolderInput(e.target.value)}
                      placeholder="e.g. Elite Study Zone"
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={accountNumberInput}
                        onChange={(e) => setAccountNumberInput(e.target.value)}
                        placeholder="e.g. 50200084920192"
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                        Bank IFSC Code
                      </label>
                      <input
                        type="text"
                        value={ifscCodeInput}
                        onChange={(e) => setIfscCodeInput(e.target.value)}
                        placeholder="e.g. HDFC0000123"
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Custom UPI QR Code Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={qrCodeUrlInput}
                      onChange={(e) => setQrCodeUrlInput(e.target.value)}
                      placeholder="https://your-domain.com/my-upi-qr.png"
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                    />
                    <p className="text-[10px] text-charcoal-500 mt-1">
                      Paste a direct image URL of your shop or business UPI QR code to display it to students.
                    </p>
                  </div>

                  {/* QR Code Preview Box */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-4">
                    <div className="w-16 h-16 bg-white border border-charcoal-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {qrCodeUrlInput ? (
                        <img src={qrCodeUrlInput} alt="Preview QR" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-10 h-10 text-charcoal-700" />
                      )}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-charcoal-900">Student Checkout Preview</div>
                      <div className="text-[11px] text-charcoal-600">
                        Paying to: <strong>{accountHolderInput || "Elite Study Zone"}</strong>
                      </div>
                      <div className="font-mono text-[10px] text-forest-800">
                        {upiIdInput || "elitestudyzone@okhdfcbank"}
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Gateway API Keys */}
                  <div className="pt-3 border-t border-charcoal-200/80 space-y-2">
                    <div className="font-bold text-xs text-charcoal-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Razorpay Official Gateway Keys (Optional)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Razorpay Key ID
                        </label>
                        <input
                          type="text"
                          value={razorpayKeyIdInput}
                          onChange={(e) => setRazorpayKeyIdInput(e.target.value)}
                          placeholder="rzp_live_... or rzp_test_..."
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Razorpay Key Secret
                        </label>
                        <input
                          type="password"
                          value={razorpayKeySecretInput}
                          onChange={(e) => setRazorpayKeySecretInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-charcoal-500">
                      Obtain your API Key from razorpay.com → Settings → API Keys to activate Credit Cards, Net Banking & Wallets.
                    </p>
                  </div>

                  {/* Gmail SMTP Dispatch Settings */}
                  <div className="pt-3 border-t border-charcoal-200/80 space-y-2">
                    <div className="font-bold text-xs text-charcoal-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-forest-700" />
                      <span>Email Delivery (Gmail SMTP / Google App Password)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Sender Gmail Address
                        </label>
                        <input
                          type="email"
                          value={gmailUserInput}
                          onChange={(e) => setGmailUserInput(e.target.value)}
                          placeholder="e.g. elitestudyzone@gmail.com"
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Google App Password (16 Letters)
                        </label>
                        <input
                          type="password"
                          value={gmailAppPassInput}
                          onChange={(e) => setGmailAppPassInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-charcoal-500">
                      To send verification and booking confirmation emails directly to students' inboxes: Go to Google Account → Security → 2-Step Verification → App Passwords, generate a 16-letter App Password, and paste it here.
                    </p>
                  </div>

                  {/* Google OAuth Client ID Settings */}
                  <div className="pt-3 border-t border-charcoal-200/80 space-y-2">
                    <div className="font-bold text-xs text-charcoal-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-forest-700" />
                      <span>Google OAuth 2.0 Web Client ID (Google Sign-In)</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                        Google Cloud Client ID
                      </label>
                      <input
                        type="text"
                        value={googleClientIdInput}
                        onChange={(e) => setGoogleClientIdInput(e.target.value)}
                        placeholder="e.g. 10839281928-xxxxxxxx.apps.googleusercontent.com"
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>
                    <p className="text-[10px] text-charcoal-500 leading-relaxed">
                      To enable native Google One-Tap popup: Go to <strong>console.cloud.google.com</strong> → APIs &amp; Services → Credentials → Create OAuth Client ID (Web Application), set Authorized JavaScript Origin to <code>https://elitestudyzone.in</code>, and paste your Web Client ID here.
                    </p>
                  </div>

                  {/* WhatsApp Business Cloud API & AI Bot Settings */}
                  <div className="pt-3 border-t border-charcoal-200/80 space-y-2">
                    <div className="font-bold text-xs text-charcoal-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Business Cloud API & AI Concierge Bot</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">Dual Dispatch Ready</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          WhatsApp Business Phone Number
                        </label>
                        <input
                          type="text"
                          value={whatsappNumberInput}
                          onChange={(e) => setWhatsappNumberInput(e.target.value)}
                          placeholder="+91 98753 59327"
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Meta Phone Number ID
                        </label>
                        <input
                          type="text"
                          value={whatsappPhoneIdInput}
                          onChange={(e) => setWhatsappPhoneIdInput(e.target.value)}
                          placeholder="e.g. 109283746591029"
                          className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                        Meta Permanent Access Token (System User Token)
                      </label>
                      <input
                        type="password"
                        value={whatsappTokenInput}
                        onChange={(e) => setWhatsappTokenInput(e.target.value)}
                        placeholder="EAABw..."
                        className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                      />
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-charcoal-600 space-y-1">
                      <div><strong>AI Bot Webhook Callback URL:</strong> <code>https://elitestudyzone.in/api/whatsapp/webhook</code></div>
                      <div><strong>Verify Token:</strong> <code>esz_whatsapp_verify_token_2026</code></div>
                      <div className="text-emerald-700">✓ Every student registration and hourly pass automatically sends door PIN and access details to both WhatsApp and Email!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Action Bar */}
            <div className="p-4 bg-white border border-ivory-200 rounded-xl flex items-center justify-between shadow-sm">
              <span className="text-xs text-charcoal-600">
                Changes apply immediately to your admin login and to student checkouts across the site.
              </span>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingSettings}
                className="bg-forest-700 hover:bg-forest-600 text-white font-bold gap-2 px-6"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Admin & Payment Settings</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          OPERATIONAL ACTION DIALOGS
          ========================================================================= */}

      {/* 1. Walk-In Admission Dialog */}
      <Dialog
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title="Immediate Walk-in Admission"
        description="Assign a fellow directly to an open workstation without prior online application."
        maxWidth="lg"
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs font-sans text-left">
          <Input
            label="Guest Fellow Full Name"
            value={walkInGuest}
            onChange={(e) => setWalkInGuest(e.target.value)}
            required
            placeholder="e.g. Julian Hayes"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="walkin-seat" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
                Workstation Seat
              </label>
              <select
                id="walkin-seat"
                value={walkInSeat}
                onChange={(e) => setWalkInSeat(e.target.value)}
                className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
              >
                <option value="seat-N01">seat-N01 (North Study)</option>
                <option value="seat-A01">seat-A01 (North Gallery)</option>
                <option value="seat-A03">seat-A03 (North Gallery)</option>
                <option value="seat-S01">seat-S01 (Library Stacks)</option>
              </select>
            </div>
            <div>
              <Input
                label="Commencement Date"
                type="date"
                value={walkInStart}
                onChange={(e) => setWalkInStart(e.target.value)}
                required
              />
            </div>
          </div>
          <Input
            label="Conclusion Date"
            type="date"
            value={walkInEnd}
            onChange={(e) => setWalkInEnd(e.target.value)}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsWalkInOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Issue Walk-in Pass</Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Cash Payment Recording Dialog */}
      <Dialog
        isOpen={isCashOpen}
        onClose={() => setIsCashOpen(false)}
        title="Record In-Person Cash Settlement"
        description="Register currency received at the Curatorial Desk, advance workstation hold to active, and generate printable PDF receipt."
        maxWidth="lg"
      >
        <form onSubmit={handleCashSubmit} className="space-y-4 text-xs font-sans text-left">
          {targetHoldForCash && (
            <div className="p-3 bg-forest-50 border border-forest-200 rounded-lg text-forest-950 font-mono text-[11px] space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>WORKSTATION: {targetHoldForCash.seatId}</span>
                <span className="text-forest-700">GUEST: {targetHoldForCash.userId}</span>
              </div>
              <div className="text-forest-800 text-[10px]">
                Dates: {targetHoldForCash.startDate} → {targetHoldForCash.endDate} • Door Keypad PIN: {targetHoldForCash.passCode}
              </div>
            </div>
          )}

          <Input
            label="Booking Request / Hold Reference ID"
            value={cashReqId}
            onChange={(e) => setCashReqId(e.target.value)}
            required
            placeholder="e.g. req-seed-2 or alloc-seed-2"
          />
          <Input
            label="Physical Cash Voucher / Receipt Reference"
            value={cashRef}
            onChange={(e) => setCashRef(e.target.value)}
            required
          />
          <Input
            label="Amount in Integer Paise (e.g. 249900 = ₹2,499.00)"
            type="number"
            value={cashAmountPaise}
            onChange={(e) => setCashAmountPaise(Number(e.target.value))}
            required
          />
          <Textarea
            label="Desk Curator Audit Notes"
            value={cashNotes}
            onChange={(e) => setCashNotes(e.target.value)}
            rows={2}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCashOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Confirm Cash & Generate PDF Bill</Button>
          </div>
        </form>
      </Dialog>

      {/* 2b. Official Cash Receipt & Printable Bill Modal */}
      <Dialog
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Tax Invoice & Cash Payment Receipt"
        description="Desk counter payment verification with active Smart Keypad Door Access Pass & Exit Controls."
        maxWidth="xl"
      >
        {receiptModalData && (
          <div className="space-y-6 text-charcoal-900 font-sans">
            {/* Printable Receipt Container */}
            <div id="printable-receipt" className="p-6 sm:p-8 bg-white border border-charcoal-300 rounded-xl shadow-sm text-left space-y-6">
              {/* Header with Branding */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-forest-800 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-forest-800 text-white font-serif font-black text-lg flex items-center justify-center">
                      E
                    </span>
                    <span className="font-serif font-extrabold text-xl text-forest-950 tracking-tight">
                      ELITE STUDY ZONE
                    </span>
                  </div>
                  <p className="text-[10px] text-charcoal-500 font-mono uppercase tracking-widest mt-0.5">
                    Self-Study Space & Focus Hub • 24/7 Smart Keypad Access
                  </p>
                  <p className="text-xs text-charcoal-600 mt-1">
                    Amrut Nagar, Ghatkopar West, Mumbai, Maharashtra 400086
                  </p>
                  <p className="text-xs text-charcoal-600 font-mono">
                    Tel: +91 98753 59327 | support@elitestudyzone.in
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded uppercase tracking-wider">
                    PAID IN CASH (VERIFIED)
                  </div>
                  <div className="text-xs font-mono text-charcoal-600">
                    Invoice: <span className="font-bold text-charcoal-900">{receiptModalData.invoiceNumber}</span>
                  </div>
                  <div className="text-xs font-mono text-charcoal-600">
                    Receipt Ref: <span className="font-bold text-charcoal-900">{receiptModalData.receiptRef}</span>
                  </div>
                  <div className="text-xs font-mono text-charcoal-500">
                    Date: {receiptModalData.settledAt}
                  </div>
                </div>
              </div>

              {/* Student & Workstation Allocation Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-charcoal-500 font-bold block">Scholar / Student</span>
                  <span className="font-bold text-charcoal-900 text-sm">{receiptModalData.studentName}</span>
                  <span className="text-charcoal-600 block">{receiptModalData.studentEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-charcoal-500 font-bold block">Allocated Workstation</span>
                  <span className="font-bold text-forest-800 text-sm">{receiptModalData.seatId}</span>
                  <span className="text-charcoal-600 block">Dates: {receiptModalData.startDate} → {receiptModalData.endDate}</span>
                </div>
              </div>

              {/* Itemized Bill Table */}
              <div className="border border-charcoal-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-slate-100 border-b border-charcoal-200 uppercase text-[10px] text-charcoal-600">
                    <tr>
                      <th className="p-3">Item / Description</th>
                      <th className="p-3 text-center">Tenure</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-100">
                    <tr>
                      <td className="p-3 font-medium">
                        <div className="font-bold text-charcoal-900">{receiptModalData.planName}</div>
                        <div className="text-[11px] text-charcoal-500">
                          Workstation {receiptModalData.seatId} • High-Speed 5G Wi-Fi • Power Backup • Ergonomic Desk
                        </div>
                      </td>
                      <td className="p-3 text-center text-charcoal-600">
                        {receiptModalData.startDate} → {receiptModalData.endDate}
                      </td>
                      <td className="p-3 text-right font-bold text-charcoal-900">
                        ₹{receiptModalData.amountRupees}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        <div className="font-medium text-charcoal-800">Smart Keypad Door Access Pass & Exit Controls</div>
                        <div className="text-[11px] text-charcoal-500">Outer Door PIN & Interior Push-to-Exit Sync</div>
                      </td>
                      <td className="p-3 text-center text-charcoal-600">Included</td>
                      <td className="p-3 text-right font-bold text-emerald-700">₹0.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-charcoal-200">
                    <tr>
                      <td colSpan={2} className="p-3 text-right font-bold text-charcoal-800 uppercase text-xs">
                        Total Amount Received (Cash)
                      </td>
                      <td className="p-3 text-right font-bold text-base text-forest-900">
                        ₹{receiptModalData.amountRupees}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Door Pass Code Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Smart Door Keypad Access PIN Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Enter this PIN on the outer door keypad during your slot window. Press the interior exit button when leaving.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-white border border-emerald-400 rounded-md font-mono font-bold text-emerald-900 text-sm tracking-wider shadow-sm">
                  {receiptModalData.passCode}
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-4 border-t border-charcoal-200 flex justify-between items-end text-xs font-mono text-charcoal-600">
                <div>
                  <div className="font-bold text-charcoal-900">Elite Study Zone Concierge</div>
                  <div>Issued by: {receiptModalData.staffName}</div>
                  <div className="text-[10px] text-charcoal-400 mt-1">This is an authorized computer-generated cash tax receipt.</div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-2 border border-charcoal-300 rounded bg-slate-50 font-serif italic text-charcoal-700 text-xs text-center">
                    [ Official Cashier Seal ]
                    <div className="text-[9px] font-mono not-italic uppercase tracking-widest text-emerald-700 mt-0.5">
                      ✓ Audited & Paid
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
              <Button variant="ghost" onClick={() => setIsReceiptModalOpen(false)}>
                Close Window
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.print();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF Receipt</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* 3. Edit Membership Plans Dialog (Official Pricing Chart Matrix) */}
      <Dialog
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        title="01. Edit Plans — Official Pricing Chart Matrix"
        description="Update plan rates according to the center pricing chart. Edits reflect across all student booking calculations immediately."
        maxWidth="xl"
      >
        <form onSubmit={handleSavePricingMatrix} className="space-y-4 text-xs font-sans text-left">
          <div className="p-3 bg-forest-50 border border-forest-300 text-forest-950 font-mono text-[11px] rounded-lg">
            Immutability Covenant: Modifying rates here will update rates for all new student bookings while preserving historical booking snapshots.
          </div>

          <div className="overflow-x-auto border border-ivory-300 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-ivory-100 text-charcoal-800 font-mono uppercase tracking-wider text-[11px] border-b border-ivory-300">
                  <th className="p-3 font-bold">Access per day</th>
                  <th className="p-3 text-center font-bold">Hours</th>
                  <th className="p-3 font-bold bg-amber-50">One visit (INR)</th>
                  <th className="p-3 font-bold">7 days (INR)</th>
                  <th className="p-3 font-bold bg-forest-50">30 days (INR)</th>
                  <th className="p-3 font-bold">Weekend (8 days/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {pricingMatrix.map((row) => (
                  <tr key={row.shiftId} className="hover:bg-ivory-50/50">
                    <td className="p-3 font-serif font-bold text-sm text-charcoal-900">
                      {row.shiftName}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-forest-800">
                      {row.hours} hrs
                    </td>
                    <td className="p-2 bg-amber-50/30">
                      <input
                        type="number"
                        value={row.one_visit}
                        onChange={(e) => handlePricingCellChange(row.shiftId, "one_visit", Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-ivory-300 rounded font-mono text-xs focus:ring-1 focus:ring-forest-700 bg-white"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.week}
                        onChange={(e) => handlePricingCellChange(row.shiftId, "week", Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-ivory-300 rounded font-mono text-xs focus:ring-1 focus:ring-forest-700 bg-white"
                        required
                      />
                    </td>
                    <td className="p-2 bg-forest-50/30">
                      <input
                        type="number"
                        value={row.month}
                        onChange={(e) => handlePricingCellChange(row.shiftId, "month", Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-ivory-300 rounded font-mono text-xs font-bold text-forest-900 focus:ring-1 focus:ring-forest-700 bg-white"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.weekend}
                        onChange={(e) => handlePricingCellChange(row.shiftId, "weekend", Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-ivory-300 rounded font-mono text-xs focus:ring-1 focus:ring-forest-700 bg-white"
                        required
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsPlanOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="bg-forest-800 hover:bg-forest-700 font-bold">
              Save Pricing Chart
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Maintenance Scheduling Dialog */}
      <Dialog
        isOpen={isMaintOpen}
        onClose={() => setIsMaintOpen(false)}
        title="Schedule Workstation Maintenance Block"
        description="Block a workstation from availability for acoustic, joinery, or electrical maintenance."
        maxWidth="lg"
      >
        <form onSubmit={handleMaintSubmit} className="space-y-4 text-xs font-sans text-left">
          <div>
            <label htmlFor="maint-seat-select" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
              Select Workstation
            </label>
            <select
              id="maint-seat-select"
              value={maintSeat}
              onChange={(e) => setMaintSeat(e.target.value)}
              className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
            >
              <option value="seat-A02">seat-A02 (North Gallery)</option>
              <option value="seat-A04">seat-A04 (North Gallery)</option>
              <option value="seat-S02">seat-S02 (Library Stacks)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Block Start Date"
              type="date"
              value={maintStart}
              onChange={(e) => setMaintStart(e.target.value)}
              required
            />
            <Input
              label="Block End Date"
              type="date"
              value={maintEnd}
              onChange={(e) => setMaintEnd(e.target.value)}
              required
            />
          </div>
          <Input
            label="Architectural Maintenance Reason"
            value={maintReason}
            onChange={(e) => setMaintReason(e.target.value)}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsMaintOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Schedule Block</Button>
          </div>
        </form>
      </Dialog>

      {/* 5. Destructive Account Ban / Suspension Dialog with Financial Preview */}
      <Dialog
        isOpen={isRestrictOpen}
        onClose={() => setIsRestrictOpen(false)}
        title="Account Restriction & Ban Enforcement"
        description="Inspect affected bookings and financial implications before enforcing restrictions."
        maxWidth="xl"
      >
        <form onSubmit={handleRestrictSubmit} className="space-y-4 text-xs font-sans text-left">
          {/* Member Selector / Search */}
          <div>
            <label htmlFor="member-search-input" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
              Search Member Account
            </label>
            <div className="flex gap-2">
              <input
                id="member-search-input"
                type="text"
                placeholder="Search by name, email, or ref..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-ivory-300 bg-ivory-50 text-xs font-mono"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bookingsFixture.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedUserId(`user-${b.memberEmail.split("@")[0]}`)}
                  className={`px-2 py-1 text-[10px] font-mono border ${
                    selectedUserId.includes(b.memberEmail.split("@")[0])
                      ? "bg-charcoal-900 text-ivory-50 border-charcoal-900"
                      : "bg-ivory-100 text-charcoal-700 hover:bg-ivory-200 border-ivory-300"
                  }`}
                >
                  {b.memberName}
                </button>
              ))}
            </div>
          </div>

          {/* Affected Bookings Preview Warning Box */}
          <div className="p-4 border-2 border-burgundy-600 bg-burgundy-50 text-burgundy-950 space-y-2">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-burgundy-900">
              <ShieldAlert className="w-4 h-4 text-burgundy-700" />
              <span>Affected Bookings & Access Passes Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>Target Scholar ID: <span className="font-bold">{selectedUserId}</span></div>
              <div>Active Passes To Revoke: <span className="font-bold">{restrictionPreview.activeAllocationsCount}</span></div>
              <div>Active Financial Value: <span className="font-bold">₹{restrictionPreview.totalActiveValueRupees}</span></div>
            </div>
            <p className="text-[11px] leading-relaxed">
              Enforcing this action immediately revokes active door keypad PINs and cancels upcoming holds server-side.
            </p>
          </div>

          {/* Policy Decision Options */}
          <div className="space-y-2">
            <label className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700">
              Approved Policy Decision on Remaining Funds
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "initiate_refund", label: "Initiate Refund", desc: "Route unserved balance to refund queue per policy terms." },
                { id: "forfeit_per_terms", label: "Forfeit per Terms", desc: "Gross quietude covenant breach without refund." },
                { id: "manual_review", label: "Manual Review", desc: "Defer to Separate Refund Management review." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRestrictRefundDecision(opt.id as typeof restrictRefundDecision)}
                  className={`p-2.5 border text-left flex flex-col justify-between ${
                    restrictRefundDecision === opt.id
                      ? "border-burgundy-900 bg-burgundy-100/60 ring-1 ring-burgundy-900"
                      : "border-ivory-300 bg-ivory-50 hover:bg-ivory-100"
                  }`}
                >
                  <span className="font-bold font-mono text-xs text-charcoal-900">{opt.label}</span>
                  <span className="text-[10px] text-charcoal-600 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Severity & Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="restriction-type-select" className="block uppercase font-mono text-[10px] tracking-wider text-charcoal-700 mb-1">
                Restriction Severity
              </label>
              <select
                id="restriction-type-select"
                value={restrictType}
                onChange={(e) => setRestrictType(e.target.value as "suspension" | "ban")}
                className="w-full px-3 py-2 border border-ivory-300 bg-ivory-50 text-xs font-mono"
              >
                <option value="suspension">Temporary Suspension</option>
                <option value="ban">Permanent Account Ban</option>
              </select>
            </div>
            {restrictType === "suspension" && (
              <Input
                label="Duration (Days)"
                type="number"
                value={restrictDurationDays}
                onChange={(e) => setRestrictDurationDays(Number(e.target.value))}
                required
              />
            )}
          </div>

          <Textarea
            label="Curatorial Reason for Audit Record"
            value={restrictReason}
            onChange={(e) => setRestrictReason(e.target.value)}
            required
            rows={2}
          />

          {/* Destructive Action Checkbox Confirmation */}
          <div className="p-3 border border-amber-400 bg-amber-50 text-amber-950 flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm-destructive"
              checked={restrictConfirmed}
              onChange={(e) => setRestrictConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="confirm-destructive" className="text-[11px] leading-tight">
              I confirm that I have reviewed the affected bookings, active passes, and financial implications. This action takes immediate effect across active member sessions.
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsRestrictOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              type="submit"
              disabled={!restrictConfirmed}
            >
              Enforce Restriction Server-Side
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 6. Inbound Enquiry Reply Dialog */}
      <Dialog
        isOpen={isEnquiryReplyOpen}
        onClose={() => setIsEnquiryReplyOpen(false)}
        title="Draft Concierge Dispatch"
        description="Send an official curatorial reply to a prospective scholar."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs font-sans text-left">
          <div className="p-3 bg-ivory-100 border border-ivory-300 font-mono text-[11px]">
            <div>To: <strong>{selectedEnquiry?.fullName} ({selectedEnquiry?.email})</strong></div>
            <div>Topic: {selectedEnquiry?.topic}</div>
            <div className="mt-1 italic">“{selectedEnquiry?.message}”</div>
          </div>
          <Textarea
            label="Curatorial Reply Message"
            rows={4}
            value={enquiryReplyText}
            onChange={(e) => setEnquiryReplyText(e.target.value)}
            placeholder="Address accommodation details, acoustic certificates, or studio policies..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEnquiryReplyOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSendEnquiryReply}>Dispatch Reply</Button>
          </div>
        </div>
      </Dialog>

      {/* Global Print Styles for Cash Receipts & Tax Bills */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            margin: 0;
            padding: 28px;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
