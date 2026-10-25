import React from "react";
import clsx from "clsx";

export interface LoadingStateProps {
  label?: string;
  variant?: "spinner" | "skeleton" | "card";
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Accessing sanctuary records…",
  variant = "spinner",
  className,
}) => {
  if (variant === "skeleton") {
    return (
      <div className={clsx("w-full space-y-4 animate-pulse", className)} role="status" aria-label={label}>
        <div className="h-4 bg-ivory-200 w-1/4 rounded-none" />
        <div className="h-8 bg-ivory-200 w-3/4 rounded-none" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-ivory-200 w-full rounded-none" />
          <div className="h-3 bg-ivory-200 w-5/6 rounded-none" />
          <div className="h-3 bg-ivory-200 w-2/3 rounded-none" />
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={clsx(
          "w-full p-6 border border-ivory-200 bg-ivory-100/40 animate-pulse space-y-4",
          className
        )}
        role="status"
        aria-label={label}
      >
        <div className="flex justify-between items-center">
          <div className="h-3 bg-ivory-300 w-20" />
          <div className="h-5 bg-ivory-300 w-16" />
        </div>
        <div className="h-6 bg-ivory-300 w-1/2" />
        <div className="h-4 bg-ivory-200 w-full" />
        <div className="h-4 bg-ivory-200 w-4/5" />
        <div className="pt-4 flex justify-between items-center border-t border-ivory-200">
          <div className="h-4 bg-ivory-200 w-24" />
          <div className="h-9 bg-ivory-300 w-28" />
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 border border-ivory-300 rounded-none" />
        <div className="absolute inset-0 border-t-2 border-forest-900 animate-spin" />
      </div>
      <p className="font-serif text-sm tracking-wide text-charcoal-700 italic">
        {label}
      </p>
    </div>
  );
};
