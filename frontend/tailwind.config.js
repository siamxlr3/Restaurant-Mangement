/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#ffffff',
          card: '#fafafa',
        },
        ink: {
          DEFAULT: '#111827',
          panel: '#1f2937',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        'ticket-orange': '#ff5a1f',
        'ticket-orangeDim': '#fff5f2',
        'pass-green': '#10b981',
        'pass-greenDim': '#f0fdf4',
        'amber-signal': '#f59e0b',
        'rose-signal': '#f43f5e',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      borderRadius: {
        ticket: '12px',
      },
      boxShadow: {
        ticket: '0 4px 12px rgba(0, 0, 0, 0.05)',
        card: '0 2px 4px rgba(0, 0, 0, 0.02)',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
