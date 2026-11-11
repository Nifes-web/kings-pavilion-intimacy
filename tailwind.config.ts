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
        brand: {
          fireRed: "#E81712",
          flameOrange: "#FF5A1F",
          goldYellow: "#FFC400",
          deepBlack: "#101010",
          obsidian: "#09080D",
          charcoal: "#14121B",
          cardDark: "#181522",
          cardBorder: "#272233",
          lightBg: "#F9FAFB",
          lightCard: "#FFFFFF",
          lightBorder: "#E5E7EB",
          textMuted: "#6B7280",
          textDark: "#111827",
        },
      },
      backgroundImage: {
        "fire-gradient": "linear-gradient(135deg, #E81712 0%, #FF5A1F 50%, #FFC400 100%)",
        "fire-gradient-h": "linear-gradient(90deg, #E81712 0%, #FF5A1F 50%, #FFC400 100%)",
        "gold-gradient": "linear-gradient(180deg, #FFF1B8 0%, #FFC400 60%, #E69D00 100%)",
        "cta-gradient": "linear-gradient(135deg, #BE123C 0%, #EA580C 50%, #D97706 100%)",
        "dark-radial": "radial-gradient(circle at 50% 20%, rgba(232, 23, 18, 0.22) 0%, rgba(255, 90, 31, 0.12) 35%, rgba(9, 8, 13, 0.98) 75%)",
      },
      boxShadow: {
        "fire-glow": "0 0 35px -5px rgba(232, 23, 18, 0.4)",
        "gold-glow": "0 0 30px -5px rgba(255, 196, 0, 0.35)",
        "card-soft": "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 12px 30px -4px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
