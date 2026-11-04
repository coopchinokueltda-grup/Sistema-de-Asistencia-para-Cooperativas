/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coop: {
          emerald: '#00A878',
          primary: '#008F68',
          dark: '#063D32',
          bg: '#071512',
          card: '#101E1A',
          surface: '#162720',
          border: '#203B30',
          text: '#F5F7F5',
          muted: '#A5B4AC',
          amber: '#F5B942',
          rose: '#EF5350',
          blue: '#0284c7',
          violet: '#4f46e5',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      }
    },
  },
  plugins: [],
};
