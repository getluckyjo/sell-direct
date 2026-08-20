import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SoldDirect. brand — exact values sampled from the master artwork
        // (SoldDirect.ai): navy #0B172B, bubble green #36B44A. See DESIGN.md.
        navy: { DEFAULT: '#0B172B', 950: '#060D1A' },
        brand: {
          50: '#EAF7EC',
          100: '#D3EFD9',
          200: '#ABE2B6',
          300: '#82D492',
          400: '#57C468',
          500: '#36B44A', // the logo bubble green
          600: '#2C9940', // CTA surface — white text ≥ 3:1
          700: '#27873A', // links / small text on white ≥ 4.5:1
          800: '#217A32',
          900: '#1E6E2E',
          950: '#0F3D1A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
