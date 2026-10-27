"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Clock, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { locationFixture } from "@/fixtures";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("tour");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [renderedAt, setRenderedAt] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string>("");

  useEffect(() => {
    setRenderedAt(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          topic: inquiryType,
          message,
          website: honeypot, // Spam honeypot
          renderedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please check form fields.");
      }

      setIsSent(true);
      setSubmittedEnquiryId(data.enquiryId || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <span>Curatorial Desk</span>
          <span>•</span>
          <span>Direct Dispatch</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl text-charcoal-900 tracking-tight">
          Speak with the Concierge
        </h1>
        <p className="text-sm sm:text-base text-charcoal-700 font-sans leading-relaxed">
          Inquire about institutional fellowships, schedule a quietude walkthrough, or discuss bespoke residency accommodations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 p-8 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-ivory-200">
            <h2 className="font-serif text-2xl text-charcoal-900">
              Submit an Inquiry
            </h2>
            <span className="text-[10px] font-mono uppercase text-charcoal-500">
              Sliding Rate Protected
            </span>
          </div>

          {errorMessage && (
            <div className="p-4 border border-rose-300 bg-rose-50/70 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
              <div>
                <span className="font-semibold block mb-0.5">Dispatch Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {isSent ? (
            <div className="p-8 border border-forest-300 bg-forest-50/70 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-forest-800 mx-auto" />
              <h3 className="font-serif text-2xl text-charcoal-900">
                Dispatch Logged in Ledger
              </h3>
              <p className="text-xs text-charcoal-700 font-sans max-w-md mx-auto leading-relaxed">
                Thank you, {name || "Fellow"}. Your inquiry has been formally cataloged under reference{" "}
                <span className="font-mono font-semibold text-charcoal-900">{submittedEnquiryId}</span>.
                Our curatorial desk reviews incoming communications twice daily and will respond directly to <strong>{email}</strong> within 12 business hours.
              </p>
              <div className="pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSent(false);
                    setMessage("");
                    setRenderedAt(Date.now());
                  }}
                >
                  Send Another Inquiry
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Spam Honeypot Field (invisible to genuine humans) */}
              <div style={{ display: "none" }} aria-hidden="true">
                <label htmlFor="website-trap">Website</label>
                <input
                  id="website-trap"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  placeholder="e.g. Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="scholar@studio.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Telephone (Optional)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Select
                  label="Nature of Inquiry"
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  options={[
                    { value: "tour", label: "Schedule an In-Person Studio Tour" },
                    { value: "institutional", label: "Institutional / University Fellowship Inquiry" },
                    { value: "fellow", label: "Estate Fellow Residency Application" },
                    { value: "general", label: "General Sanctuary Questions" },
                  ]}
                />
              </div>

              <Textarea
                label="Message or Scholar Background"
                placeholder="Share your focus area, preferred arrival timeline, or any specific quietude accommodations required (minimum 10 characters)."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Send Inquiry to Curatorial Desk
              </Button>
            </form>
          )}
        </div>

        {/* Studio Info Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 border border-ivory-300 bg-ivory-100/60 space-y-6">
            <h3 className="font-serif text-2xl text-charcoal-900 pb-3 border-b border-ivory-200">
              Studio Location
            </h3>

            <div className="space-y-4 text-xs font-sans text-charcoal-800">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-charcoal-900">{locationFixture.name}</div>
                  <div>{locationFixture.addressLine1}</div>
                  <div>{locationFixture.addressLine2}</div>
                  <div>{locationFixture.city}, {locationFixture.statePostal}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-charcoal-900">Quietude Hours</div>
                  <div>{locationFixture.openingHours}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-charcoal-900">Telephone Desk</div>
                  <div>{locationFixture.conciergePhone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-charcoal-900">Electronic Mail</div>
                  <div>{locationFixture.conciergeEmail}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-ivory-200 text-xs text-charcoal-600 font-sans">
              <p className="font-medium text-charcoal-900 mb-1">Transit & Access</p>
              <p>{locationFixture.transitNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
