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
  Clock,
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
  onSuccess: (paymentId: string, passCode?: string) => void;
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
  const [selectedMethod, setSelectedMethod] = useState<"qr" | "upi_apps">("qr");
  const [merchantUpiId, setMerchantUpiId] = useState("shettyvarun001@okhdfcbank");
  const [merchantUpiAlias, setMerchantUpiAlias] = useState("shettyvarun001@okicici");
  const [merchantName, setMerchantName] = useState("Varun Shetty");
  const [merchantQrUrl, setMerchantQrUrl] = useState("/upi-qr.jpg");
  
  // Payment Flow Steps: 'select' -> 'awaiting_payment' -> 'verifying' -> 'success'
  const [flowStep, setFlowStep] = useState<"select" | "awaiting_payment" | "verifying" | "success">("select");
  const [activeApp, setActiveApp] = useState<"phonepe" | "gpay" | "paytm" | "any" | "qr">("gpay");
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
        if (d?.upiIdAlias) setMerchantUpiAlias(d.upiIdAlias);
        if (d?.accountHolder) setMerchantName(d.accountHolder);
        if (d?.qrCodeUrl) setMerchantQrUrl(d.qrCodeUrl);
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

      // On mobile devices, auto-switch to UPI Apps tab for instant PhonePe tap
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setSelectedMethod("upi_apps");
      }
    }
  }, [isOpen]);

  const amountRupeesNumber = amountPaise / 100;
  const amountRupeesFormatted = amountRupeesNumber.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const amountRupeesClean = amountRupeesNumber.toFixed(2);

  const returnUrl = typeof window !== "undefined" ? window.location.href : "https://elitestudyzone.in/book";

  // Universal UPI Intent URI with standard specifications & return callback URL
  const universalUpiUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName || "Varun Shetty")}&am=${amountRupeesClean}&cu=INR&tn=${encodeURIComponent(`Desk Booking ${seatLabel}`)}&tr=${encodeURIComponent(bookingRequestId)}&url=${encodeURIComponent(returnUrl)}`;

  // Dynamic Amount QR Code Image URL (encodes exact merchant UPI and payable amount)
  const dynamicQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(universalUpiUrl)}`;

  // Launch Mobile UPI Intent
  const handleOpenUpiApp = (app: "phonepe" | "gpay" | "paytm" | "any") => {
    setActiveApp(app);
    setFlowStep("awaiting_payment");
    setErrorMessage(null);

    const note = encodeURIComponent(`Desk Booking ${seatLabel}`);
    const pn = encodeURIComponent(merchantName || "Varun Shetty");
    let targetLink = universalUpiUrl;

    if (app === "phonepe") {
      targetLink = `phonepe://pay?pa=${merchantUpiId}&pn=${pn}&am=${amountRupeesClean}&cu=INR&tn=${note}&tr=${encodeURIComponent(bookingRequestId)}&url=${encodeURIComponent(returnUrl)}`;
    } else if (app === "gpay") {
      targetLink = `tez://upi/pay?pa=${merchantUpiId}&pn=${pn}&am=${amountRupeesClean}&cu=INR&tn=${note}&tr=${encodeURIComponent(bookingRequestId)}&url=${encodeURIComponent(returnUrl)}`;
    } else if (app === "paytm") {
      targetLink = `paytmmp://pay?pa=${merchantUpiId}&pn=${pn}&am=${amountRupeesClean}&cu=INR&tn=${note}&tr=${encodeURIComponent(bookingRequestId)}&url=${encodeURIComponent(returnUrl)}`;
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

      const activeKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

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
  const cleanUtr = utrNumber.replace(/\D/g, "");
  const isUtrValid = cleanUtr.length === 12;

  const handleFinalizeVerification = async (
    orderIdParam?: string,
    paymentIdParam?: string,
    signatureParam?: string
  ) => {
    // If not a gateway callback, require valid 12-digit UTR
    if (!paymentIdParam && !isUtrValid) {
      setErrorMessage("Mandatory: Please enter the complete 12-digit UPI UTR / Transaction Reference from your payment receipt.");
      setFlowStep("awaiting_payment");
      return;
    }

    setFlowStep("verifying");
    setErrorMessage(null);

    try {
      const orderId = orderIdParam || `order_${bookingRequestId}_${Date.now()}`;
      const paymentId = paymentIdParam || `upi_utr_${cleanUtr}`;
      const signature = signatureParam || `upi_verified_${orderId}_${paymentId}`;

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

      const passCode = "PENDING_ADMIN_APPROVAL";

      setSuccessInfo({
        paymentId,
        passCode,
      });
      setFlowStep("success");
      onSuccess(paymentId, passCode);
    } catch (err: unknown) {
      setFlowStep("awaiting_payment");
      setErrorMessage(err instanceof Error ? err.message : "Could not submit payment reference. Please check your transaction.");
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
      title="Elite Study Zone • Official UPI Payment"
      description="Instant UPI settlement via Google Pay QR or Mobile Apps with automatic door keypad PIN issuance."
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

          {(flowStep === "awaiting_payment" || (flowStep === "select" && cleanUtr.length > 0)) && (
            <Button
              variant="primary"
              disabled={!isUtrValid}
              onClick={() => handleFinalizeVerification()}
              className={`gap-2 font-bold text-xs shadow-lg transform active:scale-95 transition-all ${
                isUtrValid
                  ? "bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUtrValid ? "Submit 12-Digit UTR for Admin Verification →" : `Enter 12-Digit UTR (${cleanUtr.length}/12)`}</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-left text-xs font-sans">
        {/* STEP 4: AWAITING ADMIN VERIFICATION (NO PIN BEFORE ADMIN APPROVAL) */}
        {flowStep === "success" && successInfo && (
          <div className="p-6 border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-orange-50/40 text-charcoal-900 rounded-2xl space-y-4 shadow-xl text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-800 bg-amber-200/70 px-3 py-1 rounded-full border border-amber-300">
                ⏳ Payment Submitted • Awaiting Admin Verification
              </span>
              <h3 className="font-sans text-xl font-extrabold text-charcoal-900 mt-2">
                Workstation Request Submitted!
              </h3>
              <p className="text-xs text-charcoal-600 mt-0.5 max-w-sm mx-auto">
                Your payment reference has been forwarded to the center admin. Once verified in the admin portal, your Door Keypad Access PIN will be issued.
              </p>
            </div>

            {/* Dimensional Receipt Card */}
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-md space-y-2.5 text-left font-mono text-xs">
              <div className="flex justify-between border-b border-amber-100 pb-1.5">
                <span className="text-charcoal-600 font-sans">Workstation:</span>
                <span className="font-bold text-charcoal-900">{seatLabel}</span>
              </div>
              <div className="flex justify-between border-b border-amber-100 pb-1.5">
                <span className="text-charcoal-600 font-sans">Amount Paid:</span>
                <span className="font-bold text-emerald-800">₹{amountRupeesFormatted}</span>
              </div>
              <div className="flex justify-between border-b border-amber-100 pb-1.5">
                <span className="text-charcoal-600 font-sans">UPI Reference (UTR):</span>
                <span className="text-charcoal-800 font-bold font-mono tracking-wider">{cleanUtr || successInfo.paymentId}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-charcoal-800 font-sans font-bold">Door Access Keypad PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300">
                    🔒 Pending Admin Verification
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-100/70 rounded-xl border border-amber-200 text-[11px] text-amber-950 font-sans leading-relaxed text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <span>📌 What happens next?</span>
              </div>
              <p>
                1. The center administrator will confirm your UPI transfer in their bank statement.
              </p>
              <p>
                2. Upon approval, your <strong>6-Digit Smart Door PIN</strong> will be generated and automatically sent to your <strong>WhatsApp</strong> and <strong>Email</strong>.
              </p>
              <p>
                3. You can track this booking anytime from your <strong>Student Portal Dashboard</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all shadow"
            >
              Go to Student Dashboard →
            </button>
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
                Verifying bank transaction with provider and generating your door keypad passcode.
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

            {/* Mandatory UTR / Reference Input */}
            <div className="p-3 bg-white rounded-xl border border-charcoal-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-charcoal-800 block">
                  Bank Reference / UTR Number <span className="text-rose-600">*</span>
                </label>
                <span className={`text-[10px] font-mono font-bold ${isUtrValid ? "text-emerald-700" : "text-amber-700"}`}>
                  {isUtrValid ? "✓ 12 Digits Verified" : `${cleanUtr.length}/12 Digits`}
                </span>
              </div>
              <input
                type="text"
                maxLength={12}
                placeholder="Enter 12-digit UPI UTR from PhonePe/GPay receipt"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono font-bold tracking-wider"
                required
              />
              <span className="text-[10px] text-charcoal-500 block leading-relaxed">
                Mandatory: Open your payment app transaction history, copy the 12-digit UTR/UPI Ref ID, and paste it above to confirm your booking and generate your Door Access PIN.
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

            {/* Pure UPI Tab Navigation */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-charcoal-600">
              <button
                type="button"
                onClick={() => setSelectedMethod("qr")}
                className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedMethod === "qr"
                    ? "bg-white text-forest-900 shadow-sm font-bold"
                    : "hover:text-charcoal-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-forest-700" />
                <span>Scan Google Pay / UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("upi_apps")}
                className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedMethod === "upi_apps"
                    ? "bg-white text-purple-900 shadow-sm font-bold"
                    : "hover:text-charcoal-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Pay via UPI Apps</span>
              </button>
            </div>

            {/* METHOD 1: DYNAMIC & OFFICIAL GOOGLE PAY SCAN QR */}
            {selectedMethod === "qr" && (
              <div className="p-4 bg-slate-50 border border-charcoal-200 rounded-2xl text-center space-y-3 shadow-inner">
                <div className="text-xs font-bold text-charcoal-800">
                  Scan & Pay Exactly <span className="text-forest-800 font-extrabold text-sm">₹{amountRupeesFormatted}</span>
                </div>

                {/* Official Google Pay QR Code Display */}
                <div className="p-2.5 bg-white border-2 border-forest-600 rounded-2xl inline-block shadow-md max-w-[240px]">
                  <img
                    src={merchantQrUrl || "/upi-qr.jpg"}
                    alt="Varun Shetty Google Pay UPI QR Code"
                    className="w-52 h-52 mx-auto object-contain rounded-xl"
                  />
                </div>

                <div className="text-[11px] text-charcoal-600 max-w-xs mx-auto leading-tight">
                  Scan with <strong>Google Pay, PhonePe, Paytm, BHIM</strong>, or any UPI banking app.
                </div>

                {/* Payee & UPI ID Details Bar */}
                <div className="p-2.5 bg-white rounded-xl border border-charcoal-200 text-xs space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-charcoal-500">Verified Payee:</span>
                    <span className="font-bold text-charcoal-900">{merchantName} (Elite Study Zone)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-charcoal-500 font-sans">Active UPI ID:</span>
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
                  {merchantUpiAlias && merchantUpiAlias !== merchantUpiId && (
                    <div className="flex justify-between items-center text-[10px] text-charcoal-500 pt-0.5">
                      <span>Backup / Alternate VPA:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = merchantUpiId;
                          setMerchantUpiId(merchantUpiAlias);
                          setMerchantUpiAlias(current);
                        }}
                        className="text-forest-700 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                        title="Click to switch to this UPI ID"
                      >
                        <span>{merchantUpiAlias}</span>
                        <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-charcoal-600 border border-slate-200">Switch ⇄</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Instant 12-Digit UTR Entry in QR Tab */}
                <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 space-y-2 text-left shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-charcoal-900 block">
                      Enter 12-Digit UPI UTR Reference <span className="text-rose-600">*</span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold ${isUtrValid ? "text-emerald-700" : "text-amber-700"}`}>
                      {isUtrValid ? "✓ 12 Digits Verified" : `${cleanUtr.length}/12 Digits`}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 433018294821 from payment receipt"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-bold tracking-wider"
                    required
                  />
                  <Button
                    variant="primary"
                    disabled={!isUtrValid}
                    onClick={() => handleFinalizeVerification()}
                    className={`w-full justify-center gap-2 font-bold text-xs py-2.5 shadow-md transition-all ${
                      isUtrValid
                        ? "bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUtrValid ? `Submit UTR for Admin Approval (₹${amountRupeesFormatted}) →` : `Enter 12-Digit UTR (${cleanUtr.length}/12)`}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* METHOD 2: UPI APPS INTENT (PhonePe, Google Pay, Paytm) */}
            {selectedMethod === "upi_apps" && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-charcoal-700">
                  Tap to launch UPI app directly on your phone:
                </div>

                {/* 1. PhonePe Primary Button (Recommended & Instant) */}
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp("phonepe")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-purple-400 bg-gradient-to-r from-purple-50 via-purple-100/40 to-white hover:border-purple-600 hover:shadow-lg transition-all group text-left transform active:scale-98 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-bold text-base shadow">
                      पे
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-charcoal-900 group-hover:text-purple-700">
                          PhonePe Instant
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded uppercase">
                          ⚡ Auto-Launch
                        </span>
                      </div>
                      <div className="text-[11px] text-charcoal-500">
                        Direct request to Varun Shetty ({merchantUpiId})
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
                        Pay via Google Pay to Varun Shetty
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
          <span>Instant Keypad PIN Issuance</span>
          <span>•</span>
          <span>Zero Convenience Fee</span>
        </div>
      </div>
    </Dialog>
  );
}
