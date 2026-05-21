import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: "#080b12",
          900: "#0d111c",
          850: "#111827",
          800: "#151d2d",
          700: "#243044",
          500: "#5b8cff",
          400: "#7dd3fc",
          accent: "#8b5cf6",
          mint: "#34d399"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
