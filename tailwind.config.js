/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#F2EEE6',
        paper: '#F8F5EE',
        ink: '#1A1B18',
        forest: '#17251C',
        'forest-deep': '#0E1811',
        sand: '#D6C8B4',
        clay: '#A57E56',
        muted: '#7C776B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        editorial: ['"Fraunces Variable"', 'serif'],
        sans: ['Jost', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.32em',
        widest3: '0.48em',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
