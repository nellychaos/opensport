import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        cream: {
          50:  "#FAFAF8",
          100: "#F5F5F0",
          200: "#EEEEE8",
        },
        amber: {
          500: "#D97706",
          600: "#B45309",
        },
      },
    },
  },
  plugins: [],
};

export default config;
