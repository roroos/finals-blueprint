/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        finals: {
          bg: '#0b0c0f',
          panel: '#14161b',
          panelLight: '#1c1f26',
          border: '#2a2e38',
          text: '#e7e9ee',
          muted: '#9aa1ad',
          cash: '#f5c518', // cash yellow
          good: '#34d399',
          warn: '#f59e0b',
          bad: '#f87171',
          accent: '#ef4444', // show red
        },
      },
      // Type scale: the only four sizes (variables in src/index.css, enforced by src/typeScale.test.ts)
      fontSize: {
        small: ['var(--text-small)', { lineHeight: '1rem' }],
        body: ['var(--text-body)', { lineHeight: '1rem' }],
        title: ['var(--text-title)', { lineHeight: '1.25rem' }],
        heading: ['var(--text-heading)', { lineHeight: '1.5rem' }],
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
