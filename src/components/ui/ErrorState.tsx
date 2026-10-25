import React from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Disruption in sanctuary dispatch",
  message = "We were unable to load the requested record. Our desk has logged this incident.",
  onRetry,
  retryLabel = "Attempt Recovery",
  className,
}) => {
  return (
    <div
      role="alert"
      className={clsx(
        "p-6 sm:p-8 border border-red-200 bg-red-50/40 text-charcoal-900 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 border border-red-300 bg-white text-red-700 flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-red-800 mb-0.5">
            System Notice
          </div>
          <h4 className="font-serif text-base text-charcoal-900">
            {title}
          </h4>
          <p className="text-xs text-charcoal-600 font-sans mt-0.5 max-w-lg leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="flex-shrink-0 self-end sm:self-center border-red-300 text-red-900 hover:bg-red-100/50">
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
