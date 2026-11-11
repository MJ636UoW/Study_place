import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#F8FAFC",
          25: "#FFFFFF",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
        },
        charcoal: {
          DEFAULT: "#0F172A",
          950: "#020617",
          900: "#0F172A",
          850: "#1E293B",
          800: "#334155",
          700: "#475569",
          600: "#64748B",
          500: "#94A3B8",
          400: "#CBD5E1",
          300: "#E2E8F0",
          200: "#F1F5F9",
        },
        forest: {
          DEFAULT: "#1D4ED8",
          950: "#091E42",
          900: "#1E3A8A",
          800: "#1E40AF",
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#3B82F6",
          200: "#BFDBFE",
          100: "#DBEAFE",
          50: "#EFF6FF",
        },
        amber: {
          DEFAULT: "#0284C7",
          900: "#0C4A6E",
          800: "#075985",
          700: "#0369A1",
          600: "#0284C7",
          500: "#0EA5E9",
          400: "#38BDF8",
          200: "#BAE6FD",
          100: "#E0F2FE",
          50: "#F0F9FF",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Newsreader", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        editorial: "0 1px 3px 0 rgba(26, 25, 24, 0.05), 0 1px 2px -1px rgba(26, 25, 24, 0.05)",
        "editorial-md": "0 4px 6px -1px rgba(26, 25, 24, 0.06), 0 2px 4px -2px rgba(26, 25, 24, 0.04)",
        "editorial-lg": "0 10px 15px -3px rgba(26, 25, 24, 0.08), 0 4px 6px -4px rgba(26, 25, 24, 0.03)",
        focus: "0 0 0 2px #FAF8F5, 0 0 0 4px #183728",
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
