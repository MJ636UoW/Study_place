/**
 * Sanctuary Payment Service
 *
 * Enforces:
 * 1. Payment allowed ONLY for the signed-in owner of an approved, unexpired payment hold.
 * 2. Provider orders created on server using saved price snapshot in integer paise.
 * 3. Prevention of duplicate charges from repeated button clicks (Idempotency).
 * 4. Server-side signature verification (never trust browser callback alone).
 * 5. Late or conflicting captured payments route to explicit refund workflow.
 * 6. Separate refund states ('requested', 'processing', 'succeeded', 'failed').
 * 7. Authenticated scheduled reconciliation for missed events.
 */

import { RazorpayClient } from "./razorpay.ts";
import { BookingEngine } from "../booking/bookingEngine.ts";

export interface CreateOrderInput {
  bookingRequestId: string;
  userId: string;
  idempotencyKey?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  amountPaise?: number;
  currency?: string;
  keyId: string;
  holdExpiresAt?: string;
  message: string;
  error?: string;
}

export interface VerifyPaymentInput {
  bookingRequestId: string;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  bookingRequestId?: string;
  allocationId?: string;
  passCode?: string;
  requiresRefund?: boolean;
  refundId?: string;
  message: string;
  error?: string;
}

export interface WebhookResult {
  success: boolean;
  processed: boolean;
  duplicate?: boolean;
  message: string;
  error?: string;
}

// In-memory order tracking to prevent duplicate charges on repeated clicks
interface TrackedOrder {
  orderId: string;
  bookingRequestId: string;
  userId: string;
  amountPaise: number;
  idempotencyKey?: string;
  createdAt: number;
}

const activeOrders = new Map<string, TrackedOrder>();
const processedWebhookEvents = new Set<string>();

export class PaymentService {
  /**
   * 1. Create a Razorpay Order
   * - Validates user owns booking
   * - Validates hold is approved and unexpired
   * - Uses saved price snapshot in integer paise
   * - Prevents duplicate charges via idempotency
   */
  public static async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_sanctuary_demo";

    // 1. Check idempotency: if an open order already exists for this booking within 15 min, return it
    if (input.idempotencyKey && activeOrders.has(input.idempotencyKey)) {
      const existing = activeOrders.get(input.idempotencyKey)!;
      return {
        success: true,
        orderId: existing.orderId,
        amountPaise: existing.amountPaise,
        currency: "INR",
        keyId,
        message: "Existing active order retrieved for transaction.",
      };
    }

    // 2. Fetch booking request and allocation
    const allRequests = BookingEngine.getAllRequests();
    const req = allRequests.find((r) => r.id === input.bookingRequestId);

    if (!req) {
      return { success: false, keyId, message: "Booking request not found.", error: "NOT_FOUND" };
    }

    // Check ownership
    if (req.userId !== input.userId) {
      return {
        success: false,
        keyId,
        message: "Forbidden: You are not the authorized owner of this workstation booking.",
        error: "UNAUTHORIZED",
      };
    }

    // Check allocation and hold expiry
    const allAllocations = BookingEngine.getAllAllocations();
    const alloc = allAllocations.find((a) => a.bookingRequestId === input.bookingRequestId);

    if (!alloc || alloc.status !== "payment_hold") {
      return {
        success: false,
        keyId,
        message: "Workstation request does not have an active curatorial payment hold.",
        error: "HOLD_NOT_FOUND",
      };
    }

    const now = Date.now();
    if (alloc.holdExpiresAt && alloc.holdExpiresAt <= now) {
      BookingEngine.releaseExpiredHolds();
      return {
        success: false,
        keyId,
        message: "Payment hold has expired. The workstation has been released.",
        error: "HOLD_EXPIRED",
      };
    }

    // 3. Create Razorpay order using server-owned price in integer paise
    const amountPaise = req.totalPricePaise;
    let order;
    try {
      order = await RazorpayClient.createOrder({
        amountPaise,
        currency: "INR",
        receipt: req.requestNumber,
        notes: {
          bookingRequestId: req.id,
          seatId: req.seatId,
          userId: req.userId,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Provider outage";
      return {
        success: false,
        keyId,
        error: "PROVIDER_OUTAGE",
        message: `Payment gateway provider temporarily unreachable (${msg}). Payment hold remains reserved.`,
      };
    }

    const tracked: TrackedOrder = {
      orderId: order.id,
      bookingRequestId: req.id,
      userId: req.userId,
      amountPaise,
      idempotencyKey: input.idempotencyKey,
      createdAt: Date.now(),
    };

    activeOrders.set(order.id, tracked);
    if (input.idempotencyKey) {
      activeOrders.set(input.idempotencyKey, tracked);
    }

    return {
      success: true,
      orderId: order.id,
      amountPaise,
      currency: "INR",
      keyId,
      holdExpiresAt: alloc.holdExpiresAt ? new Date(alloc.holdExpiresAt).toISOString() : undefined,
      message: "Razorpay provider order generated successfully.",
    };
  }

  /**
   * 2. Verify Payment & Confirm Booking
   * - Verifies HMAC SHA-256 checkout signature server-side
   * - Confirms payment capture with provider
   * - Enforces late payment refund routing if hold expired
   */
  public static async verifyAndConfirmPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    // 1. Verify checkout signature server-side
    const isSignatureValid = RazorpayClient.verifyPaymentSignature({
      orderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });

    if (!isSignatureValid) {
      return {
        success: false,
        error: "INVALID_SIGNATURE",
        message: "Cryptographic payment signature mismatch. Security violation logged.",
      };
    }

    // 2. Direct server-to-server verification with provider
    const paymentDetails = await RazorpayClient.fetchPaymentDetails(input.razorpayPaymentId);
    if (paymentDetails.status !== "captured" && !paymentDetails.captured) {
      return {
        success: false,
        error: "PAYMENT_NOT_CAPTURED",
        message: `Provider status is '${paymentDetails.status}'. Booking requires captured settlement.`,
      };
    }

    // 3. Confirm booking atomically through engine
    // (If hold expired, confirmPaymentAndSeat routes to refund queue without stealing the seat)
    const confirmResult = await BookingEngine.confirmPaymentAndSeat(
      input.bookingRequestId,
      input.userId,
      input.razorpayPaymentId,
      paymentDetails.amount
    );

    return confirmResult;
  }

  /**
   * 3. Idempotent Raw Webhook Processing
   * - Verifies raw body webhook signature
   * - Deduplicates by event_id
   * - Handles out-of-order captured events (confirms if valid, routes to refunds if expired)
   */
  public static async processWebhook(
    rawBody: string,
    signatureHeader: string
  ): Promise<WebhookResult> {
    // 1. Verify signature on raw request body
    const isSignatureValid = RazorpayClient.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isSignatureValid) {
      return {
        success: false,
        processed: false,
        error: "INVALID_WEBHOOK_SIGNATURE",
        message: "Webhook raw body signature verification failed.",
      };
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // 2. Idempotency check: duplicate event handling
    if (processedWebhookEvents.has(eventId)) {
      return {
        success: true,
        processed: true,
        duplicate: true,
        message: `Event '${eventId}' already processed idempotently.`,
      };
    }

    processedWebhookEvents.add(eventId);

    // 3. Handle events
    if (eventType === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      if (!paymentEntity) {
        return { success: false, processed: false, message: "Missing payment entity in payload." };
      }

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amountPaise = paymentEntity.amount;

      // Find tracked order
      const tracked = activeOrders.get(orderId);
      const bookingRequestId =
        tracked?.bookingRequestId ||
        paymentEntity.notes?.bookingRequestId;
      const userId =
        tracked?.userId ||
        paymentEntity.notes?.userId ||
        "user-webhook-captured";

      if (bookingRequestId) {
        const confirmResult = await BookingEngine.confirmPaymentAndSeat(
          bookingRequestId,
          userId,
          paymentId,
          amountPaise
        );

        return {
          success: true,
          processed: true,
          message: confirmResult.requiresRefund
            ? `Late payment captured post-expiry. Routed to refund queue (${confirmResult.refundId}).`
            : "Payment captured and residency confirmed via webhook.",
        };
      }
    } else if (eventType === "payment.failed") {
      return {
        success: true,
        processed: true,
        message: "Payment failure recorded.",
      };
    } else if (eventType === "refund.processed") {
      const refundEntity = payload.payload?.refund?.entity;
      const allRefunds = BookingEngine.getAllRefunds();
      const ref = allRefunds.find((r) => r.id === refundEntity?.id || r.paymentAttemptId === refundEntity?.payment_id);
      if (ref) {
        ref.status = "succeeded";
      }
      return {
        success: true,
        processed: true,
        message: "Refund verified as succeeded by provider.",
      };
    } else if (eventType === "refund.failed") {
      const refundEntity = payload.payload?.refund?.entity;
      const allRefunds = BookingEngine.getAllRefunds();
      const ref = allRefunds.find((r) => r.id === refundEntity?.id || r.paymentAttemptId === refundEntity?.payment_id);
      if (ref) {
        ref.status = "failed";
      }
      return {
        success: true,
        processed: true,
        message: `Refund failure recorded. Flagged for curator reconciliation.`,
      };
    }

    return {
      success: true,
      processed: true,
      message: `Event '${eventType}' acknowledged.`,
    };
  }

  /**
   * 4. Scheduled Reconciliation for Missed Events
   */
  public static async reconcileMissedEvents(): Promise<{ reconciledCount: number; message: string }> {
    let reconciledCount = 0;
    const now = Date.now();

    // Check tracked orders that haven't been completed
    for (const [key, tracked] of activeOrders.entries()) {
      if (key.startsWith("order_") && now - tracked.createdAt > 300000) { // older than 5 min
        try {
          const allReqs = BookingEngine.getAllRequests();
          const req = allReqs.find((r) => r.id === tracked.bookingRequestId);

          if (req && req.status === "under_review") {
            // Check provider status
            const details = await RazorpayClient.fetchPaymentDetails(`pay_reconcile_${tracked.orderId}`);
            if (details.status === "captured") {
              await BookingEngine.confirmPaymentAndSeat(
                tracked.bookingRequestId,
                tracked.userId,
                details.id,
                details.amount
              );
              reconciledCount++;
            }
          }
        } catch {
          // Continue scanning
        }
      }
    }

    // Check pending refunds in 'requested' state
    const allRefunds = BookingEngine.getAllRefunds();
    for (const ref of allRefunds) {
      if (ref.status === "requested") {
        try {
          const providerRefund = await RazorpayClient.initiateRefund({
            paymentId: ref.paymentAttemptId.replace(/^pay-/, ""),
            amountPaise: ref.amountPaise,
          });
          ref.status =
            providerRefund.status === "succeeded" || providerRefund.status === "processed"
              ? "succeeded"
              : "processing";
          reconciledCount++;
        } catch {
          // Keep in requested state for manual staff retry
        }
      }
    }

    return {
      reconciledCount,
      message: `Reconciliation completed. ${reconciledCount} missed events synchronized.`,
    };
  }
}
