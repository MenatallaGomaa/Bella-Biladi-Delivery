/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { 
    extend: {
      screens: {
        'xs': '375px', // Extra small devices (phones in portrait)
      },
    } 
  },
  plugins: [],
};
