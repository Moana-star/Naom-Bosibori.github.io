import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        midnight: "#020617",
        electric: "#789cff",
        ice: "#b8d7ff",
      },
      fontFamily: {
        display: ["Syne", "Arial", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
