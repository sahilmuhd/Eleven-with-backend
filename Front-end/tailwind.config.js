/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0C',
        chalk: '#F7F5F0',
        charcoal: '#1B1B1D',
        steel: '#C7CCD1',
        'steel-dim': '#8B9096',
        blue: '#2F6FED',
        gold: '#C9A368',
        line: 'rgba(247,245,240,0.12)',
      },
      fontFamily: {
        display: ["'Bebas Neue'", 'sans-serif'],
        body: ["'Inter'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
}
