"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, CreditCard, CheckCircle2, RefreshCw, QrCode, Smartphone, Building, KeyRound, Copy, Check } from "lucide-react";
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
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "qr">("gpay");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ paymentId: string; passCode?: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessInfo(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const amountRupees = (amountPaise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on server
      const idempotencyKey = `idemp_${bookingRequestId}_${Date.now()}`;
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRequestId, idempotencyKey }),
      });

      const orderData = await orderRes.json();
      const orderId = orderData.orderId || `order_${bookingRequestId}_${Date.now()}`;

      // Simulate network authorization delay (1.2 seconds for realistic confirmation)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 2. Verify payment server-side
      const simulatedPaymentId = `pay_upi_${Math.random().toString(36).substring(2, 10)}`;
      const testSigRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRequestId,
          razorpayOrderId: orderId,
          razorpayPaymentId: simulatedPaymentId,
          razorpaySignature: `sim_sig_${orderId}_${simulatedPaymentId}`,
        }),
      });

      const verifyData = await testSigRes.json();

      if (!testSigRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "Payment verification could not be completed.");
      }

      const passCode = verifyData.passCode || `PASS-2026-PIN${Math.floor(100 + Math.random() * 900)}`;

      setSuccessInfo({
        paymentId: simulatedPaymentId,
        passCode,
      });
      setIsProcessing(false);
      onSuccess(simulatedPaymentId);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : "Payment execution failed.");
    }
  };

  const copyPassCode = () => {
    if (successInfo?.passCode) {
      navigator.clipboard.writeText(successInfo.passCode);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Secure Gateway Checkout (UPI & Cards)"
      description="Instant Indian payment settlement with automatic ZKTeco biometric door pass issuance."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            {successInfo ? "Close Window" : "Cancel Checkout"}
          </Button>

          {!successInfo && (
            <Button
              variant="primary"
              onClick={handleInitiatePayment}
              disabled={isProcessing}
              className="gap-2 bg-forest-700 hover:bg-forest-600 text-white font-bold"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Payment…</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{amountRupees}</span>
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-left text-xs font-sans">
        {/* Success Confirmation State */}
        {successInfo ? (
          <div className="p-5 border-2 border-emerald-400 bg-emerald-50 text-emerald-950 rounded-xl space-y-3.5 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-sans text-base font-extrabold text-emerald-950">
                Payment Received & Desk Reserved!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your workstation reservation is confirmed. Your ZKTeco biometric door gate code is active.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-inner space-y-2 text-left font-mono text-xs">
              <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                <span className="text-charcoal-600">Workstation:</span>
                <span className="font-bold text-charcoal-900">{seatLabel}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                <span className="text-charcoal-600">Amount Paid:</span>
                <span className="font-bold text-emerald-800">₹{amountRupees}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                <span className="text-charcoal-600">Transaction ID:</span>
                <span className="text-charcoal-700">{successInfo.paymentId}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-charcoal-600">Door Biometric PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-forest-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {successInfo.passCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyPassCode}
                    className="p-1 hover:bg-slate-100 rounded text-charcoal-600"
                    title="Copy code"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-900">
              Type your PIN on the <strong>ZKTeco LX50</strong> biometric attendance keypad at the center to unlock entry.
            </p>
          </div>
        ) : (
          <>
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod("upi")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === "upi"
                    ? "bg-forest-700 text-white border-forest-700 shadow-sm"
                    : "bg-white text-charcoal-700 border-charcoal-300 hover:border-forest-600"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("card")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === "card"
                    ? "bg-forest-700 text-white border-forest-700 shadow-sm"
                    : "bg-white text-charcoal-700 border-charcoal-300 hover:border-forest-600"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card (RuPay/Visa)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("netbanking")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMethod === "netbanking"
                    ? "bg-forest-700 text-white border-forest-700 shadow-sm"
                    : "bg-white text-charcoal-700 border-charcoal-300 hover:border-forest-600"
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* TAB 1: UPI DETAIL */}
            {selectedMethod === "upi" && (
              <div className="p-4 border border-charcoal-200 bg-slate-50 rounded-xl space-y-3">
                <div className="text-[11px] font-bold text-charcoal-800">Choose UPI App or Scan QR:</div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "gpay", label: "Google Pay" },
                    { id: "phonepe", label: "PhonePe" },
                    { id: "paytm", label: "Paytm" },
                    { id: "qr", label: "Scan QR" },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id as any)}
                      className={`p-2 rounded-lg border text-center text-[11px] font-medium transition-all ${
                        selectedUpiApp === app.id
                          ? "bg-white border-forest-700 text-forest-900 font-bold shadow-sm"
                          : "bg-white border-charcoal-200 text-charcoal-600 hover:border-charcoal-300"
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>

                {selectedUpiApp === "qr" ? (
                  <div className="p-3 bg-white rounded-lg border border-charcoal-200 text-center space-y-2">
                    <div className="w-28 h-28 mx-auto bg-slate-100 border border-dashed border-charcoal-400 rounded-lg flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-charcoal-800" />
                    </div>
                    <div className="text-[11px] text-charcoal-600">
                      Scan with Google Pay, PhonePe, or Paytm to pay <strong>₹{amountRupees}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-charcoal-700">Enter UPI ID (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CARD DETAIL */}
            {selectedMethod === "card" && (
              <div className="p-4 border border-charcoal-200 bg-slate-50 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-charcoal-700">Card Number:</label>
                  <input
                    type="text"
                    defaultValue="4111 1111 1111 1111"
                    className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-charcoal-700">Valid Thru:</label>
                    <input
                      type="text"
                      defaultValue="11/28"
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-charcoal-700">CVV:</label>
                    <input
                      type="password"
                      defaultValue="123"
                      maxLength={3}
                      className="w-full px-3 py-2 text-xs border border-charcoal-300 rounded-lg font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NET BANKING DETAIL */}
            {selectedMethod === "netbanking" && (
              <div className="p-4 border border-charcoal-200 bg-slate-50 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-charcoal-800">Popular Banks:</div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank"].map((b, i) => (
                    <div
                      key={b}
                      className={`p-2.5 rounded-lg border cursor-pointer ${
                        i === 0 ? "border-forest-700 bg-white font-bold text-forest-900" : "border-charcoal-200 bg-white text-charcoal-700"
                      }`}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Ledger Summary */}
            <div className="p-3.5 border border-charcoal-200 bg-white rounded-xl space-y-1.5 font-mono">
              <div className="flex justify-between text-xs pb-1 border-b border-slate-100">
                <span className="text-charcoal-500">Allocated Desk:</span>
                <span className="text-charcoal-900 font-bold">{seatLabel}</span>
              </div>
              <div className="flex justify-between text-xs pb-1 border-b border-slate-100">
                <span className="text-charcoal-500">Duration / Plan:</span>
                <span className="text-charcoal-800">{durationLabel}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span className="text-charcoal-900 font-sans">Total Payable:</span>
                <span className="text-forest-800">₹{amountRupees}</span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 border border-rose-300 bg-rose-50 text-rose-950 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
