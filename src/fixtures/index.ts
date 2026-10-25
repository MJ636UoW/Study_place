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

export const plansFixture: PlanTier[] = [
  {
    id: "tier-day",
    name: "Day Sanctuary",
    code: "PLN-01",
    cadence: "per day",
    price: 45,
    currency: "USD",
    tagline: "Single-session deep work immersion in an unhurried, library-grade atmosphere.",
    features: [
      "Dedicated ergonomic oak workstation",
      "Fiber-optic wired & Wi-Fi connectivity",
      "Single-origin pour-over and herbal infusions",
      "Acoustic felt isolation paneling",
      "Phone booth access (up to 45 min/day)",
    ],
    accessHours: "07:30 — 22:00",
    guestPasses: 0,
    lockerAccess: false,
  },
  {
    id: "tier-resident",
    name: "Resident Atelier",
    code: "PLN-02",
    cadence: "per month",
    price: 380,
    currency: "USD",
    tagline: "Your permanent desk, cedar locker, and unrestricted 24/7 keycard access.",
    highlighted: true,
    features: [
      "Permanent assigned desk in the North Gallery",
      "24/7 biometric & keycard sanctuary access",
      "Private cedar locker with brass key",
      "Meeting salon credit (8 hours/month)",
      "Daily specialty roast & artisan tea pantry",
      "Personal postal receiving & courier handling",
    ],
    accessHours: "24 Hours / 7 Days",
    guestPasses: 4,
    lockerAccess: true,
  },
  {
    id: "tier-patron",
    name: "Estate Fellow",
    code: "PLN-03",
    cadence: "per quarter",
    price: 950,
    currency: "USD",
    tagline: "Unrestricted dual-studio residency with priority salon bookings and private locker.",
    features: [
      "Universal access across both Central and River studios",
      "Unlimited salon & library bookings",
      "Private storage vault & archival drawer",
      "Guest access for collaborators (12 passes/qtr)",
      "Dedicated concierge desk direct dispatch",
      "Quarterly private reading room dinner access",
    ],
    accessHours: "24 Hours / 7 Days",
    guestPasses: 12,
    lockerAccess: true,
  },
];

export const amenitiesFixture: AmenityItem[] = [
  {
    id: "amenity-1",
    title: "Library-Grade Acoustic Isolation",
    category: "Acoustics",
    description: "Multi-layered basalt wool walls and acoustic wood laths maintain an ambient level under 38 dBA.",
    verificationNote: "Independently certified by Sound & Vibration Lab, Oct 2026",
    iconName: "VolumeX",
  },
  {
    id: "amenity-2",
    title: "Natural Light & Circadian Tuning",
    category: "Environment",
    description: "North-facing skylights paired with warm 2700K task lighting avoid harsh glare and digital eye strain.",
    verificationNote: "Engineered by ArchLight Studio; flicker index < 0.01",
    iconName: "Sun",
  },
  {
    id: "amenity-3",
    title: "Solid White Oak Workstations",
    category: "Ergonomics",
    description: "Bespoke 160x80cm desks crafted by local joiners, equipped with Herman Miller Cosm chairs.",
    verificationNote: "Sustainably sourced FSC-certified Appalachian oak",
    iconName: "Compass",
  },
  {
    id: "amenity-4",
    title: "Dedicated Fiber Lines & Cellular Shielding",
    category: "Environment",
    description: "Redundant 1 Gbps symmetric fiber connections with discreet ethernet jacks at each workstation.",
    verificationNote: "99.98% uptime SLA verified across 24 rolling months",
    iconName: "Wifi",
  },
  {
    id: "amenity-5",
    title: "Filtered Air & Botanical Courtyard",
    category: "Environment",
    description: "Medical-grade HEPA filtration with CO2 sensors keeping indoor levels strictly below 600 ppm.",
    verificationNote: "Continuous real-time air quality readout in lobby",
    iconName: "Wind",
  },
  {
    id: "amenity-6",
    title: "Pour-Over Bar & Mineral Water",
    category: "Refreshment",
    description: "Rotational micro-lot Ethiopian and Colombian single-origin coffees, whole-leaf green and oolong teas.",
    verificationNote: "Beans roasted bi-weekly by local roasters",
    iconName: "Coffee",
  },
];

export const galleryFixture: GalleryPhoto[] = [
  {
    id: "photo-1",
    caption: "The North Study Gallery with morning light spilling across oak tables",
    area: "Main Reading Room",
    aspectRatio: "landscape",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    architecturalNote: "Double-height ceilings with timber truss work and acoustic felt lining.",
  },
  {
    id: "photo-2",
    caption: "Individual writing alcove featuring brass task lighting and linen privacy screen",
    area: "Focus Alcoves",
    aspectRatio: "portrait",
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    architecturalNote: "Deep reveal alcove recessed 40cm into limestone pier.",
  },
  {
    id: "photo-3",
    caption: "Private consultation and reading salon for uninterrupted reflection",
    area: "Reading Salon",
    aspectRatio: "square",
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
    architecturalNote: "Equipped with vintage leather armchairs and reference library stacks.",
  },
  {
    id: "photo-4",
    caption: "The Botanical tea pantry and quiet conversation loggia",
    area: "Courtyard Loggia",
    aspectRatio: "landscape",
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
    architecturalNote: "Overlooking a tranquil inner gravel courtyard with olive trees.",
  },
];

export const reviewsFixture: MemberReview[] = [
  {
    id: "rev-1",
    author: "Elena Rostova",
    role: "Architect & Partner, Studio V",
    discipline: "Architectural Theory",
    quote: "Sanctuary removed the ambient friction of traditional co-working. I finished our monograph in three consecutive weeks here. The silence is tangible, dignified, and respected.",
    membershipTenure: "Resident Atelier Member, 14 months",
    stayDate: "Stayed Oct 2026",
  },
  {
    id: "rev-2",
    author: "Marcus Vance",
    role: "Author & Fellow",
    discipline: "Historical Nonfiction",
    quote: "The combination of warm lighting, natural timber surfaces, and disciplined phone-free culture gave me four hours of unbroken focus every single morning. There is simply no equivalent space.",
    membershipTenure: "Estate Fellow, 2 years",
    stayDate: "Stayed Sep 2026",
  },
  {
    id: "rev-3",
    author: "Dr. Anya Chen",
    role: "Independent Researcher",
    discipline: "Computational Linguistics",
    quote: "No fluorescent buzz, no synthetic background music, no frantic networking energy. Just serious thinkers quietly doing the work that requires their absolute best attention.",
    membershipTenure: "Day Sanctuary Regular, 8 months",
    stayDate: "Stayed Oct 2026",
  },
];

export const bookingsFixture: BookingRecord[] = [
  {
    id: "BK-8021",
    bookingRef: "SNC-2026-8021",
    memberName: "David K. Sterling",
    memberEmail: "d.sterling@alumnus.org",
    tierId: "tier-resident",
    tierName: "Resident Atelier",
    seatId: "desk-04",
    seatLabel: "Desk 04 (North Garden Pier)",
    roomName: "North Study Gallery",
    checkInDate: "2026-10-26",
    checkOutDate: "2026-11-26",
    status: "confirmed",
    totalAmount: 380,
    currency: "USD",
    specialRequests: "Prefers corner orientation away from entrance doorway. Requests keycard activation for late-evening access.",
    conciergeNotes: "Desk 04 prepared with brass desk blotter and locker key #14.",
    arrivalWindow: "08:30 — 09:30 AM",
    amenityAddons: ["Assigned Cedar Locker #14", "Postal Holding Service", "Fiber Cable Pack"],
  },
  {
    id: "BK-8022",
    bookingRef: "SNC-2026-8022",
    memberName: "Claire Montgomery",
    memberEmail: "c.montgomery@lyceum.edu",
    tierId: "tier-day",
    tierName: "Day Sanctuary",
    seatId: "desk-11",
    seatLabel: "Desk 11 (West Courtyard View)",
    roomName: "Garden Loggia",
    checkInDate: "2026-10-28",
    checkOutDate: "2026-10-28",
    status: "confirmed",
    totalAmount: 45,
    currency: "USD",
    specialRequests: "Dietary preference: oat milk for pour-over service.",
    conciergeNotes: "Seat reserved with garden courtyard sightlines.",
    arrivalWindow: "09:00 — 10:00 AM",
    amenityAddons: ["Single-Origin Pour-Over Pass"],
  },
  {
    id: "BK-8023",
    bookingRef: "SNC-2026-8023",
    memberName: "Julian Brandt",
    memberEmail: "julian@brandt-design.co",
    tierId: "tier-patron",
    tierName: "Estate Fellow",
    seatId: "desk-01",
    seatLabel: "Desk 01 (Library Stacks)",
    roomName: "North Study Gallery",
    checkInDate: "2026-11-01",
    checkOutDate: "2027-01-31",
    status: "pending_review",
    totalAmount: 950,
    currency: "USD",
    specialRequests: "Requests archival flat-file drawer for large format blueprints.",
    conciergeNotes: "Awaiting architectural studio documentation review.",
    arrivalWindow: "Flexible 24/7",
    amenityAddons: ["Dual Studio Access", "Archival Drawer #02", "12 Guest Passes"],
  },
  {
    id: "BK-8019",
    bookingRef: "SNC-2026-8019",
    memberName: "Sarah L. Thorne",
    memberEmail: "sthorne@oxford-fellows.net",
    tierId: "tier-day",
    tierName: "Day Sanctuary",
    seatId: "desk-07",
    seatLabel: "Desk 07 (Central Mezzanine)",
    roomName: "North Study Gallery",
    checkInDate: "2026-10-18",
    checkOutDate: "2026-10-18",
    status: "completed",
    totalAmount: 45,
    currency: "USD",
    conciergeNotes: "Session completed smoothly. Member left positive note in guestbook.",
    arrivalWindow: "08:00 AM",
    amenityAddons: ["Standard Amenities"],
  },
  {
    id: "BK-8015",
    bookingRef: "SNC-2026-8015",
    memberName: "Harrison Blake",
    memberEmail: "hblake@monolith.ch",
    tierId: "tier-resident",
    tierName: "Resident Atelier",
    seatId: "desk-09",
    seatLabel: "Desk 09 (East Pier)",
    roomName: "North Study Gallery",
    checkInDate: "2026-09-15",
    checkOutDate: "2026-10-15",
    status: "cancelled",
    totalAmount: 380,
    currency: "USD",
    specialRequests: "Cancelled due to travel schedule change. Refund processed per policy.",
    conciergeNotes: "Refund credited within 5 business days per refund policy.",
    arrivalWindow: "N/A",
    amenityAddons: [],
  },
];

export const faqsFixture: FAQItem[] = [
  {
    id: "faq-1",
    category: "Acoustics",
    question: "What is the policy regarding conversations and phone calls?",
    answer: "The Main Reading Room and Gallery are strict whisper/silent zones. Personal voice calls, conference meetings, and video calls must take place inside our acoustically decoupled phone salons or conference rooms.",
  },
  {
    id: "faq-2",
    category: "Booking",
    question: "Can I reserve a specific desk in advance?",
    answer: "Yes. When reserving your Day Sanctuary session or Atelier residency, you select your exact desk from the floor architectural plan. That workstation is reserved exclusively for your session.",
  },
  {
    id: "faq-3",
    category: "General",
    question: "What are the hours of access for day guests versus residents?",
    answer: "Day Sanctuary guests enjoy access from 07:30 to 22:00. Resident Atelier and Estate Fellows receive 24/7 keycard access including weekends and holidays.",
  },
  {
    id: "faq-4",
    category: "Membership",
    question: "How does the membership application and intake work?",
    answer: "To preserve a calm, respectful working ecosystem, prospective members submit a brief inquiry stating their focus area. Our concierge team reviews inquiries within 24 business hours.",
  },
  {
    id: "faq-5",
    category: "Booking",
    question: "What is your cancellation and refund timeline?",
    answer: "Day bookings can be cancelled for a full refund up to 24 hours prior to check-in. Monthly residency plans can be modified up to 7 days before the period begins. Review our detailed Refund Policy for full terms.",
  },
];

export const adminMetricsFixture: AdminMetrics = {
  activeSessions: 18,
  reservedToday: 24,
  occupancyRate: 82,
  membershipWaitlist: 7,
  monthlyRevenue: 14250,
  currency: "USD",
};

export const locationFixture = {
  name: "Sanctuary Study — Central Studio",
  addressLine1: "148 St. Jude Architectural Mews",
  addressLine2: "Second Floor & Courtyard Loggia",
  city: "San Francisco",
  statePostal: "CA 94107",
  conciergePhone: "+1 (415) 890-3420",
  conciergeEmail: "concierge@sanctuary-study.com",
  openingHours: "Mon — Sun: 07:30 to 22:00 (24/7 for Residents)",
  transitNote: "3-minute walk from Montgomery Station. Covered bicycle parking in courtyard.",
};
