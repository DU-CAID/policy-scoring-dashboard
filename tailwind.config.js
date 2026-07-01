/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        crimson: { DEFAULT: "#8C2332", dark: "#6E1B27", pale: "#F5E9EB" },
        gold: { DEFAULT: "#A89968", pale: "#F3EFE4" },
        ink: "#211C17",
        paper: "#FAF8F5",
        muted: "#6B6257",
        line: "#E5DFD6"
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Public Sans'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
