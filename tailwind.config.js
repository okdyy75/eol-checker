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
        'eol-active': '#10b981',
        'eol-warning': '#f59e0b',
        'eol-expired': '#ef4444',
        'eol-lts': '#3b82f6',
      },
    },
  },
  plugins: [],
};