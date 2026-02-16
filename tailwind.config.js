/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Indigo-600
        secondary: "#10B981", // Emerald-500
        background: "#F3F4F6", // Gray-100
      }
    },
  },
  plugins: [],
};