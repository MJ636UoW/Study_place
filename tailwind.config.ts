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
          DEFAULT: "#FAF7F2",
          25: "#FDFCF9",
          50: "#FAF8F5",
          100: "#F4EFE6",
          200: "#EAE3D5",
          300: "#DDD3C1",
          400: "#C8BBA5",
          500: "#AC9E88",
        },
        charcoal: {
          DEFAULT: "#1A1918",
          950: "#11100F",
          900: "#1A1918",
          850: "#242220",
          800: "#2E2C29",
          700: "#45423E",
          600: "#5A5651",
          500: "#706B64",
          400: "#948E85",
          300: "#B8B2A8",
          200: "#D6D1C7",
        },
        forest: {
          DEFAULT: "#183728",
          950: "#0D2016",
          900: "#183728",
          800: "#214A37",
          700: "#2C6047",
          600: "#387859",
          500: "#47936E",
          200: "#BDDAC8",
          100: "#DDEEE4",
          50: "#F0F7F3",
        },
        amber: {
          DEFAULT: "#C5832B",
          900: "#6B4412",
          800: "#915E1A",
          700: "#B37423",
          600: "#C5832B",
          500: "#D9993E",
          400: "#E5AF5D",
          200: "#F5DBAC",
          100: "#FDF2E2",
          50: "#FEF9F2",
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
