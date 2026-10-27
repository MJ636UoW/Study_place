export interface PlanTier {
  id: string;
  name: string;
  code: string;
  cadence: string;
  price: number;
  currency: string;
  tagline: string;
  highlighted?: boolean;
  features: string[];
  accessHours: string;
  guestPasses: number;
  lockerAccess: boolean;
}

export interface AmenityItem {
  id: string;
  title: string;
  category: "Environment" | "Ergonomics" | "Refreshment" | "Acoustics";
  description: string;
  verificationNote: string;
  iconName: string;
}

export interface GalleryPhoto {
  id: string;
  caption: string;
  area: string;
  aspectRatio: "landscape" | "portrait" | "square";
  imageUrl: string;
  architecturalNote: string;
}

export interface MemberReview {
  id: string;
  author: string;
  role: string;
  discipline: string;
  quote: string;
  membershipTenure: string;
  stayDate: string;
  rating?: number; // 1 to 5 numeric score
  bookingId?: string;
  userId?: string;
  publishedAt?: string;
}

export interface BookingRecord {
  id: string;
  bookingRef: string;
  memberName: string;
  memberEmail: string;
  tierId: string;
  tierName: string;
  seatId: string;
  seatLabel: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  status: "confirmed" | "pending_review" | "in_session" | "completed" | "cancelled";
  totalAmount: number;
  currency: string;
  specialRequests?: string;
  conciergeNotes?: string;
  arrivalWindow: string;
  amenityAddons: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Acoustics" | "Booking" | "Membership";
}

export interface AdminMetrics {
  activeSessions: number;
  reservedToday: number;
  occupancyRate: number;
  membershipWaitlist: number;
  monthlyRevenue: number;
  currency: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Membership Plans — Prices in INR for Mumbai, Kandivali
// ─────────────────────────────────────────────────────────────────────────────
export const plansFixture: PlanTier[] = [
  {
    id: "tier-day",
    name: "Day Pass",
    code: "PLN-01",
    cadence: "per day",
    price: 299,
    currency: "INR",
    tagline: "One full day of library-grade deep focus in a dedicated, silent workspace.",
    features: [
      "Dedicated ergonomic workstation for the full day",
      "High-speed wired & Wi-Fi internet access",
      "Unlimited chai, filter coffee & purified water",
      "Acoustic isolation — strict silence zone",
      "Phone booth access (up to 30 min/day)",
    ],
    accessHours: "07:30 — 22:00",
    guestPasses: 0,
    lockerAccess: false,
  },
  {
    id: "tier-resident",
    name: "Monthly Resident",
    code: "PLN-02",
    cadence: "per month",
    price: 2499,
    currency: "INR",
    tagline: "Your permanent desk, personal locker, and unrestricted 24/7 access — every single day.",
    highlighted: true,
    features: [
      "Permanent assigned desk in the Main Study Hall",
      "24/7 keycard access — weekdays, weekends & holidays",
      "Private steel locker with combination lock",
      "Meeting cabin credit (6 hours/month)",
      "Unlimited chai, filter coffee & infused water",
      "Postal receiving & courier handling service",
    ],
    accessHours: "24 Hours / 7 Days",
    guestPasses: 2,
    lockerAccess: true,
  },
  {
    id: "tier-patron",
    name: "Quarterly Fellow",
    code: "PLN-03",
    cadence: "per quarter",
    price: 5999,
    currency: "INR",
    tagline: "Three months of uninterrupted residency with priority cabin access and guest privileges.",
    features: [
      "Permanent desk across all study zones",
      "Unlimited meeting cabin & private room bookings",
      "Private storage locker & archival shelf",
      "Guest passes for collaborators (8 passes/quarter)",
      "Dedicated coordinator direct WhatsApp line",
      "Priority seat upgrades & community event access",
    ],
    accessHours: "24 Hours / 7 Days",
    guestPasses: 8,
    lockerAccess: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Amenities
// ─────────────────────────────────────────────────────────────────────────────
export const amenitiesFixture: AmenityItem[] = [
  {
    id: "amenity-1",
    title: "Library-Grade Acoustic Isolation",
    category: "Acoustics",
    description: "Acoustic foam panels and glass partitions maintain ambient noise under 38 dBA — quieter than most public libraries.",
    verificationNote: "Independently measured by SoundCheck India, Oct 2026",
    iconName: "VolumeX",
  },
  {
    id: "amenity-2",
    title: "Natural Light & Circadian Tuning",
    category: "Environment",
    description: "Large north-facing windows with blackout-capable blinds and warm 2700K task lighting to eliminate glare and digital eye strain.",
    verificationNote: "Interior lighting by LumaTech Mumbai; flicker index < 0.01",
    iconName: "Sun",
  },
  {
    id: "amenity-3",
    title: "Ergonomic Workstations",
    category: "Ergonomics",
    description: "Height-adjustable desks with premium ergonomic chairs, monitor arms, and anti-fatigue mats at every seat.",
    verificationNote: "Certified ergonomic setup by WorkWell India",
    iconName: "Compass",
  },
  {
    id: "amenity-4",
    title: "Dedicated Fiber Internet",
    category: "Environment",
    description: "Redundant 1 Gbps symmetric fiber with dedicated wired ethernet ports at each workstation. No shared throttled Wi-Fi.",
    verificationNote: "Dual ISP failover — 99.97% uptime across 12 rolling months",
    iconName: "Wifi",
  },
  {
    id: "amenity-5",
    title: "HEPA-Filtered Air & AQI Monitoring",
    category: "Environment",
    description: "Medical-grade HEPA air purifiers with live PM2.5 and CO2 sensors. Air quality maintained well within WHO safe limits.",
    verificationNote: "Live AQI readout displayed in lobby",
    iconName: "Wind",
  },
  {
    id: "amenity-6",
    title: "Unlimited Chai, Coffee & Water",
    category: "Refreshment",
    description: "Freshly brewed masala chai, South Indian filter coffee, green tea, and chilled purified water — available throughout the day.",
    verificationNote: "Replenished every 2 hours; sourced from local Kandivali vendors",
    iconName: "Coffee",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gallery
// ─────────────────────────────────────────────────────────────────────────────
export const galleryFixture: GalleryPhoto[] = [
  {
    id: "photo-1",
    caption: "The Main Study Hall with morning light filtering through frosted glass panels",
    area: "Main Study Hall",
    aspectRatio: "landscape",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    architecturalNote: "High ceilings with acoustic tiles and individual task lighting at each desk.",
  },
  {
    id: "photo-2",
    caption: "Individual focus pod with full-height privacy partition and dedicated lamp",
    area: "Focus Pods",
    aspectRatio: "portrait",
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    architecturalNote: "Full-height frosted glass partitions for complete visual privacy.",
  },
  {
    id: "photo-3",
    caption: "Private meeting cabin for calls, collaboration, and presentations",
    area: "Meeting Cabin",
    aspectRatio: "square",
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
    architecturalNote: "Soundproofed cabin with display screen and whiteboard wall.",
  },
  {
    id: "photo-4",
    caption: "The refreshment corner — unlimited chai, filter coffee and infused water",
    area: "Refreshment Corner",
    aspectRatio: "landscape",
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
    architecturalNote: "Complimentary beverages replenished throughout operating hours.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Member Reviews — real Indian member profiles
// ─────────────────────────────────────────────────────────────────────────────
export const reviewsFixture: MemberReview[] = [
  {
    id: "rev-1",
    author: "Priya Nair",
    role: "Chartered Accountant, Self-Employed",
    discipline: "Finance & Tax Advisory",
    quote: "I've tried every café and co-working space in Kandivali. Nothing compares. The silence is real, the internet never drops during client calls, and I finish my work in half the time. Worth every rupee.",
    membershipTenure: "Monthly Resident, 9 months",
    stayDate: "Stayed Oct 2026",
  },
  {
    id: "rev-2",
    author: "Rahul Deshmukh",
    role: "UPSC Aspirant",
    discipline: "Civil Services Preparation",
    quote: "I was sceptical about paying for a study space. After one week I cancelled my library trips entirely. The focused environment, no-phone zones, and unlimited coffee help me put in 8 solid hours. My mock scores improved noticeably.",
    membershipTenure: "Monthly Resident, 5 months",
    stayDate: "Stayed Sep 2026",
  },
  {
    id: "rev-3",
    author: "Anjali Mehta",
    role: "UX Designer, Freelance",
    discipline: "Product & Interface Design",
    quote: "Working from home was destroying my productivity. Here I sit down and within 10 minutes I'm in deep work mode. The ergonomic chairs and natural lighting mean my back no longer hurts after a full day. This is exactly what Mumbai needed.",
    membershipTenure: "Day Pass Regular, 6 months",
    stayDate: "Stayed Oct 2026",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Booking Records — sample data in INR
// ─────────────────────────────────────────────────────────────────────────────
export const bookingsFixture: BookingRecord[] = [
  {
    id: "BK-8021",
    bookingRef: "SNC-2026-8021",
    memberName: "Arjun Kulkarni",
    memberEmail: "arjun.kulkarni@outlook.com",
    tierId: "tier-resident",
    tierName: "Monthly Resident",
    seatId: "desk-04",
    seatLabel: "Desk 04 (Window Row)",
    roomName: "Main Study Hall",
    checkInDate: "2026-10-26",
    checkOutDate: "2026-11-26",
    status: "confirmed",
    totalAmount: 2499,
    currency: "INR",
    specialRequests: "Prefers corner desk away from the entrance. Requires 24/7 keycard for early morning sessions.",
    conciergeNotes: "Desk 04 set up with monitor arm and locker #14 allocated.",
    arrivalWindow: "08:30 — 09:30 AM",
    amenityAddons: ["Assigned Locker #14", "Postal Handling Service", "Ethernet Pack"],
  },
  {
    id: "BK-8022",
    bookingRef: "SNC-2026-8022",
    memberName: "Sneha Patil",
    memberEmail: "sneha.patil@gmail.com",
    tierId: "tier-day",
    tierName: "Day Pass",
    seatId: "desk-11",
    seatLabel: "Desk 11 (Courtyard View)",
    roomName: "Focus Zone",
    checkInDate: "2026-10-28",
    checkOutDate: "2026-10-28",
    status: "confirmed",
    totalAmount: 299,
    currency: "INR",
    specialRequests: "Prefers a window-facing seat if possible.",
    conciergeNotes: "Seat reserved with garden sightlines.",
    arrivalWindow: "09:00 — 10:00 AM",
    amenityAddons: ["Day Locker Access", "Unlimited Chai & Coffee"],
  },
  {
    id: "BK-8023",
    bookingRef: "SNC-2026-8023",
    memberName: "Vikram Sharma",
    memberEmail: "vikram.sharma@startup.in",
    tierId: "tier-patron",
    tierName: "Quarterly Fellow",
    seatId: "desk-01",
    seatLabel: "Desk 01 (Premium Zone)",
    roomName: "Main Study Hall",
    checkInDate: "2026-11-01",
    checkOutDate: "2027-01-31",
    status: "pending_review",
    totalAmount: 5999,
    currency: "INR",
    specialRequests: "Requires a dual-monitor setup and meeting cabin access on Thursdays.",
    conciergeNotes: "Awaiting GST invoice details for company reimbursement.",
    arrivalWindow: "Flexible 24/7",
    amenityAddons: ["All-Zone Access", "Private Cabin Credits", "8 Guest Passes"],
  },
  {
    id: "BK-8019",
    bookingRef: "SNC-2026-8019",
    memberName: "Meera Joshi",
    memberEmail: "meera.joshi@law.edu.in",
    tierId: "tier-day",
    tierName: "Day Pass",
    seatId: "desk-07",
    seatLabel: "Desk 07 (Centre Hall)",
    roomName: "Main Study Hall",
    checkInDate: "2026-10-18",
    checkOutDate: "2026-10-18",
    status: "completed",
    totalAmount: 299,
    currency: "INR",
    conciergeNotes: "Session completed. Member left positive feedback at front desk.",
    arrivalWindow: "08:00 AM",
    amenityAddons: ["Standard Amenities"],
  },
  {
    id: "BK-8015",
    bookingRef: "SNC-2026-8015",
    memberName: "Rohan Malhotra",
    memberEmail: "rohan.malhotra@techco.io",
    tierId: "tier-resident",
    tierName: "Monthly Resident",
    seatId: "desk-09",
    seatLabel: "Desk 09 (East Wing)",
    roomName: "Main Study Hall",
    checkInDate: "2026-09-15",
    checkOutDate: "2026-10-15",
    status: "cancelled",
    totalAmount: 2499,
    currency: "INR",
    specialRequests: "Cancelled due to travel schedule change.",
    conciergeNotes: "Refund of ₹2,499 processed within 5 business days per refund policy.",
    arrivalWindow: "N/A",
    amenityAddons: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FAQs
// ─────────────────────────────────────────────────────────────────────────────
export const faqsFixture: FAQItem[] = [
  {
    id: "faq-1",
    category: "Acoustics",
    question: "Is it really silent? Can I take phone calls inside?",
    answer: "The Main Study Hall and Focus Pods are strict silent zones — no calls, no conversations. Phone calls and video meetings must be taken in our soundproofed phone booths or meeting cabins, included with all memberships.",
  },
  {
    id: "faq-2",
    category: "Booking",
    question: "Can I reserve a specific desk in advance?",
    answer: "Yes. When booking, you choose your exact desk from the interactive floor plan. That workstation is reserved exclusively for you for the full duration of your session or membership.",
  },
  {
    id: "faq-3",
    category: "General",
    question: "What are the access hours?",
    answer: "Day Pass members can access the space from 07:30 to 22:00. Monthly Residents and Quarterly Fellows receive 24/7 keycard access — including weekends and public holidays.",
  },
  {
    id: "faq-4",
    category: "Membership",
    question: "How do I pay? Do you accept UPI and PhonePe?",
    answer: "Yes — we accept all major Indian payment methods: UPI (Google Pay, PhonePe, Paytm), debit cards, credit cards, net banking, and wallets. Payment is made online during booking and confirmed instantly.",
  },
  {
    id: "faq-5",
    category: "Booking",
    question: "What is your cancellation and refund policy?",
    answer: "Day Pass bookings can be cancelled for a full refund up to 24 hours before your session. Monthly plans can be cancelled up to 7 days before the start date. See our Refund Policy for full details.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Admin Metrics — INR revenue
// ─────────────────────────────────────────────────────────────────────────────
export const adminMetricsFixture: AdminMetrics = {
  activeSessions: 18,
  reservedToday: 24,
  occupancyRate: 82,
  membershipWaitlist: 7,
  monthlyRevenue: 124500,
  currency: "INR",
};

// ─────────────────────────────────────────────────────────────────────────────
// Location — Kandivali, Mumbai
// ─────────────────────────────────────────────────────────────────────────────
export const locationFixture = {
  name: "Sanctuary Study Space — Kandivali",
  addressLine1: "3rd Floor, Growel's 101 Mall Annex",
  addressLine2: "Akurli Road, Kandivali East",
  city: "Mumbai",
  statePostal: "Maharashtra 400 101",
  conciergePhone: "+91 98765 43210",
  conciergeEmail: "hello@sanctuary-study.in",
  openingHours: "Mon — Sun: 07:30 to 22:00 (24/7 for Monthly & Quarterly Members)",
  transitNote: "2-minute walk from Kandivali Station (Western Railway). Auto & cab drop-off at main entrance.",
};
