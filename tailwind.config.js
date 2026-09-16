/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* Paleta premium para locadora de veículos */
      colors: {
        brand: {
          dark: '#0A1628',
          navy: '#0F2240',
          deep: '#1E3A5F',
          accent: '#2563EB',
          glow: '#3B82F6',
          success: '#10B981',
          gold: '#F59E0B',
          surface: 'rgba(255,255,255,0.08)',
          'surface-hover': 'rgba(255,255,255,0.12)',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          dark: '#1E293B',
          muted: '#64748B',
        }
      },
      /* Tipografia Montserrat */
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
      },
      /* Sombras de contato: profundidade em superfície clara, onde o vidro não filtra nada */
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.12)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out forwards',
      },
      /* Backdrop blur para glassmorphism */
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}