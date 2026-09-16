import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'

export default function ExitPopup() {
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const panelRef = useDialog(show, () => setShow(false))

  useEffect(() => {
    const handleMouseLeave = (e) => {
      // Don't show if Welcome Popup is likely open or lead already captured
      const hasLead = localStorage.getItem('locafacil_lead')
      if (hasLead) return

      // Show when mouse leaves top of the window
      if (e.clientY <= 0 && !hasShown) {
        setShow(true)
        setHasShown(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [hasShown])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="exit-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-popup-titulo"
            tabIndex={-1}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="on-light bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden focus:outline-none"
          >
            <button
              type="button"
              onClick={() => setShow(false)}
              aria-label="Fechar"
              className="absolute top-2 right-2 text-text-muted hover:text-text-dark w-11 h-11 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer hover:bg-surface-muted"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-accent to-brand-glow" />
            
            <div className="text-center relative z-10">
              <h2 id="exit-popup-titulo" className="type-title text-text-dark mb-4 text-balance">
                Não feche essa página antes de ver isso.
              </h2>
              <p className="type-body text-text-muted text-lg mb-8 max-w-[45ch] mx-auto">
                Garantimos a melhor condição para você fechar negócio <strong className="text-brand-accent">hoje</strong>. Sem caução, seguro incluso e liberação expressa. Fale com nossos consultores agora e receba um benefício exclusivo.
              </p>
              
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Fui%20surpreendido%20com%20uma%20condi%C3%A7%C3%A3o%20especial%20no%20site." target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-brand-accent hover:bg-brand-glow text-white font-semibold text-lg py-4 rounded-xl transition-colors cursor-pointer"
                  onClick={() => setShow(false)}
                >
                  Falar com um consultor agora
                </motion.button>
              </a>
              <button 
                onClick={() => setShow(false)} 
                className="mt-5 type-meta text-text-muted hover:underline cursor-pointer"
              >
                Agora não, obrigado
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
