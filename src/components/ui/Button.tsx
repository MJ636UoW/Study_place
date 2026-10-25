import React, { forwardRef } from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "amber" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-sans tracking-wide transition-all duration-100 ease-out active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-50 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] min-w-[44px]";

    const sizeStyles = {
      sm: "px-3.5 py-2 text-xs uppercase tracking-wider font-medium",
      md: "px-5 py-2.5 text-sm font-medium",
      lg: "px-7 py-3.5 text-base font-medium",
    };

    const variantStyles = {
      primary:
        "bg-forest-900 text-ivory-50 hover:bg-forest-800 active:bg-forest-950 border border-forest-900 shadow-editorial",
      secondary:
        "bg-ivory-100 text-charcoal-900 hover:bg-ivory-200 active:bg-ivory-300 border border-ivory-300 shadow-editorial",
      outline:
        "bg-transparent text-charcoal-900 hover:bg-ivory-100 border border-charcoal-800 hover:border-charcoal-950",
      amber:
        "bg-amber-600 text-ivory-50 hover:bg-amber-700 active:bg-amber-800 border border-amber-700 shadow-editorial",
      ghost:
        "bg-transparent text-charcoal-700 hover:text-charcoal-950 hover:bg-ivory-100 border border-transparent",
      danger:
        "bg-red-800 text-white hover:bg-red-900 active:bg-red-950 border border-red-900",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          "rounded-none",
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
