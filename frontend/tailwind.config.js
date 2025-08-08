/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './main.js',
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        // Amazon-like palette
        'amazon-orange': '#FF9900',
        'amazon-blue': '#146EB4',
        'amazon-dark': '#232F3E',
        'amazon-gold': '#FFD814'
      }
    },
  },
  plugins: [],
};
