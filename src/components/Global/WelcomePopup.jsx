import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WelcomePopup() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Check if we already have the lead
    const lead = localStorage.getItem('locafacil_lead')
    if (!lead) {
      // Show the popup shortly after entering
      const timer = setTimeout(() => {
        setShow(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name && email) {
      localStorage.setItem('locafacil_lead', JSON.stringify({ name, email }))
      // Dispatch custom event to notify other components (like MicroAgent)
      window.dispatchEvent(new Event('lead_captured'))
      setSubmitted(true)
      setTimeout(() => setShow(false), 2000)
    }
  }

  const handleClose = () => {
    // If user closes, we might not want to bother them again this session
    sessionStorage.setItem('locafacil_lead_dismissed', 'true')
    setShow(false)
  }

  // If user has dismissed in this session, don't show
  if (sessionStorage.getItem('locafacil_lead_dismissed')) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9995] bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-text-muted hover:text-text-dark bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20 cursor-pointer"
            >
              ✕
            </button>
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-accent to-brand-glow" />
            
            <div className="text-center relative z-10">
              {!submitted ? (
                <>
                  <span className="inline-block bg-brand-gold/10 text-brand-gold font-bold px-4 py-1.5 rounded-full mb-6 text-xs uppercase tracking-wider">
                    Condição Exclusiva
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-dark mb-4 leading-tight tracking-tight">
                    Desbloqueie <span className="text-brand-accent">Zero Caução</span>
                  </h2>
                  <p className="text-text-muted text-sm sm:text-base mb-8">
                    Informe seus dados abaixo para acessar nossas ofertas premium com aprovação acelerada e sem franquia.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-text-secondary text-xs font-bold mb-1.5 uppercase tracking-wider">Seu Nome</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como podemos te chamar?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-text-dark text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-xs font-bold mb-1.5 uppercase tracking-wider">E-mail</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.melhor@email.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-text-dark text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-base py-4 rounded-xl transition-colors cursor-pointer mt-2"
                    >
                      Acessar Condições Premium →
                    </motion.button>
                  </form>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-text-dark mb-2">Tudo Certo, {name.split(' ')[0]}!</h2>
                  <p className="text-text-muted">Suas condições exclusivas foram liberadas no site. Nosso assistente já está pronto para te ajudar.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
