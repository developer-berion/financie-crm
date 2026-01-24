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
      }
    },
  },
  plugins: [],
}

