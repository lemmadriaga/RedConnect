/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Ensure this includes your component files
  ],
  darkMode: "class", // <-- ADD THIS LINE
  theme: {
    extend: {
      colors: {
        darkBackground: "#1a1a2e",
        darkText: "#e0e0e0",
        lightBackground: "#ffffff",
        lightText: "#000000",
        redDark: "#F97071",
      },
    },
  },
  plugins: [],
};
