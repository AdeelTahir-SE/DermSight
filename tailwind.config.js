/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // Bumped type scale — default Tailwind sizes rendered too small on device.
      fontSize: {
        xs: ["13px", { lineHeight: "18px" }],
        sm: ["15px", { lineHeight: "21px" }],
        base: ["17px", { lineHeight: "24px" }],
        lg: ["19px", { lineHeight: "27px" }],
        xl: ["21px", { lineHeight: "29px" }],
        "2xl": ["25px", { lineHeight: "33px" }],
        "3xl": ["30px", { lineHeight: "37px" }],
        "4xl": ["37px", { lineHeight: "42px" }],
        "5xl": ["49px", { lineHeight: "1" }],
      },
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
          750: "#07514C",
          800: "#053F3B",
          900: "#03201E",
          950: "#021512",
        },
        // Darkened text grays — secondary text was rendering too light.
        gray: {
          150: "#EBEEF2",
          300: "#9CA8B8",
          400: "#64748B",
          500: "#475569",
          505: "#475569",
          600: "#374151",
        },
        // Brightened dark-mode secondary text for readability.
        slate: {
          400: "#A6B3C6",
          450: "#94A3B8",
          500: "#8794A8",
          850: "#172033",
        },
        amber: {
          705: "#B45309",
        },
        red: {
          150: "#FECACA",
          650: "#B91C1C",
        },
        green: {
          455: "#4ADE80",
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
