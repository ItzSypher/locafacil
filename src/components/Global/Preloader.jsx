import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Espera curta: a marca aparece por um instante e sai da frente. Uma tela de
// abertura longa custa a primeira impressão inteira em conexão lenta.
const HOLD_MS = 700

export default function Preloader() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), HOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-hero-gradient flex flex-col items-center justify-center"
          role="status"
          aria-label="Carregando"
        >
          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M19 17H21V11L18.4 6.7C18.1 6.3 17.6 6 17.1 6H6.9C6.4 6 5.9 6.3 5.6 6.7L3 11V17H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 17C8 18.1046 7.10457 19 6 19C4.89543 19 4 18.1046 4 17C4 15.8954 4.89543 15 6 15C7.10457 15 8 15.8954 8 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 17C20 18.1046 19.1046 19 18 19C16.8954 19 16 18.1046 16 17C16 15.8954 16.8954 15 18 15C19.1046 15 20 15.8954 20 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: HOLD_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
            className="h-0.5 w-40 bg-brand-accent mt-8 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
