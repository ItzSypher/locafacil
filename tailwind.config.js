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
          /* Verde do WhatsApp: cor de terceiro, não da marca. Fica nomeada
             para nunca mais aparecer como hex solto no meio do JSX. */
          whatsapp: '#25D366',
          'whatsapp-hover': '#1EBD5B',
          /* Cores do Manual de Identidade Visual (fev/2025). Existem para o
             logotipo e para superfícies que representam a marca — nunca para
             sinalizar ação: quem é clicável continua sendo `accent`.
             `leaf` dá ~1.6:1 sobre branco e por isso nunca carrega texto. */
          brand: '#0628DA',
          leaf: '#2AE82A',
          stone: '#939598',
          ink: '#424245',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          dark: '#1E293B',
          muted: '#64748B',
        },
        /* Superfícies e linhas do lado claro do site. Existiam como slate-*
           espalhado; agora têm nome e um lugar só para mudar. */
        surface: {
          light: '#F8FAFC',
          muted: '#F1F5F9',
          sunken: '#E2E8F0',
        },
        line: {
          DEFAULT: '#E2E8F0',
          soft: '#F1F5F9',
        },
        /* Estado. O erro tem duas faces porque o site tem dois fundos. */
        state: {
          error: '#DC2626',
          'error-soft': '#FEF2F2',
          'error-line': '#FECACA',
          'error-dark': '#FCA5A5',
          'success-soft': '#ECFDF5',
        },
      },
      /* Archivo variável — uma família, dois eixos. A voz de display vem da
         largura (font-stretch), não de uma segunda fonte; por isso `display`
         e `sans` apontam para a mesma pilha e os papéis moram em global.css. */
      fontFamily: {
        sans: ['Archivo', 'Archivo Fallback', 'system-ui', '-apple-system', 'sans-serif'],
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