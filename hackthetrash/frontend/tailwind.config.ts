import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#16A34A",
        danger: "#DC2626",
        warning: "#F59E0B",
        success: "#10B981"
      }
    }
  },
  plugins: []
};
export default config;
