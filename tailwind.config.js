/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: '#1C5FA8',
            dark: '#154880',
            darker: '#0D2E52',
          },
          yellow: {
            DEFAULT: '#FFC629',
            dark: '#E8A900',
          },
        },
        ink: {
          950: '#05070B',
          900: '#0A0E15',
          800: '#161D2C', // antes #0F1420 — un paso más claro para diferenciarse mejor del fondo
          700: '#232C3F', // subido un poco también, para mantener la distancia con el 800
          600: '#2E3850',
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
};