import type { Config } from 'tailwindcss';

/**
 * Theming strategy: semantic colors are driven by CSS variables (see app/globals.css)
 * so the global theme (claro / escuro / corporativo dourado TRK) can be swapped at runtime.
 * Owner/type palette colors are fixed brand tokens used by node cards.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware tokens
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        // Fixed brand palette per owner / node type
        brand: {
          rafael: '#3b82f6', // azul claro — Rafael / Ativus
          tarik: '#ef4444', // vermelho claro — Tárik / Gibraltar
          sociedade: '#22c55e', // verde — imóveis em sociedade
          operacional: '#eab308', // amarelo — operacionais em sociedade
          patrimonial: '#9ca3af', // cinza — patrimoniais em sociedade
          pessoa: '#14b8a6', // teal — pessoas / cônjuges
          gold: '#caa24a', // dourado TRK
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.06), 0 4px 16px rgb(0 0 0 / 0.08)',
        'card-hover': '0 2px 4px rgb(0 0 0 / 0.10), 0 12px 32px rgb(0 0 0 / 0.16)',
        glow: '0 0 0 2px rgb(var(--accent) / 0.6), 0 0 24px rgb(var(--accent) / 0.35)',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0.5)' },
          '50%': { boxShadow: '0 0 0 6px rgb(var(--accent) / 0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
