/**
 * Razorpay Standard Checkout & Webhook Integration (TEST Mode)
 *
 * Implements:
 * 1. Server-side Order Creation with integer paise amount.
 * 2. Cryptographic signature verification using HMAC SHA-256.
 * 3. Raw-body Webhook signature validation.
 * 4. Provider payment status lookup.
 * 5. Provider refund dispatching.
 * 6. Cryptographic Test Simulator fallback when live keys are unconfigured.
 */

import crypto from "crypto";

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number; // in paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  created_at: number;
}

export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number; // in paise
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  method: string;
  captured: boolean;
  email: string;
  contact: string;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  created_at: number;
}

export interface RazorpayRefundResult {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: "pending" | "processing" | "processed" | "succeeded" | "failed";
  speed_processed: string;
  created_at: number;
}

export class RazorpayClient {
  private static getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_sanctuary_demo";
  }

  private static getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_sanctuary_demo";
  }

  private static getWebhookSecret(): string {
    return process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_sanctuary_test_secret";
  }

  public static isConfigured(): boolean {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    return (
      keyId.startsWith("rzp_test_") &&
      keySecret.trim().length > 10 &&
      !keyId.includes("placeholder") &&
      !keyId.includes("demo")
    );
  }

  /**
   * Generates standard HMAC SHA-256 signature for test validation
   */
  public static generateTestSignature(orderId: string, paymentId: string, secret?: string): string {
    const key = secret || this.getKeySecret();
    return crypto.createHmac("sha256", key).update(`${orderId}|${paymentId}`).digest("hex");
  }

  /**
   * Generates webhook signature on raw request body
   */
  public static generateWebhookSignature(rawBody: string, secret?: string): string {
    const key = secret || this.getWebhookSecret();
    return crypto.createHmac("sha256", key).update(rawBody).digest("hex");
  }

  /**
   * 1. Create a Razorpay Order on the server using saved price in paise
   */
  public static async createOrder(options: {
    amountPaise: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    const currency = options.currency || "INR";

    if (this.isConfigured()) {
      const auth = Buffer.from(`${this.getKeyId()}:${this.getKeySecret()}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: options.amountPaise,
          currency,
          receipt: options.receipt,
          notes: options.notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          `Razorpay Order Creation Failed: ${errData.error?.description || res.statusText}`
        );
      }

      return (await res.json()) as RazorpayOrderResult;
    }

    // Cryptographic Test Mode Simulator
    const orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      id: orderId,
      entity: "order",
      amount: options.amountPaise,
      amount_paid: 0,
      amount_due: options.amountPaise,
      currency,
      receipt: options.receipt,
      status: "created",
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 2. Verify Razorpay Checkout Signature server-side
   * Formula: hmac_sha256(order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
   */
  public static verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;
    if (!orderId || !paymentId || !signature) return false;

    const secret = this.getKeySecret();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8")
      );
    } catch {
      return false;
    }
  }

  /**
   * 3. Verify Razorpay Webhook Signature on raw request body
   */
  public static verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!rawBody || !signatureHeader) return false;

    const webhookSecret = this.getWebhookSecret();
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signatureHeader, "utf-8")
      );
    } catch {
      return false;
    }
  }

  /**
   * 4. Fetch Payment Details directly from Razorpay API
   */
  public static async fetchPaymentDetails(paymentId: string): Promise<RazorpayPaymentDetails> {
    if (this.isConfigured()) {
      const auth = Buffer.from(`${this.getKeyId()}:${this.getKeySecret()}`).toString("base64");
      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch payment details for ${paymentId}: ${res.statusText}`);
      }

      return (await res.json()) as RazorpayPaymentDetails;
    }

    // Simulator response
    return {
      id: paymentId,
      entity: "payment",
      amount: 3800000,
      currency: "INR",
      status: "captured",
      order_id: `order_sim_${paymentId}`,
      method: "card",
      captured: true,
      email: "resident.fellow@sanctuary-study.com",
      contact: "+919876543210",
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 5. Dispatch Refund to Razorpay
   */
  public static async initiateRefund(options: {
    paymentId: string;
    amountPaise?: number;
    notes?: Record<string, string>;
  }): Promise<RazorpayRefundResult> {
    if (this.isConfigured()) {
      const auth = Buffer.from(`${this.getKeyId()}:${this.getKeySecret()}`).toString("base64");
      const res = await fetch(`https://api.razorpay.com/v1/payments/${options.paymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: options.amountPaise,
          notes: options.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Razorpay Refund Failed: ${err.error?.description || res.statusText}`);
      }

      return (await res.json()) as RazorpayRefundResult;
    }

    // Simulator refund (state starts at 'processing' until confirmed by webhook/provider)
    return {
      id: `rfnd_test_${Date.now()}`,
      entity: "refund",
      amount: options.amountPaise || 3800000,
      currency: "INR",
      payment_id: options.paymentId,
      status: "processing" as const,
      speed_processed: "normal",
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Alias for initiateRefund
   */
  public static async createRefund(options: {
    paymentId: string;
    amountPaise?: number;
    notes?: Record<string, string>;
  }): Promise<RazorpayRefundResult> {
    return this.initiateRefund(options);
  }
}
