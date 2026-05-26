import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#DCE3EC",
        background: "#F4F7FB",
        foreground: "#132238",
        muted: "#5F6E84",
        primary: "#0E56C5",
        "primary-hover": "#003B8E",
        "senac-blue": "#003B8E",
        "senac-blue-dark": "#002E70",
        "senac-blue-soft": "#EAF2FF",
        "senac-orange": "#F7941D",
        "senac-orange-strong": "#FF8A00",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        "dark-accent": "#0B1220"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.04)",
        panel: "0 18px 48px rgba(10, 61, 145, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
