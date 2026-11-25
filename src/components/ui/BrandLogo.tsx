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
    sm: { img: 28, text: "text-lg", sub: "text-[9px]" },
    md: { img: 38, text: "text-xl sm:text-2xl", sub: "text-[10px]" },
    lg: { img: 52, text: "text-2xl sm:text-3xl", sub: "text-xs" },
    xl: { img: 68, text: "text-3xl sm:text-4xl", sub: "text-xs" },
  };

  const isLight = variant === "light";
  const logoSrc = isLight ? "/logo-white.png" : "/logo.png";

  const content = (
    <div className={clsx("inline-flex items-center gap-2.5 select-none", className)}>
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
        <div className="flex flex-col text-left">
          <span
            className={clsx(
              "font-sans font-extrabold tracking-tight leading-none",
              pixelSizes[size].text,
              isLight ? "text-white" : "text-charcoal-900"
            )}
          >
            ELITE STUDY ZONE
          </span>
          <span
            className={clsx(
              "font-mono uppercase tracking-[0.2em] font-semibold mt-1",
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
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 rounded"
      >
        {content}
      </Link>
    );
  }

  return content;
};
