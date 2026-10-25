# Sanctuary — Study Place Residency Platform

> An academic-grade study hall booking, seat allocation, and focus residency platform built with Next.js 15, TypeScript, Supabase RLS, and Razorpay.

[![Production Build](https://img.shields.io/badge/Build-Passing%20(33%2F33%20routes)-emerald.svg)](BUILD_STATUS.md)
[![Verification Suite](https://img.shields.io/badge/Verification-43%2F43%20Passed-blue.svg)](BUILD_STATUS.md)
[![Performance LCP](https://img.shields.io/badge/Mobile%20LCP-517ms-success.svg)](BUILD_STATUS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Zero--Errors-blue.svg)](tsconfig.json)

---

## 🏛️ Overview

**Sanctuary** provides quiet, dedicated workspaces for serious students, researchers, and fellows. It solves the real-world operational challenges of managing a shared academic study facility:
- Prevents double-booking via atomic reservation locks and interval overlap validation.
- Coordinates desk assignments across silent, collaborative, and private zones.
- Enforces strict role-based access control (RLS) with zero data leakage.
- Handles automated payment reconciliation, webhook signature verification, and tax receipt generation.
- Delivers a student portal for pass renewals, cancellations, and house rule agreements.

---

## 🌟 Key Functionality

### 1. Interactive Desk & Room Allocation
- **Zone Filtering**: Silent Room, Focus Pods, Collaborative Hall, and Night Shift Desks.
- **Atomic Hold Engine**: 15-minute hold guarantees during checkout; automatically sweeps expired holds via scheduled cron jobs without stale locks.
- **Maintenance & Walk-in Guard**: Prevents bookings during scheduled maintenance or curator walk-in holds.

### 2. Member & Student Portal
- **Pass Status**: Real-time view of current memberships, seat number, tier, and renewal eligibility.
- **Action Triggers**: One-click actions for awaiting approval, completing payments, requesting renewals, or filing cancellation requests.
- **Tax Receipts**: GST-compliant editorial tax receipts with full breakdown and downloadable print format.
- **House Rules & Conduct**: Integrated student conduct pledge with verified timestamp logging.

### 3. Superadmin Operations Ledger
- **Master Floor Plan Control**: Real-time desk availability status, override holds, and walk-in assignments.
- **Financial Audit Ledger**: Complete transaction history with Razorpay payment IDs, order reconciliation, and refund triggers.
- **Member Governance**: Granular role-based controls, membership tier adjustments, suspension workflows, and MFA-guarded operations.

### 4. Financial & Payment Architecture
- **Razorpay Integration**: Native checkout modal flow with server-side HMAC-SHA256 signature verification.
- **Webhook Reconciliation**: Handles `order.paid`, `payment.captured`, and `payment.failed` with idempotency keys.
- **Reconciliation Engine**: Scans active orders and reconciles out-of-order or delayed payments.

### 5. Production Reliability & Performance
- **Mobile LCP**: 517ms (target <2.5s).
- **Cumulative Layout Shift (CLS)**: 0.000.
- **Interaction to Next Paint (INP)**: 3ms.
- **Zero Secrets in Client Bundles**: Provider SDKs strictly isolated to server route handlers.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Motion** | [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Triggers) |
| **Payments** | [Razorpay](https://razorpay.com/) (Orders API, Webhooks, HMAC Verification) |
| **Deployment** | [Vercel Pro](https://vercel.com/) (Edge Security Headers, Dynamic Sitemap/Robots, Cron Jobs) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- A Supabase project with PostgreSQL
- A Razorpay account (Test mode for development)

### 2. Installation
```bash
git clone https://github.com/MJ636UoW/Study_place.git
cd Study_place
npm install
```

### 3. Environment Configuration
Copy the environment template:
```bash
cp .env.example .env.local
```
Configure your keys according to [`docs/deployment/ENV_CHECKLIST.md`](docs/deployment/ENV_CHECKLIST.md):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `CRON_SECRET`

### 4. Database Setup
Apply migrations in order from the `supabase/migrations/` directory:
```bash
# 000001: Core tables, enums, seats, and constraints
# 000002: Row Level Security (RLS) policies
# 000003: Booking hold engine & trigger functions
# 000004: Payment logs, receipts, and order tracking
# 000005: Notifications queue & retry records
# 000006: First superadmin bootstrap procedure
```

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

Sanctuary includes automated test scripts verifying end-to-end functionality:

```bash
# Run the complete pre-launch verification suite (43 checks)
node scripts/run_prelaunch_verification.mjs

# Verify booking engine concurrency and interval overlaps
node scripts/test_booking_engine.mjs

# Verify Razorpay checkout, signatures, and webhook reconciliation
node scripts/test_razorpay_flow.mjs

# Verify student dashboard data isolation and action triggers
node scripts/test_student_dashboard_suite.mjs

# Audit Web Vitals, mobile viewport, and accessibility
node scripts/audit_performance_and_interaction.mjs
```

---

## 📚 Deployment & Operational Runbooks

Full production operational guides are available in the [`docs/`](docs/) directory:
- [**Deployment Guide**](docs/deployment/DEPLOYMENT_GUIDE.md): Vercel Pro configuration, staging pipeline, custom domains, and DNS records.
- [**Environment Checklist**](docs/deployment/ENV_CHECKLIST.md): Client vs server variable definitions and security rules.
- [**Runbook & Rollback**](docs/deployment/RUNBOOK_AND_ROLLBACK.md): Disaster recovery, payment outages, refund execution, and rolling back releases.
- [**Build & Audit Status**](BUILD_STATUS.md): Current build status, test matrix, and performance metrics.

---

## 🔒 Security

- Zero test or demo credentials in migrations.
- Strict Supabase RLS policies isolating student records.
- All Razorpay webhooks signed and verified using HMAC-SHA256 timing-safe comparison.
- Rate limits and honeypots on contact forms and review submissions.
- Superadmin accounts require Multi-Factor Authentication (AAL2).

---

## 📄 License

Proprietary and Confidential. Unauthorized copying, distribution, or deployment of this software is strictly prohibited.
