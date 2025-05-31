/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ivorian color scheme
        orange: {
          50: '#FFF8EB',
          100: '#FFEDD0',
          200: '#FFDCA0',
          300: '#FFCB70',
          400: '#FFBA41',
          500: '#FF9F1C', // Orange Taxi (primary)
          600: '#E87F00',
          700: '#B06200',
          800: '#7D4500',
          900: '#4A2900',
          950: '#2D1800',
        },
        teal: {
          50: '#EDFAF8',
          100: '#D5F3EF',
          200: '#AEE8DF',
          300: '#84DDCF',
          400: '#59D3BE',
          500: '#2EC4B6', // Vert Lagune (secondary)
          600: '#24A195',
          700: '#1C7D75',
          800: '#155A55',
          900: '#0E3734',
          950: '#082220',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #FF9F1C 0%, #2EC4B6 100%)',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};