import React, { forwardRef } from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, helperText, optional, className, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full text-left">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={inputId} className="block text-xs uppercase tracking-wider font-medium text-charcoal-800">
            {label}
            {required && <span className="text-amber-700 ml-1" aria-hidden="true">*</span>}
          </label>
          {optional && <span className="text-xs text-charcoal-500 font-sans">Optional</span>}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={clsx(
              "w-full px-3.5 py-2.5 min-h-[44px] bg-ivory-50 text-charcoal-900 border rounded-none font-sans text-sm",
              "placeholder:text-charcoal-400 placeholder:font-normal",
              "transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-1 focus-visible:ring-offset-ivory-50",
              error
                ? "border-red-700 focus-visible:ring-red-700 bg-red-50/20"
                : "border-ivory-300 hover:border-charcoal-500 focus-visible:border-forest-900",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-700 font-sans" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-charcoal-500 font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, error, helperText, optional, className, required, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full text-left">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={textareaId} className="block text-xs uppercase tracking-wider font-medium text-charcoal-800">
            {label}
            {required && <span className="text-amber-700 ml-1" aria-hidden="true">*</span>}
          </label>
          {optional && <span className="text-xs text-charcoal-500 font-sans">Optional</span>}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          className={clsx(
            "w-full px-3.5 py-2.5 min-h-[44px] bg-ivory-50 text-charcoal-900 border rounded-none font-sans text-sm",
            "placeholder:text-charcoal-400 placeholder:font-normal",
            "transition-colors duration-150 ease-out resize-y",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-1 focus-visible:ring-offset-ivory-50",
            error
              ? "border-red-700 focus-visible:ring-red-700 bg-red-50/20"
              : "border-ivory-300 hover:border-charcoal-500 focus-visible:border-forest-900",
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-red-700 font-sans" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-xs text-charcoal-500 font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, options, error, helperText, className, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full text-left">
        <label htmlFor={selectId} className="block text-xs uppercase tracking-wider font-medium text-charcoal-800 mb-1.5">
          {label}
          {required && <span className="text-amber-700 ml-1" aria-hidden="true">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={clsx(
              "w-full px-3.5 py-2.5 min-h-[44px] bg-ivory-50 text-charcoal-900 border rounded-none font-sans text-sm appearance-none pr-10",
              "transition-colors duration-150 ease-out cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-1 focus-visible:ring-offset-ivory-50",
              error
                ? "border-red-700 focus-visible:ring-red-700"
                : "border-ivory-300 hover:border-charcoal-500 focus-visible:border-forest-900",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-ivory-50 text-charcoal-900 py-2">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-600">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-700 font-sans" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1.5 text-xs text-charcoal-500 font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
