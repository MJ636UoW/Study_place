import React from "react";
import clsx from "clsx";

export type StatusType =
  | "confirmed"
  | "pending_review"
  | "in_session"
  | "completed"
  | "cancelled"
  | "bespoke"
  | "verified";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  className,
}) => {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");

  const styles: Record<string, { bg: string; text: string; border: string; defaultLabel: string; dot: string }> = {
    confirmed: {
      bg: "bg-forest-50",
      text: "text-forest-900",
      border: "border-forest-200",
      defaultLabel: "Confirmed",
      dot: "bg-forest-700",
    },
    in_session: {
      bg: "bg-forest-100",
      text: "text-forest-950",
      border: "border-forest-300",
      defaultLabel: "In Session",
      dot: "bg-forest-800",
    },
    pending_review: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      defaultLabel: "Pending Review",
      dot: "bg-amber-600",
    },
    completed: {
      bg: "bg-ivory-100",
      text: "text-charcoal-700",
      border: "border-ivory-300",
      defaultLabel: "Completed",
      dot: "bg-charcoal-500",
    },
    cancelled: {
      bg: "bg-stone-100",
      text: "text-stone-700",
      border: "border-stone-300",
      defaultLabel: "Cancelled",
      dot: "bg-stone-500",
    },
    bespoke: {
      bg: "bg-amber-100",
      text: "text-amber-900",
      border: "border-amber-300",
      defaultLabel: "Bespoke Patron",
      dot: "bg-amber-700",
    },
    verified: {
      bg: "bg-forest-50",
      text: "text-forest-800",
      border: "border-forest-200",
      defaultLabel: "Verified Standard",
      dot: "bg-forest-600",
    },
  };

  const current = styles[normalized] || {
    bg: "bg-ivory-100",
    text: "text-charcoal-800",
    border: "border-ivory-300",
    defaultLabel: label || status,
    dot: "bg-charcoal-500",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] tracking-wider",
    md: "px-2.5 py-1 text-xs tracking-wider",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-sans font-medium uppercase border rounded-none select-none",
        current.bg,
        current.text,
        current.border,
        sizeClasses[size],
        className
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", current.dot)} aria-hidden="true" />
      <span>{label || current.defaultLabel}</span>
    </span>
  );
};
