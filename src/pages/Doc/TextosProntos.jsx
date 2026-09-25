import { useState } from 'react'
import { TEXTOS } from '../../content/documentacao'
import { BotaoCopiar } from './Pecas'
import { ehImpressao } from './modoImpressao'

const CANAIS = ['Todos', 'E-mail', 'WhatsApp']

/**
 * Textos prontos para enviar, com botão de copiar.
 *
 * Eles vivem no código da página, e não num arquivo de documentação, por um
 * motivo prático: texto que se copia da tela não pode ter uma segunda cópia
 * noutro lugar, senão uma das duas envelhece e alguém manda a antiga.
 *
 * Fechados por padrão. São seis textos longos; abertos de uma vez, a seção
 * empurra o resto da página para longe.
 */
export default function TextosProntos() {
  const impressao = ehImpressao()
  const [canal, setCanal] = useState('Todos')
  const [aberto, setAberto] = useState(null)

  const lista = canal === 'Todos' ? TEXTOS : TEXTOS.filter((texto) => texto.canal === canal)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        {CANAIS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setCanal(opcao)}
            aria-pressed={canal === opcao}
            className={`min-h-11 px-4 rounded-xl type-label transition-colors cursor-pointer border ${
              canal === opcao
                ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                : 'border-line text-text-muted hover:text-text-dark'
            }`}
          >
            {opcao}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {lista.map((texto) => {
          const estaAberto = impressao || aberto === texto.id
          return (
            <article key={texto.id} className="rounded-2xl border border-line bg-white overflow-hidden print:break-inside-avoid">
              <button
                type="button"
                onClick={() => setAberto(estaAberto ? null : texto.id)}
                aria-expanded={estaAberto}
                className="w-full min-h-11 p-5 sm:p-6 flex items-start justify-between gap-4 text-left cursor-pointer"
                disabled={impressao}
              >
                <span>
                  <span className="type-label text-brand-accent">{texto.canal}</span>
                  <span className="type-subtitle text-text-dark block mt-1">{texto.titulo}</span>
                  <span className="type-meta text-text-muted block mt-1">{texto.quando}</span>
                </span>
                <svg
                  className={`w-5 h-5 shrink-0 mt-1 text-text-muted transition-transform print:hidden ${estaAberto ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {estaAberto && (
                <div className="px-5 sm:px-6 pb-6">
                  {texto.assunto && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-light border border-line px-4 py-3 mb-4">
                      <p className="type-body text-text-dark">
                        <span className="type-label text-text-muted mr-2">Assunto</span>
                        {texto.assunto}
                      </p>
                      <BotaoCopiar texto={texto.assunto} rotulo="Copiar assunto" />
                    </div>
                  )}

                  <pre className="type-body text-text-dark whitespace-pre-wrap font-sans rounded-xl bg-surface-light border border-line p-4 sm:p-5">
                    {texto.corpo}
                  </pre>

                  <div className="mt-4">
                    <BotaoCopiar texto={texto.corpo} rotulo="Copiar mensagem" />
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
