/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm cream backgrounds
        cream: {
          50:  '#FDFAF6',
          100: '#FAF7F2',
          200: '#F5EDE0',
          300: '#EDD9C5',
        },
        // Coffee / brown
        coffee: {
          50:  '#F5EDE7',
          100: '#E8C9B8',
          200: '#C1825A',
          300: '#8B5A3A',
          400: '#6B3A2A',
          500: '#4D2416',
          600: '#3D1F14',
          700: '#2C1810',
        },
        // Pastel orange / peach
        peach: {
          50:  '#FEF5EF',
          100: '#FBDEC8',
          200: '#F5B98A',
          300: '#E8956D',
          400: '#D4784E',
          500: '#C1633A',
          600: '#A84E2B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(61, 31, 20, 0.07)',
        'card-hover': '0 4px 20px 0 rgba(61, 31, 20, 0.12)',
      },
    },
  },
  plugins: [],
}
