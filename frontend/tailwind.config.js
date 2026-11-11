/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090D16',
          card: '#0F172A',
          subtle: '#1E293B',
          border: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8'
        },
        brand: {
          cyan: '#06B6D4',
          sky: '#38BDF8',
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
