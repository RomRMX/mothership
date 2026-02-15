/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505', // Absolute black
        foreground: '#FFFFFF', // Pure White
        surface: '#0A0A0A', // Slightly lighter black
        'card-border': 'rgba(255, 255, 255, 0.1)',
        primary: '#7c3aed', // Electric Violet
        secondary: '#00e5ff', // Cyan
        muted: '#52525b', // Zinc 600
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['"Climate Crisis"', 'cursive'],
      },
    },
  },
  plugins: [],
}
