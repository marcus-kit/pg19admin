export default {
  // Content — только app/, там всё (components, pages, layouts)
  content: [
    './app/**/*.{vue,js,ts}',
  ],

  // Safelist для классов, используемых в computed properties
  safelist: [
    'bg-gradient-to-r',
    'from-primary',
    'to-secondary',
    'shadow-primary/30',
    'shadow-primary/40',
    'shadow-accent/30',
    'shadow-accent/40',
    'text-white',
    'bg-accent',
    'bg-red-600',
    'hover:bg-red-700',
    'hover:bg-accent/90',
    'focus:ring-primary',
    'focus:ring-accent',
    'focus:ring-red-500',
    'focus:ring-primary/20',
  ],

  theme: {
    extend: {
      // Цветовая палитра бренда
      colors: {
        primary: {
          DEFAULT: '#F7941D',
          50: '#FEF3E6',
          100: '#FDE7CD',
          200: '#FBCF9B',
          300: '#F9B769',
          400: '#F8A543',
          500: '#F7941D',
          600: '#D67A0A',
          700: '#A45E08',
          800: '#724106',
          900: '#402504',
        },
        secondary: {
          DEFAULT: '#E91E8C',
          50: '#FCE8F4',
          100: '#F9D1E9',
          200: '#F3A3D3',
          300: '#ED75BD',
          400: '#EB49A4',
          500: '#E91E8C',
          600: '#C4146F',
          700: '#930F53',
          800: '#620A37',
          900: '#31051C',
        },
        accent: {
          DEFAULT: '#00A651',
          50: '#E6F7EE',
          100: '#CCEFDD',
          200: '#99DFBB',
          300: '#66CF99',
          400: '#33BF77',
          500: '#00A651',
          600: '#008541',
          700: '#006431',
          800: '#004321',
          900: '#002110',
        },
        info: {
          DEFAULT: '#0054A6',
          50: '#E6EEF7',
          100: '#CCDEF0',
          200: '#99BDE1',
          300: '#669CD2',
          400: '#337BC3',
          500: '#0054A6',
          600: '#004385',
          700: '#003264',
          800: '#002243',
          900: '#001121',
        },
      },

      // Шрифт
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
}
