import React from "react";
import Link from "next/link";
import { ArrowRight, Check, MapPin, Clock, Phone, ShieldCheck, Wifi, Sparkles } from "lucide-react";
import { SectionReveal } from "@/components/ui/SectionReveal";

export const metadata = {
  title: "About Us • Mission & Architecture | Elite Study Zone Ghatkopar",
  description:
    "Learn about Elite Study Zone in Ghatkopar West, Mumbai. Our mission, architectural acoustics, ergonomic design, circadian lighting, and 24/7 smart access.",
};

export default function AboutPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-ivory-200 bg-ivory-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-[11px] font-mono uppercase tracking-widest text-forest-700 font-semibold rounded-full">
            <span>ABOUT ELITE STUDY ZONE</span>
          </div>

          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-charcoal-900 tracking-tight leading-tight">
            A Place Where Dreams Turn Into Achievements.
          </h1>

          <p className="text-base sm:text-lg text-charcoal-700 font-sans max-w-3xl mx-auto leading-relaxed">
            Welcome to <strong>Elite Study Zone</strong>. Located in Amrut Nagar, Ghatkopar West, Mumbai, we provide a peaceful, disciplined, comfortable, and distraction-free environment where aspirants, students, and professionals focus on their highest goals.
          </p>

          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/login?redirect=/book"
              className="px-8 py-3.5 bg-forest-700 text-white text-xs uppercase tracking-widest font-bold hover:bg-forest-600 rounded-md shadow-md inline-flex items-center gap-2 transition-all"
            >
              <span>Book Your Workstation Seat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-ivory-200">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <span className="text-[11px] uppercase font-mono tracking-widest text-forest-700 font-semibold">
              Our Core Mission
            </span>
            <h2 className="font-sans font-bold text-2xl sm:text-3xl text-charcoal-900">
              Discipline, Consistency & Productive Learning
            </h2>
            <p className="text-sm text-charcoal-600 leading-relaxed">
              Every page you read, every hour you dedicate, and every effort you make brings you one step closer to your dreams. We built Elite Study Zone to eliminate all friction—no household distractions, no loud cafes, no Wi-Fi dropouts.
            </p>
            <div className="p-5 bg-forest-50 border-l-4 border-forest-700 rounded-r-md text-xs text-charcoal-800 space-y-1">
              <div className="font-bold text-forest-900 uppercase tracking-wide">DREAM BIG. STAY FOCUSED. ACHIEVE MORE.</div>
              <p>Tailored for UPSC, MPSC, CA, CS, NEET, JEE, GATE, CAT aspirants and remote professionals requiring absolute quietude.</p>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[11px] uppercase font-mono tracking-widest text-forest-700 font-semibold">
              What Sets Us Apart
            </span>
            <div className="space-y-3">
              <div className="p-4 border border-ivory-300 rounded-lg bg-ivory-50/50">
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest-700" />
                  Smart Digital Keypad Door Access (Zero Biometric Friction)
                </h3>
                <p className="text-xs text-charcoal-600 mt-1">
                  Enter securely with your assigned 6-digit PIN (#XXXXXX) on the exterior keypad. To exit, simply press the green push-to-exit button inside.
                </p>
              </div>

              <div className="p-4 border border-ivory-300 rounded-lg bg-ivory-50/50">
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-forest-700" />
                  Dual Redundant High-Speed 5G Fiber Wi-Fi
                </h3>
                <p className="text-xs text-charcoal-600 mt-1">
                  Dedicated commercial optical fiber ensures zero lag during video lectures, mock tests, and intense research.
                </p>
              </div>

              <div className="p-4 border border-ivory-300 rounded-lg bg-ivory-50/50">
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-forest-700" />
                  Sub-38 dBA Acoustic Silence & Circadian Lighting
                </h3>
                <p className="text-xs text-charcoal-600 mt-1">
                  Individual high-back ergonomic chairs, soft 2700K glare-free task lighting, and continuous air conditioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Center Details & Location */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-ivory-50 border-b border-ivory-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="font-sans font-bold text-2xl text-charcoal-900">Visit Us in Ghatkopar West</h2>
          <p className="text-sm text-charcoal-600 max-w-2xl mx-auto">
            Conveniently situated near Shreyas Cinema and Ghatkopar Metro & Railway Station in Mumbai.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-4">
            <div className="p-5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <MapPin className="w-5 h-5 text-forest-700 mb-2" />
              <div className="font-bold text-xs uppercase tracking-wider text-charcoal-500">Address</div>
              <div className="text-xs text-charcoal-800 font-medium mt-1">
                Amrut Nagar, Near Shreyas Cinema, LBS Marg, Ghatkopar West, Mumbai 400086
              </div>
            </div>

            <div className="p-5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <Clock className="w-5 h-5 text-forest-700 mb-2" />
              <div className="font-bold text-xs uppercase tracking-wider text-charcoal-500">Timings</div>
              <div className="text-xs text-charcoal-800 font-medium mt-1">
                07:00 AM – 11:00 PM Daily<br />(24/7 Access for Dedicated Members)
              </div>
            </div>

            <div className="p-5 bg-white border border-ivory-300 rounded-lg shadow-sm">
              <Phone className="w-5 h-5 text-forest-700 mb-2" />
              <div className="font-bold text-xs uppercase tracking-wider text-charcoal-500">Helpline / WhatsApp</div>
              <div className="text-xs text-charcoal-800 font-medium mt-1">
                +91 93246 89280<br />+91 99878 18182
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
