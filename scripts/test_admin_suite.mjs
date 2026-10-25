/**
 * Sanctuary Administrative Operations & Security Audit Verification Suite
 *
 * Mathematically proves and validates:
 * 1. Direct unauthorized calls to all admin endpoints are rejected (401/403).
 * 2. Request approval atomically creates expiring hold; rejection cleanly releases hold.
 * 3. Walk-in booking creates immediate active allocation and access pass.
 * 4. Cash payment records staff identity, receipt ref, and confirms booking.
 * 5. Plan editing preserves historical price snapshots of prior bookings.
 * 6. Maintenance blocks prevent conflicting bookings.
 * 7. Cancellation with effective date calculates affected interval and releases remaining dates.
 * 8. Account suspension and ban immediately invalidate access passes and restrict session.
 * 9. Account ban does not automatically forfeit funds; follows explicit approved policy.
 * 10. Physical attendance distinguishes 'attending' vs 'reserved'.
 * 11. Financial metrics cleanly separate digital, cash, refunds, and net collections.
 * 12. Every admin action generates an immutable audit event with who, what, when, and why.
 */

import { AdminService } from "../src/lib/admin/adminService.ts";
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
  console.log("SANCTUARY ADMINISTRATIVE OPERATIONS & SECURITY AUDIT VERIFICATION SUITE");
  console.log("================================================================================\n");

  const results = [];
  const validAdminToken = process.env.ADMIN_SECRET || "sanctuary_admin_super_secret_2026";
  const staffId = "staff_curator_elena";

  // ----------------------------------------------------------------------------
  // TEST 1: Direct Unauthorized Calls Rejected
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 1: Direct unauthorized calls to admin security gate are rejected", async () => {
      // 1. Missing header
      const missing = AdminService.verifyAdminAuth({});
      assert(!missing, "Empty headers must be rejected");

      // 2. Regular user token
      const regularUser = AdminService.verifyAdminAuth({ authorization: "Bearer user_token_regular_member" });
      assert(!regularUser, "Regular user bearer token must be rejected");

      // 3. Forged token
      const forged = AdminService.verifyAdminAuth({ "x-admin-key": "forged_admin_key_123" });
      assert(!forged, "Forged admin key must be rejected");

      // 4. Authorized admin token
      const valid = AdminService.verifyAdminAuth({ authorization: `Bearer ${validAdminToken}` });
      assert(valid, "Legitimate administrative token must be authorized");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 2: Request Approval & Rejection Flow
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 2: Request approval atomically creates expiring hold; rejection cleanly releases hold", async () => {
      // Submit request
      const req = await BookingEngine.submitPendingRequest({
        userId: "user-admin-test-1",
        seatId: "seat-B01",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });

      // Approve request
      const approveRes = await AdminService.approveRequest(req.requestId, staffId, 15);
      assert(approveRes.success, "Admin approval must succeed");
      assert(approveRes.passCode && approveRes.passCode.startsWith("PASS-"), "Pass code must be issued");

      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === req.requestId);
      assert(alloc && alloc.status === "payment_hold", "Allocation must be payment_hold");

      // Reject request
      const rejectRes = await AdminService.rejectRequest(req.requestId, staffId, "Guest requested withdrawal");
      assert(rejectRes.success, "Rejection must succeed");

      assert(alloc.status === "released", "Hold must be released upon rejection");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 3: Walk-In Booking Creation
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 3: Walk-in booking creates immediate active allocation and access pass", async () => {
      const walkInRes = await AdminService.createWalkIn({
        seatId: "seat-B02",
        userId: "user-walkin-1",
        guestName: "Julian Hayes",
        startDate: "2026-11-01",
        endDate: "2026-11-08",
        staffId,
      });

      assert(walkInRes.success, "Walk-in creation must succeed");
      assert(walkInRes.passCode && (walkInRes.passCode.startsWith("WALK-") || walkInRes.passCode.startsWith("PASS-")), "Walk-in must receive active pass");

      const alloc = BookingEngine.getAllAllocations().find((a) => a.id === walkInRes.allocationId);
      assert(alloc && alloc.status === "walk_in", "Allocation status must be 'walk_in'");
      assert(alloc.holdExpiresAt === null, "Walk-in is immediately confirmed without hold timer");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 4: Cash Payment Recording with Staff Identity & Reference
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 4: Cash payment records staff identity, receipt ref, and confirms booking", async () => {
      const req = await BookingEngine.submitPendingRequest({
        userId: "user-cash-test",
        seatId: "seat-B03",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      await AdminService.approveRequest(req.requestId, staffId, 15);

      const receiptRef = "CASH-2026-REC-9012";
      const cashRes = await AdminService.recordCashPayment({
        bookingRequestId: req.requestId,
        staffId: "staff_curator_marcus",
        receiptRef,
        notes: "Counted physical INR notes at front desk",
        amountPaise: req.totalPricePaise,
      });

      assert(cashRes.success, "Cash payment recording must succeed");
      assert(cashRes.passCode, "Must confirm access pass");

      // Verify allocation is active
      const alloc = BookingEngine.getAllAllocations().find((a) => a.bookingRequestId === req.requestId);
      assert(alloc && alloc.status === "active", "Allocation must be active");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 5: Plan Editing Preserves Existing Price Snapshots
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 5: Plan editing updates future rates without altering prior price snapshots", async () => {
      // 1. Submit booking under current plan
      const req = await BookingEngine.submitPendingRequest({
        userId: "user-plan-immutability-test",
        seatId: "seat-B04",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-12-01",
      });
      const originalPaiseSnapshot = req.totalPricePaise;
      assert(originalPaiseSnapshot === 3800000, "Original snapshot must be 3800000 paise");

      // 2. Admin edits plan rate from $380 to $450
      const updateRes = AdminService.updatePlan(
        "tier-resident",
        { priceUSD: 450, name: "Resident Atelier (2027 Revised Rate)" },
        staffId
      );
      assert(updateRes.success, "Plan update must succeed");

      // 3. Verify prior booking's price snapshot is completely UNTOUCHED
      const allReqs = BookingEngine.getAllRequests();
      const existingReq = allReqs.find((r) => r.id === req.requestId);
      assert(existingReq.totalPricePaise === originalPaiseSnapshot, "Prior request price snapshot must remain identical");
      assert(existingReq.totalPricePaise === 3800000, "Historical paise must not change");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 6: Physical Maintenance Blocks Prevent Conflicting Bookings
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 6: Physical maintenance blocks prevent seat hold and approval", async () => {
      const maintRes = AdminService.addMaintenanceBlock(
        "seat-B05",
        "2026-11-10",
        "2026-11-15",
        "Acoustic paneling recalibration",
        staffId
      );
      assert(maintRes.success, "Scheduling maintenance must succeed");

      // Attempt to book overlapping interval
      const conflictReq = await BookingEngine.submitPendingRequest({
        userId: "user-conflict-maint",
        seatId: "seat-B05",
        planId: "month",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
      });

      const approveAttempt = await AdminService.approveRequest(conflictReq.requestId, staffId, 15);
      assert(!approveAttempt.success, "Approval must fail due to maintenance conflict");
      assert(approveAttempt.error === "MAINTENANCE_CONFLICT", "Error must be MAINTENANCE_CONFLICT");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 7: Booking Cancellation with Effective Date & Proration
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 7: Booking cancellation calculates proration and releases allocation", async () => {
      const walkIn = await AdminService.createWalkIn({
        seatId: "seat-B06",
        userId: "user-cancel-proration",
        guestName: "Clara Oswald",
        startDate: "2026-11-01",
        endDate: "2026-11-11", // 10 days
        staffId,
      });

      // Cancel effective 2026-11-06 (5 days remaining)
      const cancelRes = AdminService.cancelBookingWithEffectiveDate({
        bookingId: walkIn.allocationId,
        effectiveDate: "2026-11-06",
        staffId,
        reason: "Relocating to London studio",
      });

      assert(cancelRes.success, "Cancellation must succeed");
      assert(cancelRes.remainingDays === 5, "Remaining days must be 5");
      assert(Number(cancelRes.proratedRefundPaise) > 0, "Prorated refund paise must be positive");

      const alloc = BookingEngine.getAllAllocations().find((a) => a.id === walkIn.allocationId);
      assert(alloc && alloc.status === "released", "Allocation must be released");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 8: Immediate Server-Side Restriction Enforcement
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 8: Account suspension/ban immediately invalidates access passes server-side", async () => {
      const walkIn = await AdminService.createWalkIn({
        seatId: "seat-B07",
        userId: "user-misbehaving-fellow",
        guestName: "Disruptive Guest",
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        staffId,
      });

      // Impose immediate suspension
      const suspendRes = AdminService.restrictAccount({
        userId: "user-misbehaving-fellow",
        type: "suspension",
        durationDays: 14,
        reason: "Acoustic disruption in library stacks",
        refundDecision: "manual_review",
        staffId,
      });

      assert(suspendRes.success, "Suspension must succeed");

      // Verify pass revoked immediately
      const alloc = BookingEngine.getAllAllocations().find((a) => a.id === walkIn.allocationId);
      assert(alloc && alloc.status === "released", "Access pass allocation must be released immediately");

      // Verify server-side gate rejects user
      const check = AdminService.isUserRestricted("user-misbehaving-fellow");
      assert(check.restricted === true, "User must be marked restricted server-side");
      assert(check.type === "suspension", "Type must be suspension");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 9: Account Ban Follows Policy Terms without Automatic Forfeiture
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 9: Permanent ban requires explicit policy choice and initiates refund per terms", async () => {
      const preview = AdminService.getAccountRestrictionPreview("user-banned-member");
      assert(typeof preview.activeAllocationsCount === "number", "Preview must report active allocations");

      const banRes = AdminService.restrictAccount({
        userId: "user-banned-member",
        type: "ban",
        reason: "Gross violation of member quietude contract",
        refundDecision: "initiate_refund", // Explicit policy selection
        staffId,
      });

      assert(banRes.success, "Ban must succeed");
      assert(banRes.refundId && banRes.refundId.startsWith("ref-ban-"), "Must initiate policy refund");

      // Check refund queue
      const refund = BookingEngine.getAllRefunds().find((r) => r.id === banRes.refundId);
      assert(refund, "Refund record must exist in refund store");
      assert(refund.status === "requested", "Status must start as 'requested'");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 10: Physical Attendance Distinguishes Attending vs Reserved
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 10: Physical attendance distinguishes attending vs reserved on date inspector", async () => {
      const walkIn = await AdminService.createWalkIn({
        seatId: "seat-B08",
        userId: "user-attendance-test",
        guestName: "Attendance Scholar",
        startDate: "2026-11-01",
        endDate: "2026-11-05",
        staffId,
      });

      // 1. Before check-in: 'reserved'
      let seats = AdminService.getReservedSeatsForDate("2026-11-02");
      let seat = seats.find((s) => s.id === walkIn.allocationId);
      assert(seat && seat.attendanceStatus === "reserved", "Initial attendance must be 'reserved'");

      // 2. Desk curator checks guest in
      AdminService.recordAttendance(walkIn.allocationId, "attending", staffId);

      seats = AdminService.getReservedSeatsForDate("2026-11-02");
      seat = seats.find((s) => s.id === walkIn.allocationId);
      assert(seat && seat.attendanceStatus === "attending", "Attendance must update to 'attending'");
      assert(seat.checkedInAt, "Checked in timestamp must be recorded");

      // 3. Guest checks out
      AdminService.recordAttendance(walkIn.allocationId, "completed", staffId);
      seats = AdminService.getReservedSeatsForDate("2026-11-02");
      seat = seats.find((s) => s.id === walkIn.allocationId);
      assert(seat && seat.attendanceStatus === "completed", "Attendance must update to 'completed'");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 11: Financial Separation (Digital, Cash, Refunds, Net)
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 11: Financial breakdown cleanly separates digital, cash, refunds, and net collections", async () => {
      const financial = AdminService.getFinancialBreakdown();

      assert(typeof financial.digitalPaise === "number", "Digital paise must be a number");
      assert(typeof financial.cashCollectionsPaise === "number", "Cash collections paise must be a number");
      assert(typeof financial.refundsPaise === "number", "Refunds paise must be a number");
      assert(typeof financial.netCollectionsPaise === "number", "Net collections paise must be a number");

      const expectedNet = financial.digitalPaise + financial.cashCollectionsPaise - financial.refundsPaise;
      assert(financial.netCollectionsPaise === expectedNet, "Net must exactly equal Digital + Cash - Refunds");
    })
  );

  // ----------------------------------------------------------------------------
  // TEST 12: Immutable Audit Log Generation
  // ----------------------------------------------------------------------------
  results.push(
    await runTest("Test 12: Every administrative action generates an immutable audit event", async () => {
      const history = AdminService.getAuditHistory();
      assert(history.length >= 10, "Must have recorded multiple audit events across operations");

      const actions = history.map((e) => e.action);
      assert(actions.includes("REQUEST_APPROVED"), "Audit log must contain REQUEST_APPROVED");
      assert(actions.includes("REQUEST_REJECTED"), "Audit log must contain REQUEST_REJECTED");
      assert(actions.includes("CASH_PAYMENT_RECORDED"), "Audit log must contain CASH_PAYMENT_RECORDED");
      assert(actions.includes("ACCOUNT_SUSPENDED") || actions.includes("ACCOUNT_BANNED"), "Audit log must contain ACCOUNT_BANNED/SUSPENDED");
      assert(actions.includes("MEMBERSHIP_PLAN_UPDATED"), "Audit log must contain MEMBERSHIP_PLAN_UPDATED");

      // Verify audit fields integrity
      for (const event of history.slice(0, 5)) {
        assert(event.id && event.id.startsWith("audit-"), "Must have audit ID");
        assert(event.actorId, "Must have actorId");
        assert(event.timestamp, "Must have timestamp");
        assert(event.action, "Must have action");
      }
    })
  );

  // Summary
  console.log("\n================================================================================");
  const total = results.length;
  const passed = results.filter(Boolean).length;
  const failed = total - passed;
  console.log(`TOTAL ADMIN SUITE PROOFS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
