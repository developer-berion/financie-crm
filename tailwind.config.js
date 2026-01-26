/** @type {import('tailwindcss').Config} */
// Force reload
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#f6c71e',
        'text-main': '#414042',
        'background-light': '#ffffff',
        'background-dark': '#0f171a',
        'deep-teal': '#19272b',
        'deep-teal-dark': '#0d1417',
        // New Brand Colors (Extracted from financiegroup.com)
        'brand-primary': '#19272B', // Deep Teal/Charcoal Main Brand Color
        'brand-secondary': '#414042', // Button Background
        'brand-accent': '#F6C71E', // Gold Accent
        'brand-bg': '#F5F7FA',
        'brand-text': '#20282D',
        'brand-border': '#E3E7EF',
      }
    },
  },
  plugins: [],
}

