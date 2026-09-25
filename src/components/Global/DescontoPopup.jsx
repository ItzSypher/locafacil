import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'
import LocagoraMark from './LocagoraMark'

const FRASE = 'Olá! Vim pelo site e quero saber do desconto no primeiro aluguel.'
const WHATSAPP = `https://api.whatsapp.com/send?phone=5521968540185&text=${encodeURIComponent(FRASE)}`

const CHAVE_DISPENSA = 'locafacil_desconto_dispensado'

/* Leitura defensiva: em aba anônima o acesso ao storage pode estourar, e um
   convite de desconto não é motivo para derrubar a página. */
function foiDispensado() {
  try {
    return sessionStorage.getItem(CHAVE_DISPENSA) === 'true'
  } catch {
    return false
  }
}

/**
 * Convite do desconto de primeira locação.
 *
 * Era um formulário de captação pedindo nome e e-mail, e depois mandava a
 * pessoa para o WhatsApp de qualquer jeito: dois passos para chegar no mesmo
 * lugar, e um cadastro que ninguém lia. Agora a oferta e a ação estão na mesma
 * tela — quem quer o desconto abre a conversa já escrita.
 *
 * Havia também um segundo popup, disparado quando o ponteiro saía pelo topo da
 * janela. Dois convites na mesma visita é um a mais do que a página aguenta, e
 * o de saída não tinha nada a dizer que este já não diga.
 *
 * A dispensa é lida uma vez, para o estado inicial. Ela já foi um `return
 * null` no meio do render, e aquilo travou a rolagem do site inteiro: o
 * componente sumia da tela, mas o temporizador continuava correndo e o
 * `useDialog` bloqueava a página por um diálogo que não estava renderizado.
 *
 * Invariante do useDialog: o `open` passado ao hook tem de ser a mesma
 * condição que renderiza o painel.
 */
export default function DescontoPopup() {
  const [mostrar, setMostrar] = useState(false)
  const [dispensado, setDispensado] = useState(foiDispensado)

  const aberto = mostrar && !dispensado

  const fechar = () => {
    try {
      sessionStorage.setItem(CHAVE_DISPENSA, 'true')
    } catch {
      // Sem storage o convite volta na próxima página; é o mal menor.
    }
    setDispensado(true)
    setMostrar(false)
  }

  const panelRef = useDialog(aberto, fechar)

  useEffect(() => {
    if (dispensado) return undefined
    const timer = setTimeout(() => setMostrar(true), 1500)
    return () => clearTimeout(timer)
  }, [dispensado])

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          key="popup-desconto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9995] bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={fechar}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="desconto-titulo"
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="on-light bg-white rounded-2xl w-full max-w-md p-7 sm:p-9 text-center relative focus:outline-none"
          >
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <LocagoraMark className="w-16 h-16 mx-auto mb-5" simboloClassName="w-[44%]" />

            <h2 id="desconto-titulo" className="type-title text-text-dark text-balance">
              Quer um desconto no primeiro aluguel?
            </h2>

            <p className="type-body text-text-muted mt-3 mb-7 text-balance">
              Faz contato com a gente. A equipe confere a condição para o seu período e
              fecha com você na hora.
            </p>

            <motion.a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              onClick={fechar}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 w-full bg-brand-whatsapp hover:bg-brand-whatsapp-hover text-white font-semibold py-4 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Falar no WhatsApp
            </motion.a>

            <button
              type="button"
              onClick={fechar}
              className="type-meta text-text-muted hover:text-text-dark transition-colors cursor-pointer mt-4 min-h-11 w-full"
            >
              Agora não
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
