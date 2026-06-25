/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0e1a',
        surface: '#111726',
        'surface-2': '#1a2236',
        'surface-3': '#222c44',
        border: '#232b40',
        'border-bright': '#33405e',
        text: '#e6ecf5',
        muted: '#8a95ad',
        'muted-2': '#5b6580',
        cyan: '#22d3ee',
        violet: '#a78bfa',
        pink: '#f472b6',
        emerald: '#34d399',
        amber: '#fbbf24',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.15), 0 8px 40px -8px rgba(34,211,238,0.25)',
        panel: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 20px 50px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        signal: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-signal': 'pulseSignal 2.4s ease-in-out infinite',
        'fade-up': 'fadeUp 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
