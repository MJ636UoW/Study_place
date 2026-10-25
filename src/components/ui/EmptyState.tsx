import React from "react";
import clsx from "clsx";
import { BookOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-10 sm:p-14 text-center border border-dashed border-ivory-300 bg-ivory-100/30 rounded-none",
        className
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center border border-ivory-300 bg-ivory-50 text-forest-900 mb-4 shadow-editorial">
        {icon || <BookOpen className="w-5 h-5 text-forest-800" />}
      </div>
      <div className="text-[10px] uppercase font-mono tracking-widest text-amber-700 mb-1">
        Archive Entry
      </div>
      <h3 className="text-xl font-serif text-charcoal-900 tracking-tight mb-2">
        {title}
      </h3>
      <p className="max-w-md text-sm text-charcoal-600 font-sans leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
