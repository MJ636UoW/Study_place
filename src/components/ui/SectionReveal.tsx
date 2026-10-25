"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
}

/**
 * Restrained Section Reveal using Motion
 * - Animates strictly GPU-composited opacity and translateY transforms.
 * - Respects prefers-reduced-motion instantly with static fallback.
 * - Zero layout shift (preserves dimensions).
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: SectionRevealProps) {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (prefersReduced || !mounted) {
    return <div className={className}>{children}</div>;
  }

  const yOffset = direction === "up" ? 14 : direction === "down" ? -14 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.38,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth editorial ease
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
