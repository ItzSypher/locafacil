import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'
import LocagoraMark from './LocagoraMark'
/* Os assuntos, o número e o link vivem em `src/config/atendimento.js`: a
   página de documentação do marketing mostra as mesmas frases para revisão,
   e duas cópias do texto que o cliente manda envelheceriam em ritmos
   diferentes. */
import { ASSUNTOS, linkWhatsApp } from '../../config/atendimento'

function IconeWhatsApp({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

/**
 * Atalho de atendimento.
 *
 * Antes isto era um chat por IA: o `MicroAgent` conversava com o Gemini
 * através de `api/agent-chat.js`. A conversa acabava sempre no mesmo lugar —
 * "me chama no WhatsApp" — e no caminho custava uma chave de API para manter,
 * rotacionar e pagar.
 *
 * Aqui o atalho é o produto: seis assuntos escritos, e quem toca cai no
 * WhatsApp com a frase já na caixa de texto. Zero credencial, zero servidor,
 * zero resposta inventada — e a pessoa do outro lado já recebe a conversa
 * sabendo do que se trata.
 */
export default function FaleConosco() {
  const [aberto, setAberto] = useState(false)
  const [balaoVisivel, setBalaoVisivel] = useState(false)

  const fabRef = useRef(null)
  const estavaAbertoRef = useRef(false)
  const panelRef = useDialog(aberto, () => setAberto(false))

  const { pathname } = useLocation()
  const noCheckout = pathname.startsWith('/reservar')

  /* O botão flutuante é desmontado enquanto o painel está aberto, então o
     diálogo não tem para onde devolver o foco ao fechar. Aqui ele volta para o
     botão recriado — sem isso o teclado recomeça do topo da página. */
  useEffect(() => {
    if (aberto) {
      estavaAbertoRef.current = true
      return
    }
    if (estavaAbertoRef.current) {
      estavaAbertoRef.current = false
      fabRef.current?.focus()
    }
  }, [aberto])

  useEffect(() => {
    // Dentro da reserva o balão cobre preço e CTA: o atalho continua
    // disponível pelo botão, mas não se convida sozinho.
    if (noCheckout) {
      setBalaoVisivel(false)
      return undefined
    }
    const timer = setTimeout(() => setBalaoVisivel(true), 4000)
    return () => clearTimeout(timer)
  }, [noCheckout])

  const saudacao = 'Olá! Quer falar com a gente pelo WhatsApp?'

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end">
      <AnimatePresence>
        {balaoVisivel && !aberto && (
          <motion.div
            key="balao-atendimento"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="on-light bg-white text-text-dark type-meta p-4 rounded-2xl shadow-xl mb-4 relative max-w-[250px]"
          >
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45" />
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-success" />
              <strong className="text-brand-accent font-bold">Locafacil</strong>
            </div>
            {saudacao}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(true)}
                className="flex-1 bg-brand-accent text-white type-label h-11 rounded-lg hover:bg-brand-glow transition-colors cursor-pointer"
              >
                Quero falar
              </button>
              <button
                type="button"
                onClick={() => setBalaoVisivel(false)}
                aria-label="Dispensar mensagem"
                className="w-11 h-11 flex items-center justify-center bg-surface-muted text-text-muted rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sem AnimatePresence de propósito: a saída animada deixava o painel no
          DOM depois de fechado — invisível, mas ainda tabulável e ainda
          anunciado como diálogo. Fechar é instantâneo; abrir continua animado. */}
      {aberto && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="atendimento-titulo"
          tabIndex={-1}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="on-light bg-white w-[300px] sm:w-[360px] rounded-2xl shadow-2xl overflow-hidden mb-4 flex flex-col max-h-[80vh] focus:outline-none"
        >
          <div className="bg-brand-dark p-4 flex items-center gap-4 relative shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl pointer-events-none" />
            <LocagoraMark className="w-12 h-12 border-2 border-brand-accent relative" />
            <div className="flex-1 z-10">
              <h2 id="atendimento-titulo" className="type-subtitle text-white">Fale com a Locafacil</h2>
              <p className="type-meta text-text-secondary">Atendimento pelo WhatsApp</p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="text-white/60 hover:text-white transition-colors cursor-pointer z-10 w-11 h-11 flex items-center justify-center -mr-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 bg-surface-light overflow-y-auto">
            <p className="type-meta text-text-muted mb-3">
              Escolha o assunto. A mensagem já vai escrita.
            </p>

            <ul className="space-y-2">
              {ASSUNTOS.map((assunto) => (
                <li key={assunto.rotulo}>
                  <a
                    href={linkWhatsApp(assunto.frase)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAberto(false)}
                    className="group flex items-center gap-3 w-full bg-white border border-line rounded-xl p-3 text-left hover:border-brand-accent transition-colors cursor-pointer"
                  >
                    <IconeWhatsApp className="w-5 h-5 shrink-0 text-brand-whatsapp" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-text-dark">{assunto.rotulo}</span>
                      <span className="block type-meta text-text-muted">{assunto.detalhe}</span>
                    </span>
                    <svg
                      className="w-4 h-4 shrink-0 text-text-muted group-hover:text-brand-accent transition-colors"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quem prefere não falar com ninguém reserva sozinho. */}
          <div className="p-3 bg-white border-t border-line-soft shrink-0">
            <a
              href="tel:+552127861404"
              className="flex items-center justify-center gap-2 w-full type-meta type-numeric text-text-muted hover:text-brand-accent transition-colors cursor-pointer min-h-11"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Prefere telefone? (21) 2786-1404
            </a>
          </div>
        </motion.div>
      )}

      {!aberto && (
        <motion.button
          ref={fabRef}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setAberto(true)
            setBalaoVisivel(false)
          }}
          aria-label="Falar com a Locafacil"
          className="w-16 h-16 rounded-full shadow-2xl relative cursor-pointer"
        >
          <LocagoraMark className="w-full h-full border-4 border-white relative z-10" simboloClassName="w-[42%]" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-success border-2 border-white rounded-full z-20" />
        </motion.button>
      )}
    </div>
  )
}
