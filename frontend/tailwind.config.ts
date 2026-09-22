import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    // Only use semantic colors defined here, not generic color names
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      surface: {
        DEFAULT: 'var(--color-surface)',
        elevated: 'var(--color-surface-elevated)',
      },
      border: 'var(--color-border)',
      text: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
      },
      accent: {
        DEFAULT: 'var(--color-accent)',
        hover: 'var(--color-accent-hover)',
      },
      status: {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
      },
    },
    // Font scale - only 5 sizes
    fontSize: {
      sm: ['0.875rem', '1.25rem'],   // 14px
      base: ['1rem', '1.5rem'],      // 16px
      lg: ['1.125rem', '1.75rem'],   // 18px
      xl: ['1.5rem', '2rem'],        // 24px
      '2xl': ['2rem', '2.5rem'],     // 32px
    },
    // Font weights - only 2 weights
    fontWeight: {
      normal: '400',
      semibold: '600',
    },
    // Border radii constants
    borderRadius: {
      DEFAULT: '0.5rem', // 8px
      md: '0.75rem',     // 12px
      lg: '1rem',        // 16px
      full: '9999px',
    },
    // Discrete shadows
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
