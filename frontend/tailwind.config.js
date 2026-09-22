/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#f2f9f4',
          100: '#e1f2e6',
          200: '#c5e5ce',
          300: '#99d2aa',
          400: '#66b880',
          500: '#3f9b5c',
          600: '#2f7d48',
          700: '#27633b',
          800: '#234f31',
          900: '#1e412a',
          950: '#0c2315',
        },
      },
    },
  },
  plugins: [],
};

