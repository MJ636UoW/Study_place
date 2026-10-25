# Sanctuary Residences — Operations, Monitoring & Rollback Runbook

Operational procedures for production maintenance, incident response, database point-in-time recovery (PITR), and instant deployment rollback.

---

## 1. Instant Deployment Rollback (Vercel)

If an unexpected runtime regression, UI defect, or severe bug occurs after deploying to production:

### Method A: Vercel Dashboard (Instant)
1. Go to **Vercel Dashboard ➔ Project ➔ Deployments**.
2. Locate the previous healthy deployment that was marked verified.
3. Click the three dots (`...`) ➔ **Instant Rollback**.
4. Confirm rollback.
*Traffic redirects to the prior build within seconds without rebuilding or redeploying code.*

### Method B: Vercel CLI
```bash
vercel rollback [deployment-url-or-id]
```

---

## 2. Database Backup & Point-in-Time Recovery (PITR)

### Automated Daily Snapshots
- Supabase automatically creates daily snapshots of the database on Pro projects, retained for 7 to 30 days depending on tier.

### Enabling Point-in-Time Recovery (PITR)
For continuous write-ahead log (WAL) archiving allowing restoration to any exact second:
1. In Supabase Dashboard, navigate to **Project Settings ➔ Database ➔ Backups**.
2. Enable **Point in Time Recovery (PITR)**.
3. In case of accidental data corruption:
   - Select **Restore Database** ➔ Choose PITR.
   - Enter the timestamp (UTC or Asia/Kolkata) immediately preceding the incident.
   - Restore initiates onto an isolated clone or overwrites with point-in-time state.

### Manual Structural Export (Before Schema Updates)
```bash
# Export schema only
supabase db dump --schema-only -f pre_migration_backup.sql

# Export complete table data
supabase db dump --data-only -f table_data_backup.sql
```

---

## 3. Incident Response: Payment Provider Outages

If Razorpay experiences a gateway outage, high latency, or bank clearing delays:

### Invariant Protection Already Built-In
- **Automatic Hold Preservation**: If order generation fails, [`PaymentService.createOrder`](../../src/lib/payments/paymentService.ts) returns HTTP 503 (`PROVIDER_OUTAGE`) with a user notice. The student's 15-minute seat hold **is not released or cancelled**.
- **Late Payment Defense**: If an order captures late after a hold has expired, the webhook engine intercepts it and atomically routes the funds to `refunds` table with `status = 'requested'`. It **never steals another member's seat**.

### Manual Curator Reconciliation
1. Open [`/admin`](https://yourdomain.com/admin) and select **Exception Queue**.
2. Identify late payments or failed webhooks.
3. Select **Dispatch Refund** to initiate gateway return, or **Re-assign Workstation** if an alternative desk is open and mutually agreed upon with the fellow.
4. Trigger scheduled reconciliation on demand:
   ```bash
   curl -X POST https://yourdomain.com/api/payments/reconcile \
     -H "Authorization: Bearer <CRON_SECRET>"
   ```

---

## 4. Usage Monitoring & Billing Threshold Alerts

Configure proactive billing alerts across provider dashboards to prevent surprise overages:

### 1. Vercel Billing Alerts
- Under **Team Settings ➔ Billing**, enable **Spend Alerts**.
- Threshold 1: 50% of budget ($20).
- Threshold 2: 90% of budget ($36).
- Threshold 3: 100% of budget ($40).

### 2. Supabase Compute & Storage Alerts
- Under **Organization ➔ Billing**, configure alerts for Database Size (e.g. 8GB), Egress Bandwidth (e.g. 50GB), and Monthly Active Users (MAU).

### 3. Razorpay Account Monitoring
- Configure low balance alerts for instant refund payouts.
- Subscribe to daily settlement summaries to verify captured amounts match bank deposits.

---

## 5. Owner & Staff Operational Training

### Core Workflows for Curators

| Task | Administrative Action | Expected System Behavior |
| :--- | :--- | :--- |
| **New Scholar Application** | Review in `/admin` under "Pending Inquiries". Click **Approve**. | Seat allocation is created with a strict 15-minute expiring payment hold (`hold_expires_at`). Student receives approval email with direct payment link. |
| **Walk-In Guest Intake** | Click **Walk-in Admission** on `/admin`. Select workstation and dates. | Bypasses payment gateway; confirms seat allocation immediately; issues official entrance pass code. |
| **Cash Payment Collection** | Select held booking in `/admin`. Click **Record Cash Payment**. Enter receipt number. | Transitions payment hold to active confirmed residency. Records staff identity in immutable audit log. |
| **Maintenance Shutdown** | Click **Add Maintenance Block**. Select desk and date range. | Blocks workstation from student booking plat and walk-ins. Prevents double-booking during physical repairs. |
| **Voluntary Cancellation** | Select member in `/admin`. Click **Cancel Residency**. Enter effective date. | Calculates prorated remaining days; updates seat allocation to released; logs cancellation audit event. |
| **Account Ban / Suspension** | Click **Restrict Member**. Select Suspension or Permanent Ban. Choose refund decision per terms. | Revokes keycard pass immediately. Invalidates active sessions server-side. |
