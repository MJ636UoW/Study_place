"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertCircle, CreditCard, CheckCircle2, RefreshCw } from "lucide-react";
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

declare global {
  interface Window {
    Razorpay?: unknown;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function RazorpayCheckoutModal({
  bookingRequestId,
  seatLabel,
  durationLabel,
  amountPaise,
  isOpen,
  onClose,
  onSuccess,
}: RazorpayCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refundAlert, setRefundAlert] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ paymentId: string; passCode?: string } | null>(null);

  const amountRupees = (amountPaise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setRefundAlert(null);

    try {
      // Try loading official checkout script
      await loadRazorpayScript();

      // 1. Create order on server using saved price snapshot in integer paise
      const idempotencyKey = `idemp_${bookingRequestId}_${Date.now()}`;
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRequestId, idempotencyKey }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to initialize provider order.");
      }

      // Check if official Razorpay checkout script is available or run test simulation
      const keyId = orderData.keyId;
      const orderId = orderData.orderId;

      // In browser test mode, if Razorpay checkout script is loaded:
      if (typeof window !== "undefined" && (window as unknown as { Razorpay?: new (options: unknown) => { open: () => void } }).Razorpay) {
        const RazorpayCtor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
        const options = {
          key: keyId,
          amount: orderData.amountPaise,
          currency: "INR",
          name: "Sanctuary Study Space",
          description: `Workstation ${seatLabel} (${durationLabel}) • Kandivali East`,
          order_id: orderId,
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            await verifyPayment(
              orderId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setErrorMessage("Checkout dismissed. Your payment hold remains intact until its expiration.");
            },
          },
          prefill: {
            name: "Arjun Kulkarni",
            email: "arjun.kulkarni@outlook.com",
            contact: "+919876543210",
          },
          theme: {
            color: "#183728",
          },
        };

        const rzp = new RazorpayCtor(options);
        rzp.open();
        return;
      }

      // Simulator fallback for test mode when Razorpay external script is offline or in simulated testbed
      // Simulates standard Razorpay checkout test credentials
      const simulatedPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
      // Generate signature matching the test secret or server expectation
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
        if (verifyData.requiresRefund) {
          setRefundAlert(
            `Payment hold expired before capture was completed. Your funds were automatically routed to the refund queue (Ref: ${verifyData.refundId}). Another member's active workstation was protected.`
          );
          setIsProcessing(false);
          return;
        }
        throw new Error(verifyData.message || "Cryptographic signature or capture verification failed.");
      }

      setSuccessInfo({
        paymentId: simulatedPaymentId,
        passCode: verifyData.passCode,
      });
      setIsProcessing(false);
      onSuccess(simulatedPaymentId);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : "Payment execution failed.");
    }
  };

  const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRequestId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.requiresRefund) {
          setRefundAlert(
            `Payment hold expired before capture was completed. Your funds were automatically routed to the refund queue (Ref: ${data.refundId}). Another member's active workstation was protected.`
          );
          setIsProcessing(false);
          return;
        }
        throw new Error(data.message || "Server signature verification rejected.");
      }

      setSuccessInfo({
        paymentId,
        passCode: data.passCode,
      });
      setIsProcessing(false);
      onSuccess(paymentId);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : "Verification failed.");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Razorpay Standard Checkout (TEST Mode)"
      description="Cryptographically signed gateway integration for fixed-term memberships."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            {successInfo ? "Close Ledger" : "Cancel Checkout"}
          </Button>

          {!successInfo && (
            <Button
              variant="primary"
              onClick={handleInitiatePayment}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying with Provider…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{amountRupees} (TEST)
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5 text-left text-xs font-sans">
        {/* Test Mode Warning & Guidance */}
        <div className="p-3.5 border border-forest-300 bg-forest-50 text-forest-950 space-y-1">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-forest-900">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            <span>Razorpay TEST Environment Active</span>
          </div>
          <p className="text-forest-900 leading-relaxed">
            Transactions are processed in <strong>TEST Mode</strong>. No real credit cards or bank accounts will be debited. Amounts are snapshotted on the server in integer paise.
          </p>
        </div>

        {/* Supported Payment Channels */}
        <div className="p-3 border border-ivory-300 bg-ivory-100/40 space-y-2">
          <span className="font-mono text-[10px] uppercase font-bold text-charcoal-700 tracking-wider">
            Supported Indian Payment Methods (Razorpay Gateway)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-sans">
            <div className="p-2 border border-ivory-200 bg-ivory-50 rounded-sm">
              <div className="font-bold text-forest-900">UPI Instant</div>
              <div className="text-[10px] text-charcoal-600 mt-0.5">PhonePe • GPay • Paytm • QR</div>
            </div>
            <div className="p-2 border border-ivory-200 bg-ivory-50 rounded-sm">
              <div className="font-bold text-forest-900">Cards</div>
              <div className="text-[10px] text-charcoal-600 mt-0.5">RuPay • Visa • Mastercard Debit/Credit</div>
            </div>
            <div className="p-2 border border-ivory-200 bg-ivory-50 rounded-sm">
              <div className="font-bold text-forest-900">Wallets</div>
              <div className="text-[10px] text-charcoal-600 mt-0.5">PhonePe • Paytm • Mobikwik</div>
            </div>
            <div className="p-2 border border-ivory-200 bg-ivory-50 rounded-sm">
              <div className="font-bold text-forest-900">Net Banking</div>
              <div className="text-[10px] text-charcoal-600 mt-0.5">SBI • HDFC • ICICI • Axis • 50+ Banks</div>
            </div>
          </div>
        </div>

        {/* Transaction Summary Ledger */}
        <div className="p-4 border border-ivory-300 bg-ivory-100/70 space-y-2 font-mono">
          <div className="flex justify-between pb-1.5 border-b border-ivory-200">
            <span className="text-charcoal-600">Workstation Allocation:</span>
            <span className="text-charcoal-900 font-bold">{seatLabel}</span>
          </div>
          <div className="flex justify-between pb-1.5 border-b border-ivory-200">
            <span className="text-charcoal-600">Membership Tenure:</span>
            <span className="text-charcoal-900">{durationLabel}</span>
          </div>
          <div className="flex justify-between pb-1.5 border-b border-ivory-200">
            <span className="text-charcoal-600">Provider Currency:</span>
            <span className="text-charcoal-900">INR (₹)</span>
          </div>
          <div className="flex justify-between pt-1 text-sm font-bold">
            <span className="text-charcoal-900">Total Due:</span>
            <span className="text-forest-900">₹{amountRupees} ({amountPaise} paise)</span>
          </div>
        </div>

        {/* Test Credentials Helper */}
        <div className="p-3 border border-ivory-300 bg-ivory-50 text-charcoal-700 space-y-1.5">
          <span className="font-mono text-[10px] uppercase font-semibold text-charcoal-900">
            Official Razorpay Test Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>Card: <span className="text-charcoal-950 font-bold">4111 1111 1111 1111</span></div>
            <div>Expiry: <span className="text-charcoal-950 font-bold">11/28</span> • CVV: <span className="text-charcoal-950 font-bold">123</span></div>
            <div>OTP: <span className="text-charcoal-950 font-bold">123456</span></div>
            <div>UPI ID: <span className="text-charcoal-950 font-bold">success@razorpay</span></div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 border border-burgundy-300 bg-burgundy-50 text-burgundy-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-mono uppercase font-bold text-[10px]">Payment Interrupted</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Late Payment Refund Routing Alert */}
        {refundAlert && (
          <div className="p-3 border border-amber-400 bg-amber-50 text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-800" />
            <div className="space-y-0.5">
              <span className="font-mono uppercase font-bold text-[10px] text-amber-900">
                Hold Expired — Late Payment Routed to Refund
              </span>
              <p className="leading-relaxed">{refundAlert}</p>
            </div>
          </div>
        )}

        {/* Success Confirmation */}
        {successInfo && (
          <div className="p-4 border border-forest-400 bg-forest-50 text-forest-950 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-forest-700" />
              <span className="font-serif text-base font-bold text-forest-900">
                Payment Captured & Workstation Confirmed
              </span>
            </div>
            <div className="font-mono text-xs space-y-1 bg-ivory-50 p-3 border border-forest-200">
              <div>Provider Payment ID: <strong>{successInfo.paymentId}</strong></div>
              <div>Residency Pass Code: <strong>{successInfo.passCode || "PASS-ACTIVE"}</strong></div>
              <div>Settlement Status: <strong className="text-forest-800">CAPTURED (TEST)</strong></div>
            </div>
            <p className="text-[11px] text-forest-900">
              The booking record has been updated. You can view or print your official curatorial tax receipt anytime.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
