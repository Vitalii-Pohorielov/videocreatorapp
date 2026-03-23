import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18222f",
        mist: "#eef4fb",
        accent: "#1d8f6f",
        warm: "#f3b56b",
      },
      boxShadow: {
        panel: "0 20px 45px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
