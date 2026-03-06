/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f1219',
          surface: '#1a1f2e',
          border: '#2a3040',
          hover: '#252b3d',
          text: '#e2e8f0',
          muted: '#8892a8',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
          purple: '#a855f7',
          gold: '#d4a017',
        },
      },
    },
  },
  plugins: [],
};
