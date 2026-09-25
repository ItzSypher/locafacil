import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'

/* Leitura defensiva: em aba anônima o acesso ao storage pode estourar, e um
   popup de captação não é motivo para derrubar a página. */
function foiDispensado() {
  try {
    return sessionStorage.getItem('locafacil_lead_dismissed') === 'true'
  } catch {
    return false
  }
}

export default function WelcomePopup() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  /* A dispensa é lida uma vez, para o estado inicial.
     Antes ela era um `return null` no meio do render. O componente sumia da
     tela, mas os hooks continuavam rodando: o temporizador disparava,
     `show` virava true e o `useDialog` travava a rolagem por um diálogo que
     não estava renderizado. Quem fechasse o popup sem preencher perdia a
     rolagem do site inteiro na página seguinte, sem nada na tela explicando.

     Invariante do useDialog: o `open` passado para o hook tem de ser a mesma
     condição que renderiza o painel. */
  const [dispensado] = useState(foiDispensado)
  const aberto = show && !dispensado

  const panelRef = useDialog(aberto, () => handleClose())

  useEffect(() => {
    if (dispensado) return undefined

    // Check if we already have the lead
    const lead = localStorage.getItem('locafacil_lead')
    if (lead) return undefined

    // Show the popup shortly after entering
    const timer = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(timer)
  }, [dispensado])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name && email) {
      localStorage.setItem('locafacil_lead', JSON.stringify({ name, email }))
      // Dispatch custom event to notify other components (like FaleConosco)
      window.dispatchEvent(new Event('lead_captured'))
      setSubmitted(true)
      setTimeout(() => setShow(false), 2000)
    }
  }

  const handleClose = () => {
    // If user closes, we might not want to bother them again this session
    try {
      sessionStorage.setItem('locafacil_lead_dismissed', 'true')
    } catch {
      // Sem storage o popup volta na próxima página; é o mal menor.
    }
    setShow(false)
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          key="welcome-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9995] bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-popup-titulo"
            tabIndex={-1}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="on-light bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden focus:outline-none"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute top-2 right-2 text-text-muted hover:text-text-dark w-11 h-11 rounded-full flex items-center justify-center transition-colors z-20 cursor-pointer hover:bg-surface-muted"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-accent to-brand-glow" />
            
            <div className="text-center relative z-10">
              {!submitted ? (
                <>
                  <h2 id="welcome-popup-titulo" className="type-title text-text-dark mb-4 text-balance">
                    Desbloqueie <span className="text-brand-accent">Zero Caução</span>
                  </h2>
                  <p className="type-body text-text-muted mb-8">
                    Informe seus dados abaixo para acessar nossas ofertas premium com aprovação acelerada e sem franquia.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block type-label text-text-muted mb-2">Seu Nome</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como podemos te chamar?"
                        className="w-full bg-surface-light border border-line rounded-xl px-4 py-3 text-text-dark text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block type-label text-text-muted mb-2">E-mail</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.melhor@email.com"
                        className="w-full bg-surface-light border border-line rounded-xl px-4 py-3 text-text-dark text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-brand-accent hover:bg-brand-glow text-white font-semibold text-base py-4 rounded-xl transition-colors cursor-pointer mt-2"
                    >
                      Acessar Condições Premium →
                    </motion.button>
                  </form>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 bg-state-success-soft text-brand-success rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="type-title text-text-dark mb-2">Tudo certo, {name.split(' ')[0]}!</h2>
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
