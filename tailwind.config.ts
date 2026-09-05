import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#011D48',
          light: '#0A2E63',
          dark: '#01142F',
        },
        gold: {
          DEFAULT: '#B08D57',
          bright: '#D4AF37',
          soft: '#C9A96E',
        },
        cream: '#F7F5F0',
        warmgrey: '#EFEDE8',
        charcoal: '#2B2B2B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
