"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className={clsx(
          "relative w-full max-w-xl mx-auto bg-ivory-50 border-t sm:border-x border-ivory-300 shadow-editorial-lg rounded-t-sm z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Grab Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center items-center" aria-hidden="true">
          <div className="w-12 h-1 bg-ivory-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-200">
          <div>
            <h3 id="sheet-title" className="text-lg font-serif text-charcoal-900">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-charcoal-500 font-sans mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-charcoal-500 hover:text-charcoal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 rounded-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-sm text-charcoal-800">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 border-t border-ivory-200 bg-ivory-100/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
