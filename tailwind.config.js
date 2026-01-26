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
        'divider': '#d9d9d9',
        // New Brand Colors
        'brand-primary': '#0A2A5E',
        'brand-secondary': '#1F6AE1',
        'brand-accent': '#F4C430',
        'brand-bg': '#F5F7FA',
        'brand-text': '#0B1220',
        'brand-border': '#E3E7EF',
      }
    },
  },
  plugins: [],
}

