/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9E94",
          50: "#E6F7F5",
          100: "#CCEFEB",
          200: "#99DFD7",
          300: "#66CFC3",
          400: "#33BFAF",
          500: "#0D9E94",
          600: "#0A7E76",
          700: "#085F59",
          800: "#053F3B",
          900: "#03201E",
        },
        navy: {
          DEFAULT: "#1B2B4B",
          light: "#2D4270",
          dark: "#0F1A2E",
        },
        risk: {
          urgent: "#DC2626",
          high: "#EA580C",
          medium: "#D97706",
          low: "#16A34A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8FAFA",
          muted: "#F1F5F5",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
