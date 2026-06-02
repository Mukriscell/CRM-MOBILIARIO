import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color semántico (FASE 10): urgente / enfriándose / a tiempo
        urgent: "#ef4444",
        warming: "#f59e0b",
        ontime: "#10b981",
      },
    },
  },
  plugins: [],
};

export default config;
