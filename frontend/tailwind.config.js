/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,html}"
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          darkblue: '#232F3E',
          lightblue: '#146EB4',
        }
      },
      fontFamily: {
        'amazon': ['Amazon Ember', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
