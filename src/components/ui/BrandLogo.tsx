import React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "auto";
  showText?: boolean;
  linkToHome?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  size = "md",
  variant = "auto",
  showText = true,
  linkToHome = false,
}) => {
  const pixelSizes = {
    sm: { img: 28, text: "text-base sm:text-lg", sub: "text-[8px] sm:text-[9px]" },
    md: { img: 36, text: "text-lg sm:text-xl lg:text-2xl", sub: "text-[9px] sm:text-[10px]" },
    lg: { img: 48, text: "text-xl sm:text-2xl lg:text-3xl", sub: "text-[10px] sm:text-xs" },
    xl: { img: 60, text: "text-2xl sm:text-3xl lg:text-4xl", sub: "text-xs" },
  };

  const isLight = variant === "light";
  const logoSrc = isLight ? "/logo-white.png" : "/logo.png";

  const content = (
    <div className={clsx("inline-flex items-center gap-2.5 sm:gap-3 select-none flex-shrink-0", className)}>
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <Image
          src={logoSrc}
          alt="Elite Study Zone Logo"
          width={pixelSizes[size].img}
          height={pixelSizes[size].img}
          className="object-contain"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left justify-center min-w-0">
          <span
            className={clsx(
              "font-sans font-black tracking-tight leading-tight whitespace-nowrap",
              pixelSizes[size].text,
              isLight ? "text-white" : "text-charcoal-900"
            )}
          >
            ELITE STUDY ZONE
          </span>
          <span
            className={clsx(
              "font-mono uppercase tracking-[0.14em] sm:tracking-[0.2em] font-semibold mt-0.5 whitespace-nowrap",
              pixelSizes[size].sub,
              isLight ? "text-forest-200" : "text-forest-800"
            )}
          >
            Self-Study Space & Focus Hub
          </span>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        href="/"
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 rounded"
      >
        {content}
      </Link>
    );
  }

  return content;
};
