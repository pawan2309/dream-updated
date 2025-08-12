/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme1': '#1a1a1a',
        'light-black-text': '#333333',
      },
      fontFamily: {
        'nunito': ['Nunito Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 