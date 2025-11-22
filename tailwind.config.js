/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2fbf7",
          100: "#d1f3e3",
          200: "#b0ebd0",
          300: "#8fe2bd",
          400: "#6fdaa9",
          500: "#55c090",
          600: "#409672",
          700: "#2b6b53",
          800: "#164135",
          900: "#041616"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"]
      }
    }
  },
  plugins: []
};
