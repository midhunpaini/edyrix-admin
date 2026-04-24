import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "#0D6E6E", dark: "#094F4F", light: "#14918A" },
        amber: { DEFAULT: "#F5A623", dark: "#D4891A", pale: "#FEF3DC" },
        rose: "#E8445A",
        forest: "#22B573",
        ink: { DEFAULT: "#1A1A2E", 2: "#3D3D5C", 3: "#7C7C9A" },
        bg: "#F7F5F0",
        sidebar: "#0D6E6E",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      screens: {
        sidebar: "1024px",
      },
    },
  },
  plugins: [],
} satisfies Config;
