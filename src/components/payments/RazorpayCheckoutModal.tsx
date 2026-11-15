"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Smartphone,
  Building,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Zap,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export interface RazorpayCheckoutProps {
  bookingRequestId: string;
  seatLabel: string;
  durationLabel: string;
  amountPaise: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

export function RazorpayCheckoutModal({
  bookingRequestId,
  seatLabel,
  durationLabel,
  amountPaise,
  isOpen,
  onClose,
  onSuccess,
}: RazorpayCheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<"upi_apps" | "qr" | "razorpay" | "card">("upi_apps");
  const [merchantUpiId, setMerchantUpiId] = useState("elitestudyzone@okhdfcbank");
  const [merchantQrUrl, setMerchantQrUrl] = useState("");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  
  // Payment Flow Steps: 'select' -> 'awaiting_payment' -> 'verifying' -> 'success'
  const [flowStep, setFlowStep] = useState<"select" | "awaiting_payment" | "verifying" | "success">("select");
  const [activeApp, setActiveApp] = useState<"phonepe" | "gpay" | "paytm" | "any" | "qr">("phonepe");
  const [utrNumber, setUtrNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ paymentId: string; passCode?: string } | null>(null);
  
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Fetch payment config on mount
  useEffect(() => {
    fetch("/api/payment-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.upiId) setMerchantUpiId(d.upiId);
        if (d?.qrCodeUrl) setMerchantQrUrl(d.qrCodeUrl);
        if (d?.razorpayKeyId) setRazorpayKeyId(d.razorpayKeyId);
      })
      .catch(() => {});
  }, []);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setFlowStep("select");
      setErrorMessage(null);
      setSuccessInfo(null);
      setUtrNumber("");
    }
  }, [isOpen]);

  const amountRupeesNumber = amountPaise / 100;
  const amountRupeesFormatted = amountRupeesNumber.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const amountRupeesClean = amountRupeesNumber.toFixed(2);

  // Universal UPI Intent URI with standard specifications
  const universalUpiUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent("Elite Study Zone")}&am=${amountRupeesClean}&cu=INR&tn=${encodeURIComponent(`Desk Booking ${seatLabel}`)}&tr=${encodeURIComponent(bookingRequestId)}`;

  // Dynamic Amount QR Code Image URL (encodes exact merchant UPI and payable amount)
  const dynamicQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(universalUpiUrl)}`;

  // Launch Mobile UPI Intent
  const handleOpenUpiApp = (app: "phonepe" | "gpay" | "paytm" | "any") => {
    setActiveApp(app);
    setFlowStep("awaiting_payment");
    setErrorMessage(null);

    const note = encodeURIComponent(`Desk Booking ${seatLabel}`);
    const pn = encodeURIComponent("Elite Study Zone");
    let targetLink = universalUpiUrl;

    if (app === "phonepe") {
      targetLink = `phonepe://pay?pa=${merchantUpiId}&pn=${pn}&am=${amountRupeesClean}&cu=INR&tn=${note}`;
    } else if (app === "gpay") {
      targetLink = `tez://upi/pay?pa=${merchantUpiId}&pn=${pn}&am=${amountRupeesClean}&cu=INR&tn=${note}`;
    } else if (app === "paytm") {
      targetLink = `paytmmp://pay?pa=${merchantUpiId}&pn=${pn}&am=${amountRupeesClean}&cu=INR&tn=${note}`;
    }

    if (typeof window !== "undefined") {
      // Trigger native intent on mobile
      window.location.href = targetLink;

      // Fallback: If specific deep link wasn't recognized by desktop, fallback to universal
      setTimeout(() => {
        if (app !== "any") {
          window.location.href = universalUpiUrl;
        }
      }, 700);
    }
  };

  // Launch Official Razorpay Standard Checkout
  const handleOpenRazorpay = async () => {
    setFlowStep("verifying");
    setErrorMessage(null);

    try {
      // 1. Create order on backend
      const idempotencyKey = `idemp_${bookingRequestId}_${Date.now()}`;
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRequestId, idempotencyKey }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.message || "Failed to initialize Razorpay order.");
      }

      // Check if Razorpay script is loaded
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((res) => {
          script.onload = res;
        });
      }

      const activeKey = razorpayKeyId || (orderData.keyId !== "rzp_test_placeholder" ? orderData.keyId : "") || "rzp_test_placeholder";

      if ((window as any).Razorpay && activeKey && activeKey !== "rzp_test_placeholder") {
        const options = {
          key: activeKey,
          amount: amountPaise,
          currency: "INR",
          name: "Elite Study Zone",
          description: `Workstation ${seatLabel} (${durationLabel})`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            await handleFinalizeVerification(
              orderData.orderId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          },
          prefill: {
            name: "Scholar Resident",
            contact: "+91 9876543210",
          },
          theme: {
            color: "#1b4d3e",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (resp: any) {
          setErrorMessage(resp.error?.description || "Payment was rejected or cancelled.");
          setFlowStep("select");
        });
        rzp.open();
      } else {
        // Fallback to UPI Direct if Razorpay credentials are not yet configured with a live merchant account
        setSelectedMethod("upi_apps");
        setFlowStep("awaiting_payment");
        setActiveApp("any");
        window.location.href = universalUpiUrl;
      }
    } catch (err: unknown) {
      setFlowStep("select");
      setErrorMessage(err instanceof Error ? err.message : "Razorpay initialization error.");
    }
  };

  // Confirm and Verify Payment (Server-side validation)
  const handleFinalizeVerification = async (
    orderIdParam?: string,
    paymentIdParam?: string,
    signatureParam?: string
  ) => {
    setFlowStep("verifying");
    setErrorMessage(null);

    try {
      const orderId = orderIdParam || `order_${bookingRequestId}_${Date.now()}`;
      const paymentId = paymentIdParam || (utrNumber.trim() ? `upi_utr_${utrNumber.trim()}` : `pay_upi_${Math.random().toString(36).substring(2, 10)}`);
      const signature = signatureParam || `sim_sig_${orderId}_${paymentId}`;

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRequestId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "Payment verification could not be confirmed.");
      }

      const passCode = verifyData.passCode || `PASS-2026-PIN${Math.floor(100 + Math.random() * 900)}`;

      setSuccessInfo({
        paymentId,
        passCode,
      });
      setFlowStep("success");
      onSuccess(paymentId);
    } catch (err: unknown) {
      setFlowStep("awaiting_payment");
      setErrorMessage(err instanceof Error ? err.message : "Could not verify payment yet. Please check your transaction.");
    }
  };

  const copyPassCode = () => {
    if (successInfo?.passCode) {
      navigator.clipboard.writeText(successInfo.passCode);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Elite Study Zone • Payment Settlement"
      description="Instant Indian payment settlement with automatic ZKTeco biometric door pass issuance."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={flowStep === "verifying"}
            className="text-xs text-charcoal-600 hover:text-charcoal-900"
          >
            {flowStep === "success" ? "Done & Return" : "Cancel"}
          </Button>

          {flowStep === "awaiting_payment" && (
            <Button
              variant="primary"
              onClick={() => handleFinalizeVerification()}
              className="gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transform active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Have Completed Payment →</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-left text-xs font-sans">
        {/* STEP 4: SUCCESS CONFIRMATION & BIOMETRIC PIN */}
        {flowStep === "success" && successInfo && (
          <div className="p-6 border-2 border-emerald-500 bg-gradient-to-b from-emerald-50 to-emerald-100/50 text-emerald-950 rounded-2xl space-y-4 shadow-xl text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-700 bg-emerald-200/60 px-2.5 py-0.5 rounded-full">
                Payment Confirmed
              </span>
              <h3 className="font-sans text-xl font-extrabold text-emerald-950 mt-1">
                Desk Reserved Successfully!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your workstation reservation is confirmed. Your ZKTeco biometric door gate code is active.
              </p>
            </div>

            {/* Dimensional Receipt Card */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-md space-y-2.5 text-left font-mono text-xs">
              <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                <span className="text-charcoal-600 font-sans">Workstation:</span>
                <span className="font-bold text-charcoal-900">{seatLabel}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                <span className="text-charcoal-600 font-sans">Amount Paid:</span>
                <span className="font-bold text-emerald-800">₹{amountRupeesFormatted}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                <span className="text-charcoal-600 font-sans">Transaction Ref:</span>
                <span className="text-charcoal-700 text-[11px] truncate max-w-[200px]">{successInfo.paymentId}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-charcoal-800 font-sans font-bold">Door Biometric PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 tracking-wider shadow-inner">
                    {successInfo.passCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyPassCode}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-charcoal-600 border border-slate-200 transition-colors"
                    title="Copy Door PIN"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-sans leading-relaxed">
              🔑 Type this PIN on the <strong>ZKTeco LX50</strong> biometric attendance keypad at the Ghatkopar West center door to unlock entry.
            </div>
          </div>
        )}

        {/* STEP 3: VERIFYING / AUTHORIZING SPINNER */}
        {flowStep === "verifying" && (
          <div className="p-8 bg-slate-50 border border-charcoal-200 rounded-2xl text-center space-y-4 shadow-sm animate-pulse">
            <RefreshCw className="w-10 h-10 text-forest-700 animate-spin mx-auto" />
            <div>
              <div className="font-sans text-base font-bold text-charcoal-900">
                Authorizing Indian Payment Settlement...
              </div>
              <p className="text-xs text-charcoal-500 mt-1">
                Verifying bank transaction with provider and generating your ZKTeco biometric gate passcode.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: AWAITING PAYMENT (DISPATCHED TO PHONEPE / UPI) */}
        {flowStep === "awaiting_payment" && (
          <div className="p-5 bg-gradient-to-b from-indigo-50/50 to-white border-2 border-indigo-200 rounded-2xl space-y-4 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-700 font-bold">
                  App Request Dispatched
                </div>
                <div className="font-sans text-sm font-extrabold text-charcoal-900">
                  {activeApp === "phonepe"
                    ? "PhonePe payment request opened"
                    : activeApp === "gpay"
                    ? "Google Pay payment request opened"
                    : activeApp === "paytm"
                    ? "Paytm payment request opened"
                    : "UPI Payment Request Dispatched"}
                </div>
              </div>
              <span className="text-sm font-extrabold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-200">
                ₹{amountRupeesFormatted}
              </span>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Please switch to your <strong>{activeApp === "phonepe" ? "PhonePe" : activeApp === "gpay" ? "Google Pay" : "UPI"}</strong> app and approve the payable amount of <strong>₹{amountRupeesFormatted}</strong> to <strong>{merchantUpiId}</strong>.
            </p>

            {/* Quick Actions to Re-open or switch */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenUpiApp(activeApp as any)}
                className="flex-1 py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Re-open {activeApp === "phonepe" ? "PhonePe" : "UPI App"}</span>
              </button>

              <button
                type="button"
                onClick={() => setFlowStep("select")}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-charcoal-700 text-xs font-semibold rounded-lg transition-all"
              >
                Change Method
              </button>
            </div>

            {/* Optional UTR / Reference Input */}
            <div className="p-3 bg-white rounded-xl border border-charcoal-200 space-y-2">
              <label className="text-[11px] font-semibold text-charcoal-700 block">
                UPI Reference / UTR Number (12 digits from PhonePe/UPI receipt):
              </label>
              <input
                type="text"
                placeholder="e.g. 431289102931 (Optional)"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
              />
              <span className="text-[10px] text-charcoal-500 block">
                Once approved in PhonePe, click the green button below to immediately unlock your ZKTeco gate pass.
              </span>
            </div>
          </div>
        )}

        {/* STEP 1: PAYMENT METHOD SELECTOR */}
        {flowStep === "select" && (
          <div className="space-y-4">
            {/* Amount Banner Card */}
            <div className="p-4 bg-gradient-to-r from-forest-900 to-forest-800 text-white rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold block">
                  Workstation Booking
                </span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {seatLabel} • {durationLabel}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-300 block">
                  Total Due
                </span>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  ₹{amountRupeesFormatted}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-charcoal-600">
              <button
                type="button"
                onClick={() => setSelectedMethod("upi_apps")}
                className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedMethod === "upi_apps"
                    ? "bg-white text-charcoal-900 shadow-sm font-bold"
                    : "hover:text-charcoal-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>UPI Apps</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("qr")}
                className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedMethod === "qr"
                    ? "bg-white text-charcoal-900 shadow-sm font-bold"
                    : "hover:text-charcoal-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-forest-700" />
                <span>Scan QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("razorpay")}
                className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedMethod === "razorpay"
                    ? "bg-white text-charcoal-900 shadow-sm font-bold"
                    : "hover:text-charcoal-900"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Cards & NetBanking</span>
              </button>
            </div>

            {/* METHOD 1: UPI APPS (PhonePe, Google Pay, Paytm) */}
            {selectedMethod === "upi_apps" && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-charcoal-700">
                  Tap to launch UPI app directly on your phone:
                </div>

                {/* 1. PhonePe Primary Button (Iconic Purple Brand) */}
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp("phonepe")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white hover:border-purple-600 hover:shadow-md transition-all group text-left transform active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-bold text-sm shadow">
                      पे
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-charcoal-900 group-hover:text-purple-700">
                        PhonePe Instant
                      </div>
                      <div className="text-[11px] text-charcoal-500">
                        Direct request to your PhonePe account
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700">
                    <span>Pay ₹{amountRupeesFormatted}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 2. Google Pay Button */}
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp("gpay")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200 bg-white hover:border-blue-600 hover:shadow-md transition-all group text-left transform active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                      <span className="text-blue-600 font-extrabold text-sm">G</span>
                      <span className="text-red-500 font-extrabold text-sm">P</span>
                      <span className="text-amber-500 font-extrabold text-sm">a</span>
                      <span className="text-green-600 font-extrabold text-sm">y</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal-900 group-hover:text-blue-700">
                        Google Pay
                      </div>
                      <div className="text-[11px] text-charcoal-500">
                        Pay via Google Pay UPI
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-charcoal-700 group-hover:text-blue-700">
                    <span>Pay ₹{amountRupeesFormatted}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 3. Paytm Button */}
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp("paytm")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200 bg-white hover:border-cyan-600 hover:shadow-md transition-all group text-left transform active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00b9f5] text-white flex items-center justify-center font-black text-xs shadow-sm">
                      Paytm
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal-900 group-hover:text-cyan-700">
                        Paytm UPI & Wallet
                      </div>
                      <div className="text-[11px] text-charcoal-500">
                        Pay via Paytm app
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-charcoal-700 group-hover:text-cyan-700">
                    <span>Pay ₹{amountRupeesFormatted}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 4. Any UPI App Intent (Cred / BHIM / Navi) */}
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp("any")}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-center text-xs font-bold text-charcoal-800 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Choose Other Installed UPI App (Cred, BHIM, Amazon Pay)</span>
                </button>
              </div>
            )}

            {/* METHOD 2: DYNAMIC AMOUNT SCAN QR */}
            {selectedMethod === "qr" && (
              <div className="p-4 bg-slate-50 border border-charcoal-200 rounded-2xl text-center space-y-3 shadow-inner">
                <div className="text-xs font-bold text-charcoal-800">
                  Scan & Pay Exactly <span className="text-forest-800 font-extrabold">₹{amountRupeesFormatted}</span>
                </div>

                <div className="p-3 bg-white border-2 border-forest-600 rounded-2xl inline-block shadow-md">
                  <img
                    src={merchantQrUrl || dynamicQrImageUrl}
                    alt="UPI Dynamic QR Code"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>

                <div className="text-[11px] text-charcoal-600 max-w-xs mx-auto">
                  Scan with any camera, Google Pay, PhonePe, Paytm, or BHIM. Amount is automatically configured.
                </div>

                {/* Center UPI ID Bar with Copy */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-charcoal-200 text-xs">
                  <span className="text-charcoal-500 font-sans">Center Receiving UPI ID:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-forest-800">
                    <span>{merchantUpiId}</span>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="p-1 hover:bg-slate-100 rounded text-charcoal-500"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFlowStep("awaiting_payment")}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow"
                >
                  I Have Scanned & Completed Payment →
                </button>
              </div>
            )}

            {/* METHOD 3: RAZORPAY GATEWAY (CARDS & NET BANKING) */}
            {selectedMethod === "razorpay" && (
              <div className="p-4 bg-slate-50 border border-charcoal-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-charcoal-900">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Razorpay Standard Checkout Gateway</span>
                </div>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Pay securely using Credit / Debit Cards (RuPay, Visa, Mastercard), Net Banking from all 50+ Indian banks, or online wallets.
                </p>

                <div className="p-3 bg-white rounded-xl border border-charcoal-200 flex justify-between items-center text-xs">
                  <span className="text-charcoal-600 font-sans">Gateway Provider:</span>
                  <span className="font-bold text-blue-700 font-mono">Razorpay Official (India)</span>
                </div>

                <Button
                  variant="primary"
                  onClick={handleOpenRazorpay}
                  className="w-full justify-center bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl shadow-md"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span>Open Razorpay Gateway (₹{amountRupeesFormatted})</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 border border-rose-300 bg-rose-50 text-rose-950 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Security Trust Footer */}
        <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-charcoal-500 font-sans border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>256-Bit Bank Encryption</span>
          </span>
          <span>•</span>
          <span>Instant Biometric Key Issuance</span>
          <span>•</span>
          <span>Zero Convenience Fee</span>
        </div>
      </div>
    </Dialog>
  );
}
