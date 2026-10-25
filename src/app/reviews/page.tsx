"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ReviewItem {
  id: string;
  author: string;
  role: string;
  discipline: string;
  quote: string;
  membershipTenure: string;
  stayDate: string;
  rating?: number;
}

interface ReviewAggregates {
  averageRating: number;
  totalCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendPercentage: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [aggregates, setAggregates] = useState<ReviewAggregates | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [authorName, setAuthorName] = useState("");
  const [role, setRole] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [userId] = useState("usr_sterling_01"); // Default to authenticated fellow
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setAggregates(data.aggregates || null);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          authorName,
          role,
          discipline,
          quote,
          rating,
          membershipTenure: "Resident Member",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Review submission failed.");
      }

      setSubmitSuccess(true);
      fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while submitting review.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Masthead */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory-100 border border-ivory-300 text-[11px] font-mono uppercase tracking-widest text-amber-800">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-800" />
          <span>Verified Member Feedback Register</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl text-charcoal-900 tracking-tight">
          Fellow Reflections & Ratings
        </h1>
        <p className="text-sm sm:text-base text-charcoal-700 font-sans leading-relaxed">
          Aggregates and testimonials published strictly from verified member stays. We never suppress legitimate critique or publish fabricated endorsements.
        </p>
      </div>

      {/* Aggregates Dashboard */}
      {aggregates && (
        <div className="p-8 border border-ivory-300 bg-ivory-50 shadow-editorial grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Average Score */}
          <div className="text-center md:text-left space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 block">
              Cumulative Rating
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="font-serif text-5xl text-charcoal-900 font-bold">
                {aggregates.averageRating}
              </span>
              <span className="text-sm font-mono text-charcoal-500">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-600">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(aggregates.averageRating) ? "fill-amber-500 text-amber-500" : "text-ivory-300"}`}
                />
              ))}
            </div>
            <p className="text-xs text-charcoal-500 font-sans">
              Based on {aggregates.totalCount} verified resident submissions
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l md:border-r border-ivory-200 pt-4 md:pt-0 md:px-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 block mb-2">
              Score Breakdown
            </span>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = aggregates.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = aggregates.totalCount > 0 ? (count / aggregates.totalCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-mono text-charcoal-600">
                  <span className="w-8 flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </span>
                  <div className="flex-1 h-2 bg-ivory-200 overflow-hidden">
                    <div className="h-full bg-forest-800" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-charcoal-500">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Reciprocity Note */}
          <div className="space-y-2 text-xs font-sans text-charcoal-700">
            <span className="text-[10px] font-mono uppercase tracking-widest text-forest-800 font-semibold block">
              Curatorial Standard
            </span>
            <p className="leading-relaxed">
              <strong>{aggregates.recommendPercentage}%</strong> of residents recommend Sanctuary for deep-work focus and thesis monograph writing.
            </p>
            <p className="text-[11px] text-charcoal-500 italic">
              All reviews are cryptographically matched with verified payment and desk allocation records before being eligible for publishing.
            </p>
          </div>
        </div>
      )}

      {/* Review Submission Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 p-8 border border-ivory-300 bg-ivory-50 shadow-editorial space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-ivory-200">
            <div>
              <h2 className="font-serif text-2xl text-charcoal-900">
                Submit a Residency Reflection
              </h2>
              <p className="text-xs text-charcoal-600 font-sans mt-0.5">
                Eligibility restricted to genuine fellows with completed or active reservations.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5">
              Verified Gateway
            </span>
          </div>

          {errorMessage && (
            <div className="p-4 border border-rose-300 bg-rose-50/70 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
              <div>
                <span className="font-semibold block mb-0.5">Eligibility Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {submitSuccess ? (
            <div className="p-8 border border-forest-300 bg-forest-50/70 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-forest-800 mx-auto" />
              <h3 className="font-serif text-2xl text-charcoal-900">
                Reflection Recorded
              </h3>
              <p className="text-xs text-charcoal-700 font-sans max-w-md mx-auto leading-relaxed">
                Thank you for contributing to the quietude covenant. Your evaluation has been cataloged in the public ledger.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fellow Name"
                  placeholder="e.g. Fellow Sterling"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                />
                <Input
                  label="Professional Title / Studio"
                  placeholder="e.g. Scholar, Oxford Institute"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Discipline / Field"
                  placeholder="e.g. Pure Mathematics"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  required
                />
                <Select
                  label="Overall Rating"
                  value={String(rating)}
                  onChange={(e) => setRating(Number(e.target.value))}
                  options={[
                    { value: "5", label: "5 Stars — Flawless Quietude & Acoustic Solitude" },
                    { value: "4", label: "4 Stars — Highly Productive Experience" },
                    { value: "3", label: "3 Stars — Moderate Acoustic Performance" },
                    { value: "2", label: "2 Stars — Noticeable Ambient Friction" },
                    { value: "1", label: "1 Star — Unsatisfactory Quietude" },
                  ]}
                />
              </div>

              <Textarea
                label="Your Reflection & Feedback"
                placeholder="Share your experience regarding desk ergonomics, acoustic silence, and sanctuary atmosphere (minimum 10 characters)."
                rows={4}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                required
              />

              <div className="text-[11px] font-sans text-charcoal-500">
                Signing as authenticated user: <span className="font-mono font-semibold">{userId}</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Submit Verified Reflection
              </Button>
            </form>
          )}
        </div>

        {/* Informational Guidance */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 border border-ivory-300 bg-ivory-100/60 space-y-4 text-xs font-sans text-charcoal-700">
            <h3 className="font-serif text-2xl text-charcoal-900 pb-2 border-b border-ivory-200">
              Editorial Policy
            </h3>
            <p>
              <strong>Zero Astroturfing:</strong> Reviews can only be submitted by registered fellows with a verified booking pass. Guest reviews without a booking reference are automatically blocked.
            </p>
            <p>
              <strong>Unsuppressed Constructive Criticism:</strong> Lower scores regarding acoustic infractions, temperature, or chair ergonomics are published transparently to hold our curatorial team accountable.
            </p>
            <p>
              <strong>1 Review Per Residency:</strong> Repeated submissions from the same residency are barred to prevent score inflation.
            </p>
          </div>
        </div>
      </div>

      {/* Published Member Reviews List */}
      <div className="space-y-6 pt-6">
        <h2 className="font-serif text-2xl sm:text-3xl text-charcoal-900 pb-3 border-b border-ivory-200">
          Published Fellow Records ({reviews.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-charcoal-500">
            Accessing Sanctuary Member Register...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-6 border border-ivory-300 bg-ivory-50 flex flex-col justify-between space-y-4 shadow-editorial text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-600">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= (r.rating || 5) ? "fill-amber-500 text-amber-500" : "text-ivory-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono uppercase text-charcoal-500">
                      {r.stayDate}
                    </span>
                  </div>

                  <p className="font-serif italic text-base text-charcoal-900 leading-relaxed">
                    “{r.quote}”
                  </p>
                </div>

                <div className="pt-3 border-t border-ivory-200 text-xs font-sans">
                  <div className="font-semibold text-charcoal-900">{r.author}</div>
                  <div className="text-charcoal-600 text-[11px]">
                    {r.role} • {r.discipline}
                  </div>
                  <div className="text-[10px] font-mono text-forest-800 mt-1">
                    {r.membershipTenure}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
