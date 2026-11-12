import type { Config } from 'tailwindcss';

const color = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: color('canvas'),
        surface: { DEFAULT: color('surface'), elevated: color('surface-elevated') },
        border: color('border'),
        text: { primary: color('text-primary'), secondary: color('text-secondary'), muted: color('text-muted') },
        accent: { DEFAULT: color('accent'), hover: color('accent-hover') },
        'on-accent': color('on-accent'),
        forest: '#173F32',
        sage: color('sage'),
        olive: color('olive'),
        terracotta: color('terracotta'),
        status: { success: color('success'), warning: color('warning'), danger: color('danger') },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], serif: ['Georgia', 'Times New Roman', 'serif'] },
      boxShadow: { soft: '0 12px 40px rgb(23 63 50 / 0.07)' },
    },
  },
  plugins: [],
} satisfies Config;
