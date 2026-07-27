import type { Config } from 'tailwindcss';

// Palette is a ledger: paper stock, ink, a pine primary and a brass signal for anything
// that needs a person's attention. No blue-violet SaaS default anywhere.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F4F0',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#16181D',
          muted: '#6E6A62',
          faint: '#9C978D',
        },
        line: {
          DEFAULT: '#E3E1DA',
          strong: '#CFCCC2',
        },
        pine: {
          DEFAULT: '#1F6F5C',
          dark: '#175547',
          soft: '#E4EFEB',
        },
        brass: {
          DEFAULT: '#A9761F',
          soft: '#F6EEDD',
        },
        clay: {
          DEFAULT: '#A73A2E',
          soft: '#F7E7E4',
        },
        sky: {
          DEFAULT: '#31607F',
          soft: '#E5EDF3',
        },
        slate: {
          DEFAULT: '#5A5F6B',
          soft: '#ECEDEF',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '5px',
        md: '6px',
        lg: '9px',
        xl: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 24, 29, 0.05), 0 1px 1px rgba(22, 24, 29, 0.03)',
        lift: '0 8px 24px -8px rgba(22, 24, 29, 0.18), 0 2px 6px rgba(22, 24, 29, 0.06)',
        pop: '0 16px 40px -12px rgba(22, 24, 29, 0.28)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.98)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 160ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
