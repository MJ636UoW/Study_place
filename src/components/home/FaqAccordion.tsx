"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { FAQItem } from "@/fixtures";

interface FaqAccordionProps {
  items: FAQItem[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  const [openIds, setOpenIds] = useState<string[]>([items[0]?.id || ""]);

  const toggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="divide-y divide-ivory-200 border-y border-ivory-200">
      {items.map((item, index) => {
        const isOpen = openIds.includes(item.id);
        const buttonId = `faq-btn-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div key={item.id} className="transition-colors hover:bg-ivory-100/40">
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className="w-full py-5 px-4 sm:px-6 flex items-start justify-between gap-4 text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800">
                  [{String(index + 1).padStart(2, "0")}] {item.category}
                </span>
                <h4 className="font-serif text-lg sm:text-xl text-charcoal-900 leading-snug">
                  {item.question}
                </h4>
              </div>
              <span
                className={clsx(
                  "p-1.5 border border-ivory-300 text-charcoal-600 transition-transform duration-200 flex-shrink-0 mt-1",
                  isOpen && "rotate-180 bg-ivory-200 text-charcoal-950"
                )}
                aria-hidden="true"
              >
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-4 sm:px-6 pb-6 pt-1 text-sm font-sans text-charcoal-700 leading-relaxed max-w-3xl animate-in fade-in duration-150"
              >
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
