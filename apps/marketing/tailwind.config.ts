import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SoldDirect. brand — navy card + speech-bubble green from the logo
        navy: { DEFAULT: '#1A2238', 950: '#131A2C' },
        brand: {
          50: '#EEF7EE',
          100: '#DCEFDD',
          200: '#C8E6C9',
          300: '#A5D6A7',
          400: '#81C784',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
          950: '#0F3D13',
        },
      },
    },
  },
  plugins: [],
};

export default config;
