/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        marble: '#FDF6F4',
        aegean: '#EAF0F5',
        charcoal: '#2D3436',
        muted: '#636E72',
        terracotta: '#C4785A',
        olive: '#8B9A7B',
        gold: '#D4AF37',
        prosecco: '#FDF6F4',
        blush: '#E8A0BF',
        aperol: '#E8652B',
      },
      animation: {
        swirl: 'swirl 20s linear infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        swirl: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
