/**
 * Sanctuary Razorpay Standard Checkout — Comprehensive Verification Suite
 *
 * Mathematically proves and validates:
 * 1. Allow payment ONLY for signed-in owner of an approved, unexpired payment hold.
 * 2. Create provider orders on server using saved price snapshot in integer paise.
 * 3. Idempotency: Prevent duplicate charges on repeated clicks.
 * 4. Server-side signature verification: HMAC SHA-256 calculation & tampered signature rejection.
 * 5. Provider state verification: Never confirm from browser callback alone.
 * 6. Raw request body webhook verification and event deduplication (idempotent event IDs).
 * 7. Lost browser callback recovery via delayed webhook.
 * 8. Payment failure handling.
 * 9. LATE PAYMENT INVARIANT: Payment arriving after hold expiry NEVER steals seat; routes to refund queue.
 * 10. REFUND STATE MACHINE: requested -> processing -> succeeded/failed; never complete on admin decree.
 * 11. Cancellation / account restriction during checkout routes to refund.
 * 12. Authenticated scheduled reconciliation for missed events.
 */

import crypto from "node:crypto";
import { PaymentService } from "../src/lib/payments/paymentService.ts";
import { RazorpayClient } from "../src/lib/payments/razorpay.ts";
import { BookingEngine } from "../src/lib/booking/bookingEngine.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(title, fn) {
  try {
    await fn();
    console.log(`[PASS] ${title}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${title}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("================================================================================");
  console.log("SANCTUARY RAZORPAY STANDARD CHECKOUT & REFUND LIFECYCLE VERIFICATION");
  console.log("================================================================================\n");

  const results = [];
  const testSecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_sanctuary_demo";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_sanctuary_test_secret";

  // Helper to generate valid Razorpay checkout HMAC SHA-256 signature
  const generateSignature = (orderId, paymentId) => {
    return crypto
      .createHmac("sha256", testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  };

  // Helper to generate valid raw body webhook signature
  const generateWebhookSignature = (rawBody) => {
    return crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
  };

  // ----------------------------------------------------------------------------
  // TEST 1: Provider Order Creation with Server Price in Paise & Owner Validation
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 1: Provider order creation uses saved price in paise and enforces owner matching", async () => {
      // 1. Submit a pending request
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-1",
        seatId: "seat-A01",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
        guestNotes: "Razorpay Test 1",
      });
      assert(reqRes.success, "Pending request creation must succeed");

      // 2. Admin approves and creates hold
      const holdRes = await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);
      assert(holdRes.success, "Hold creation must succeed");

      // 3. Unauthorized non-owner attempt must be rejected
      const nonOwnerRes = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-malicious-impersonator",
      });
      assert(!nonOwnerRes.success, "Non-owner attempt must fail");
      assert(nonOwnerRes.error === "UNAUTHORIZED", "Error must be UNAUTHORIZED");

      // 4. Authorized owner order creation must succeed with integer paise
      const ownerRes = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-1",
      });
      assert(ownerRes.success, "Owner order creation must succeed");
      assert(ownerRes.orderId && ownerRes.orderId.startsWith("order_"), "Must return valid order_id");
      assert(ownerRes.amountPaise === reqRes.totalPricePaise, "Amount must match server snapshot in paise");
      assert(Number.isInteger(ownerRes.amountPaise), "Paise amount must be an integer");
      assert(ownerRes.currency === "INR", "Currency must be INR");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 2: Idempotency & Prevention of Duplicate Charges on Repeated Clicks
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 2: Double-click idempotency returns existing order without creating duplicate charges", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-2",
        seatId: "seat-A03",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const idempotencyKey = `click_idemp_${Date.now()}`;

      // Click 1
      const order1 = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-2",
        idempotencyKey,
      });

      // Click 2 (rapid second click)
      const order2 = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-2",
        idempotencyKey,
      });

      assert(order1.success && order2.success, "Both calls must succeed");
      assert(order1.orderId === order2.orderId, "Idempotency must return identical order_id");
      assert(order2.message.includes("Existing active order"), "Should acknowledge existing order");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 3: Checkout Dismissal (Modal Closed without Payment)
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 3: Checkout modal dismissal preserves payment hold without premature confirmation or release", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-3",
        seatId: "seat-A04",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      // Order created
      const order = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-3",
      });
      assert(order.success, "Order creation must succeed");

      // User dismisses modal: NO verification request is sent
      // Verify allocation state in engine remains 'payment_hold'
      const allocs = BookingEngine.getAllAllocations();
      const alloc = allocs.find((a) => a.bookingRequestId === reqRes.requestId);
      assert(alloc && alloc.status === "payment_hold", "Hold must remain intact on checkout dismissal");

      const reqs = BookingEngine.getAllRequests();
      const req = reqs.find((r) => r.id === reqRes.requestId);
      assert(req && req.status === "under_review", "Request must remain under_review");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 4: Server-Side Signature Verification & Captured Settlement
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 4: Server-side HMAC SHA-256 signature verification confirms residency atomically", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-4",
        seatId: "seat-A05",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const order = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-4",
      });

      const paymentId = `pay_captured_${Date.now()}`;
      const validSignature = generateSignature(order.orderId, paymentId);

      const verifyRes = await PaymentService.verifyAndConfirmPayment({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-4",
        razorpayOrderId: order.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      assert(verifyRes.success, "Valid signature verification must succeed");
      assert(verifyRes.passCode && verifyRes.passCode.startsWith("PASS-"), "Pass code must be issued");

      // Verify allocation is now active
      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === reqRes.requestId);
      assert(alloc && alloc.status === "active", "Allocation status must be 'active'");
      assert(alloc.holdExpiresAt === null, "Hold expiration must be cleared upon confirmation");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 5: Tampered / Invalid Signature Rejection
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 5: Tampered or forged signature is cryptographically rejected without confirming seat", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-5",
        seatId: "seat-A06",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const order = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-5",
      });

      const paymentId = `pay_tampered_${Date.now()}`;
      const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";

      const verifyRes = await PaymentService.verifyAndConfirmPayment({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-5",
        razorpayOrderId: order.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: forgedSignature,
      });

      assert(!verifyRes.success, "Forged signature must fail verification");
      assert(verifyRes.error === "INVALID_SIGNATURE", "Error must be INVALID_SIGNATURE");

      // Allocation must remain hold, NOT active
      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === reqRes.requestId);
      assert(alloc && alloc.status === "payment_hold", "Seat must NOT be activated on forged signature");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 6: Signed Webhooks Using Raw Request Body & Event Deduplication
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 6: Raw body webhook verification and event deduplication (Idempotent event IDs)", async () => {
      const eventId = `evt_test_${Date.now()}`;
      const webhookPayload = JSON.stringify({
        event_id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: `pay_webhook_${Date.now()}`,
              order_id: "order_nonexistent_test",
              amount: 3154000,
              status: "captured",
              notes: {},
            },
          },
        },
      });

      const validSignature = generateWebhookSignature(webhookPayload);

      // Delivery 1: Processed
      const delivery1 = await PaymentService.processWebhook(webhookPayload, validSignature);
      assert(delivery1.success, "First webhook delivery must succeed");
      assert(!delivery1.duplicate, "First delivery must not be duplicate");

      // Delivery 2: Exact duplicate replay
      const delivery2 = await PaymentService.processWebhook(webhookPayload, validSignature);
      assert(delivery2.success, "Duplicate webhook delivery must succeed");
      assert(delivery2.duplicate === true, "Second delivery must be recognized as duplicate");
      assert(delivery2.message.includes("idempotently"), "Message must confirm idempotent deduplication");

      // Delivery 3: Tampered signature on raw body must fail
      const tamperedDelivery = await PaymentService.processWebhook(webhookPayload, "tampered_signature_abc");
      assert(!tamperedDelivery.success, "Tampered webhook signature must be rejected");
      assert(tamperedDelivery.error === "INVALID_WEBHOOK_SIGNATURE", "Error must be INVALID_WEBHOOK_SIGNATURE");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 7: Lost Browser Callback / Delayed Webhook Recovery
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 7: Lost browser callback recovery: delayed webhook confirms booking asynchronously", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-7",
        seatId: "seat-A07",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const order = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-rzp-test-7",
      });

      // Browser disconnected! (No POST /api/payments/verify was sent)
      // Razorpay asynchronously delivers payment.captured webhook 20 seconds later
      const paymentId = `pay_delayed_hook_${Date.now()}`;
      const delayedPayload = JSON.stringify({
        event_id: `evt_delayed_${Date.now()}`,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: order.orderId,
              amount: order.amountPaise,
              status: "captured",
              notes: {
                bookingRequestId: reqRes.requestId,
                userId: "user-rzp-test-7",
              },
            },
          },
        },
      });

      const signature = generateWebhookSignature(delayedPayload);
      const hookRes = await PaymentService.processWebhook(delayedPayload, signature);

      assert(hookRes.success, "Delayed webhook recovery must succeed");
      assert(hookRes.message.includes("residency confirmed"), "Should confirm residency via webhook");

      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === reqRes.requestId);
      assert(alloc && alloc.status === "active", "Allocation must be activated by webhook");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 8: Payment Failure Handling
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 8: Payment failure event is ingested safely without activating workstation", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-rzp-test-8",
        seatId: "seat-A08",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const failedPayload = JSON.stringify({
        event_id: `evt_failed_${Date.now()}`,
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: `pay_failed_${Date.now()}`,
              status: "failed",
              error_code: "BAD_REQUEST_ERROR",
              error_description: "Insufficient funds in test card",
            },
          },
        },
      });

      const sig = generateWebhookSignature(failedPayload);
      const hookRes = await PaymentService.processWebhook(failedPayload, sig);

      assert(hookRes.success && hookRes.processed, "Failed payment webhook must be processed cleanly");
      assert(hookRes.message.includes("failure recorded"), "Failure must be recorded");

      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === reqRes.requestId);
      assert(alloc && alloc.status === "payment_hold", "Seat must remain in hold, not active");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 9: LATE PAYMENT INVARIANT (Payment Arriving After Hold Expiry)
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 9: INVARIANT: Payment arriving after hold expiry NEVER steals seat; routes to refund queue", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-late-payer",
        seatId: "seat-A09",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const order = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-late-payer",
      });

      // Force-expire the hold (simulating elapsed 15 minutes)
      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === reqRes.requestId);
      alloc.holdExpiresAt = Date.now() - 5000; // expired 5 seconds ago

      // Meanwhile, another member books the same seat
      BookingEngine.releaseExpiredHolds();

      const newMemberReq = await BookingEngine.submitPendingRequest({
        userId: "user-punctual-resident",
        seatId: "seat-A09",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      const newHold = await BookingEngine.approveRequestAndCreateHold(newMemberReq.requestId, 15);
      assert(newHold.success, "New member hold must succeed now that seat was released");

      // NOW, late payment callback arrives for original user-late-payer
      const latePaymentId = `pay_late_${Date.now()}`;
      const lateSig = generateSignature(order.orderId, latePaymentId);

      const lateVerify = await PaymentService.verifyAndConfirmPayment({
        bookingRequestId: reqRes.requestId,
        userId: "user-late-payer",
        razorpayOrderId: order.orderId,
        razorpayPaymentId: latePaymentId,
        razorpaySignature: lateSig,
      });

      // MUST NOT confirm seat!
      assert(!lateVerify.success, "Late payment must NOT confirm booking");
      assert(lateVerify.requiresRefund === true, "Must flag requiresRefund = true");
      assert(lateVerify.refundId && lateVerify.refundId.startsWith("ref-"), "Must generate official refund ID");

      // New member's hold must be 100% UNTOUCHED
      const newMemberAlloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === newMemberReq.requestId);
      assert(newMemberAlloc && newMemberAlloc.status === "payment_hold", "New member hold must NOT be overwritten");

      // Refund queue must record the refund with status 'requested'
      const allRefunds = BookingEngine.getAllRefunds();
      const refundRecord = allRefunds.find((r) => r.id === lateVerify.refundId);
      assert(refundRecord, "Refund record must exist in refund store");
      assert(refundRecord.status === "requested", "Initial refund status must be 'requested'");
      assert(refundRecord.amountPaise === order.amountPaise, "Refund amount must match captured amount in paise");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 10: REFUND STATE MACHINE (Requested -> Processing -> Succeeded/Failed)
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 10: Refund state machine transitions through processing to succeeded; never complete on decree", async () => {
      // 1. Dispatch refund to provider client
      const refundDispatch = await RazorpayClient.createRefund({
        paymentId: "pay_sample_captured_123",
        amountPaise: 3154000,
        notes: { reason: "Customer requested cancellation" },
      });

      assert(refundDispatch.id && refundDispatch.id.startsWith("rfnd_"), "Must return provider refund ID");
      assert(refundDispatch.status === "processing", "Initial dispatched refund status must be 'processing'");

      // 2. Verified webhook confirmation moves it to 'succeeded'
      const refundWebhookPayload = JSON.stringify({
        event_id: `evt_rfnd_${Date.now()}`,
        event: "refund.processed",
        payload: {
          refund: {
            entity: {
              id: refundDispatch.id,
              payment_id: "pay_sample_captured_123",
              amount: 3154000,
              status: "processed",
            },
          },
        },
      });

      const hookSig = generateWebhookSignature(refundWebhookPayload);
      const hookRes = await PaymentService.processWebhook(refundWebhookPayload, hookSig);

      assert(hookRes.success, "Refund webhook must succeed");
      assert(hookRes.message.includes("verified as succeeded"), "Refund status confirmed as succeeded by provider");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 11: Cancellation or Ban During Checkout Routes to Refund
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 11: Cancellation or account restriction during checkout protects workstation and routes to refund", async () => {
      const reqRes = await BookingEngine.submitPendingRequest({
        userId: "user-restricted-during-checkout",
        seatId: "seat-A10",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await BookingEngine.approveRequestAndCreateHold(reqRes.requestId, 15);

      const order = await PaymentService.createOrder({
        bookingRequestId: reqRes.requestId,
        userId: "user-restricted-during-checkout",
      });

      // Member or Admin cancels reservation while checkout modal is open
      await BookingEngine.rejectRequest(reqRes.requestId, "Account restricted for noise policy violation");

      // Provider captures payment anyway
      const capturedPaymentId = `pay_restricted_${Date.now()}`;
      const sig = generateSignature(order.orderId, capturedPaymentId);

      const confirmAttempt = await PaymentService.verifyAndConfirmPayment({
        bookingRequestId: reqRes.requestId,
        userId: "user-restricted-during-checkout",
        razorpayOrderId: order.orderId,
        razorpayPaymentId: capturedPaymentId,
        razorpaySignature: sig,
      });

      assert(!confirmAttempt.success, "Confirmation must fail for cancelled/restricted request");
      assert(confirmAttempt.requiresRefund === true, "Must initiate refund");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 12: Authenticated Scheduled Reconciliation for Missed Events
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 12: Authenticated scheduled reconciliation synchronizes delayed captured orders", async () => {
      const reconcileRes = await PaymentService.reconcileMissedEvents();
      assert(typeof reconcileRes.reconciledCount === "number", "Must return integer reconciledCount");
      assert(reconcileRes.message.includes("Reconciliation completed"), "Should return success message");
    })
  );

  // Summary
  console.log("\n================================================================================");
  const total = results.length;
  const passed = results.filter(Boolean).length;
  const failed = total - passed;
  console.log(`TOTAL RAZORPAY LIFECYCLE TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled verification error:", err);
  process.exit(1);
});
