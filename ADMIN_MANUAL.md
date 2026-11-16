# Elite Study Zone — Administrator Portal Complete Manual & Guide

This document is the official administrator operations manual for **Elite Study Zone (Ghatkopar West)**. It covers login credentials, credential management, payment configuration, daily desk admissions, cash handling, and ZKTeco LX50 biometric door management.

---

## 1. Admin Portal Login Details

| Property | Details |
| :--- | :--- |
| **Login URL** | `/admin/login` (Accessible via the "Admin Portal →" link on the student login page) |
| **Default Admin Email** | `admin@elitestudyzone.in` *(or `mandarmestry636@gmail.com`)* |
| **Default Admin Password** | `Elight_study_` |
| **Session Security** | Protected with HTTP-only 24-hour administrative session cookies (`esz_admin_session`) |
| **Direct Admin Dashboard** | `/admin` |

---

## 2. How the Admin Can Change Their Email & Password

An administrator can change their email address and login password at any time without developer assistance:

1. Log in to the Admin Portal at `/admin/login`.
2. In the top navigation bar, click on the **Admin & Payment Settings** tab.
3. Locate the **Administrative Credentials** card:
   - **Change Admin Email**: Enter the new email address (e.g. `director@elitestudyzone.in`).
   - **Current Password**: Enter your existing password (initially `Elight_study_`).
   - **New Password**: Type the new secure password.
   - **Confirm Password**: Re-type the new secure password.
4. Click the green **Save Changes** button at the bottom.
5. The password is cryptographically hashed using **Bcrypt** and saved into MongoDB Atlas (`AdminSettings` collection).
6. Future logins will immediately require the updated email and password.

---

## 3. How the Admin Can Change Payment Receiving Accounts

All payments across the website (workstation bookings, day passes, and hourly passes) route to the administrator's configured accounts:

In the **Admin & Payment Settings** tab, the following fields can be updated:

### A. Center Receiving UPI ID
- **Field**: `Center Receiving UPI ID`
- **Default**: `elitestudyzone@okhdfcbank`
- **What it does**: This exact UPI ID is dynamically injected into PhonePe, Google Pay, and Paytm deep-links and encoded into the live QR code on student checkout modals.

### B. Custom UPI QR Code
- **Field**: `Custom UPI QR Code Image URL`
- **What it does**: If you have a physical Google Pay / PhonePe merchant QR standee, upload the image to Imgur, Cloudinary, or your hosting server and paste the URL here. The checkout modal will display your official shop QR code to students.

### C. Bank Account Details (IMPS / NEFT)
- **Account Holder Name**: e.g., `Elite Study Zone LLP`
- **Account Number**: e.g., `50200084920192`
- **Bank IFSC Code**: e.g., `HDFC0000123`
- **What it does**: Displayed to students who request offline bank transfers or receipts for company sponsorships.

### D. Razorpay Gateway API Keys (Cards, Net Banking & Wallets)
- **Razorpay Key ID**: e.g., `rzp_live_...` (or `rzp_test_...`)
- **Razorpay Key Secret**: Your secret key from Razorpay Dashboard
- **What it does**: Enables the official Razorpay Standard Gateway modal for students wishing to pay via Credit/Debit Cards (RuPay, Visa, Mastercard) and Net Banking across 50+ Indian banks.

---

## 4. What Else the Admin Can Change & Manage

The Admin Dashboard provides 10 dedicated management queues and 6 quick-action curatorial tools:

### Top Quick-Action Tools

1. **Walk-in Admission**:
   - For students who visit the center in person without booking online.
   - Enter guest name, choose any available desk, select start and end dates.
   - Instantly generates an active **ZKTeco Biometric Door Gate PIN** and reserves the desk.

2. **Record Cash Collection**:
   - For fees collected in physical cash at the front desk.
   - Enter booking request ID, receipt reference number (e.g. `CASH-2026-081`), and cash amount (in paise or rupees).
   - Confirms the workstation atomically and issues the biometric pass.

3. **Edit Plans & Pricing**:
   - Modify the monthly or daily tenure prices (e.g. change ₹2,499/mo to ₹2,799/mo).
   - Change plan names and descriptions.
   - **Protection Invariant**: Past bookings retain their historical price snapshots; only new bookings use the updated price.

4. **Maintenance Blocking**:
   - Mark specific desks (e.g. `seat-A02`) under maintenance for timber conditioning, acoustic adjustments, or electrical repairs.
   - Prevents students from booking that desk during the specified maintenance window.

5. **Ban / Suspend Disruptive Members**:
   - For repeated noise threshold violations or policy non-compliance.
   - Choose temporary suspension (e.g. 14 days) or permanent ban.
   - Choose whether to initiate an automated prorated refund or forfeit fees per conduct policy.

6. **MFA Security (AAL2)**:
   - Configure Authenticator App (Google Authenticator / Authy) multi-factor authentication for extra admin login security.

---

### The 10 Administrative Queues

| Queue | Description & Administrative Powers |
| :--- | :--- |
| **1. Pending Intake Requests** | View incoming student workstation applications. Click **Approve Hold** to grant a 15-minute exclusive reservation, or **Reject Request** to release the seat. |
| **2. Expiring Payment Holds** | Monitor live 15-minute hold countdowns. Seats automatically return to public availability if payment is not completed before expiration. |
| **3. Seat & Attendance Ledger** | Real-time map of all desks (North Skylight Gallery, Silent Atelier, Resident Piers), showing occupied desks, vacant desks, and student occupancy dates. |
| **4. ZKTeco LX50 Biometrics** | Direct biometric gate integration. View registered users, live punch timestamps, matched scores (e.g. 99.4%), terminal ID, and active door unlock PINs. |
| **5. Upcoming Expirations** | 7-day lookahead tracking members whose tenures are concluding, allowing staff to offer renewal extensions or prepare desk onboarding. |
| **6. Payment Exceptions** | Audit cash receipts, mismatched payment signatures, and automated refund routing for late payments post-hold expiration. |
| **7. Inbound Enquiries** | Read visitor inquiries submitted from the `/contact` page. Type a response and click **Dispatch Reply** to email the student directly. |
| **8. Review Moderation** | Inspect student reviews and star ratings. Click **Approve** to publish publicly or **Hide** to moderate inappropriate content. |
| **9. Audit Ledger** | Immutable cryptographic audit log tracking all staff actions, plan modifications, cash collections, and security decisions with timestamps and staff IDs. |
| **10. Admin & Payment Settings** | Modify admin email, admin password, center phone number, receiving UPI ID, bank account, custom QR code, and Razorpay API credentials. |

---

## 5. ZKTeco LX50 Biometric Machine Integration

The center's **ZKTeco LX50** fingerprint and keypad terminal connects directly to the platform:

1. **Numeric Door PINs**:
   - Every confirmed student (via Google Sign-In, Normal Login, or Cash) receives a **6-digit numeric pass code** (e.g. `#839210`).
   - Entering this code on the ZKTeco keypad unlocks the door latch.
2. **Fingerprint Registration**:
   - Staff can enroll a member's fingerprint on the physical ZKTeco machine and map their `User ID` to the student's email.
3. **Punch Logs & Attendance**:
   - Punch records are synced via USB / TCP-IP network to `/api/biometric`.
   - The admin can view live check-ins and check-outs in the **ZKTeco LX50 Biometrics** tab.
