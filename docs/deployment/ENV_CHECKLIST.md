# Sanctuary Residences — Production Environment Variable Checklist

This checklist documents every required environment variable for Vercel, Supabase, Razorpay, and Email dispatch.  
**STRICT SECURITY RULE**: Never store raw secret values in this document or commit `.env*.local` files to Git.

---

## 1. Client-Side Variables (Browser Accessible)

These variables are prefixed with `NEXT_PUBLIC_` and are bundled into client-side code. They must never contain service keys, database passwords, or private API secrets.

| Variable Name | Scope | Staging Value Format | Production Value Format | Description & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public | `https://staging.yourdomain.com` | `https://yourdomain.com` | Canonical base URL used for auth callbacks, OpenGraph metadata, sitemaps, and receipts. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | `https://[staging-ref].supabase.co` | `https://[prod-ref].supabase.co` | HTTPS endpoint for Supabase client SDK and real-time subscriptions. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Standard Anon JWT | Standard Anon JWT | Public anonymous client key. Access is strictly gated by PostgreSQL Row Level Security (RLS) policies. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | `rzp_test_[alphanumeric]` | `rzp_live_[alphanumeric]` | Razorpay key identifier used by the client-side Razorpay standard checkout modal. |
| `NEXT_PUBLIC_BUSINESS_TIMEZONE` | Public | `Asia/Kolkata` | `Asia/Kolkata` | Standard operating timezone for all business day calculations and membership terms. |

---

## 2. Server-Only Variables (Protected Backend Execution)

These variables must **NEVER** have a `NEXT_PUBLIC_` prefix. They are accessible exclusively in Next.js Server Components, API Route Handlers, and Edge Middleware.

| Variable Name | Scope | Staging Value Format | Production Value Format | Description & Security Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Elevated Service Role JWT | Elevated Service Role JWT | Grants administrative access to bypass RLS for server-side maintenance jobs and audit logging. **Strictly server-side**. |
| `RAZORPAY_KEY_ID` | Server | `rzp_test_[alphanumeric]` | `rzp_live_[alphanumeric]` | Provider key identifier used for server-to-server order generation and status verification. |
| `RAZORPAY_KEY_SECRET` | Server | Secret String | Secret String | Used to sign and cryptographically verify payment signatures via HMAC SHA-256. |
| `RAZORPAY_WEBHOOK_SECRET` | Server | `whsec_test_[alphanumeric]` | `whsec_live_[alphanumeric]` | Cryptographic secret for verifying raw request body signatures on inbound Razorpay webhooks. |
| `CRON_SECRET` | Server | 64-char hex string | 64-char hex string | High-entropy bearer token sent by Vercel Cron when triggering background cleanup, notification, and reconciliation endpoints. |
| `RESEND_API_KEY` | Server | `re_test_[alphanumeric]` | `re_live_[alphanumeric]` | API key for transactional email dispatch to student and fellow inboxes. |
| `EMAIL_FROM_ADDRESS` | Server | `admissions@staging.yourdomain.com` | `concierge@yourdomain.com` | Verified sender email address adhering to published SPF/DKIM/DMARC policies. |

---

## 3. Environment Separation Checklist

Before deploying:

- [ ] Distinct Supabase project URLs for Staging and Production.
- [ ] Staging Razorpay key starts with `rzp_test_`; Production starts with `rzp_live_`.
- [ ] Webhook URL registered in Razorpay Dashboard matches the exact environment domain.
- [ ] Vercel Environment Variables configured with correct environment target scopes (**Production**, **Preview**, **Development**).
- [ ] `CRON_SECRET` generated and bound in Vercel project settings.
- [ ] `.env.local` added to `.gitignore` and confirmed absent from repository git status.
