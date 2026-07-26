/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2b2320",
        board: "#f4ede6",
        mustard: "#c99b8e",
        moss: "#a9ab93",
        clay: "#a9695c",
        paper: "#fffdfa",
      },
      fontFamily: {
        display: ["'Instrument Serif'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pin: "0 20px 40px -20px rgba(43, 35, 32, 0.18)",
      },
      rotate: {
        "1.5": "1.5deg",
        "-1.5": "-1.5deg",
      },
    },
  },
  plugins: [],
};
