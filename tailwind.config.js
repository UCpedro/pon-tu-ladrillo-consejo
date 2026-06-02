/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tp: {
          // Colores oficiales Trabajo País
          blue: '#1B5BB6',
          'blue-dark': '#134285',
          'blue-darker': '#0E325F',
          'blue-soft': '#E1ECF8',
          red: '#D6312A',
          'red-dark': '#A91F1B',
          'red-soft': '#FBE5E3',
          cream: '#FBF7EF',
          paper: '#FFFDF7',
          wood: '#c9a06a',
          'wood-dark': '#8b6741',
          'wood-light': '#e7cfa9',
          earth: '#a67c52',
          'earth-dark': '#6b4423',
          zinc: '#a9b3bd',
          'zinc-dark': '#5b6772',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'tp-card': '0 12px 30px -12px rgba(15, 23, 42, 0.18)',
        'tp-soft': '0 4px 14px -6px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        'tp-grain':
          "radial-gradient(circle at 20% 20%, rgba(214,49,42,0.08), transparent 45%), radial-gradient(circle at 80% 30%, rgba(27,91,182,0.10), transparent 50%)",
      },
    },
  },
  plugins: [],
}
