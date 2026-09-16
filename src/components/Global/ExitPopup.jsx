import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExitPopup() {
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-dark bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer"
            >
              ✕
            </button>
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-accent to-brand-glow" />
            
            <div className="text-center relative z-10">
              <span className="inline-block bg-brand-accent/10 text-brand-accent font-bold px-4 py-1.5 rounded-full mb-6 text-sm">
                ESPERE UM SEGUNDO!
              </span>
              <h2 className="text-3xl font-black text-text-dark mb-4 leading-tight">
                Não feche essa página antes de ver isso.
              </h2>
              <p className="text-text-muted text-lg mb-8">
                Garantimos a melhor condição para você fechar negócio <strong className="text-brand-accent">hoje</strong>. Sem caução, seguro incluso e liberação expressa. Fale com nossos consultores agora e receba um benefício exclusivo.
              </p>
              
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Fui%20surpreendido%20com%20uma%20condi%C3%A7%C3%A3o%20especial%20no%20site." target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-lg py-4 rounded-xl transition-colors cursor-pointer"
                  onClick={() => setShow(false)}
                >
                  Resgatar Condição Especial →
                </motion.button>
              </a>
              <button 
                onClick={() => setShow(false)} 
                className="mt-5 text-sm text-text-muted hover:underline cursor-pointer"
              >
                Não, prefiro perder essa oportunidade
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
