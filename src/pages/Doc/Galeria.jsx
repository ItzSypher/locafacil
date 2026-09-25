import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TELAS } from '../../content/documentacao'
import { useDialog } from '../../hooks/useDialog'
import { ehImpressao } from './modoImpressao'

/* Dimensões dos arquivos gerados por `scripts/telas-doc.mjs`. Ficam aqui para
   que o navegador reserve o espaço antes da imagem chegar — sem isso a página
   pula quatro vezes enquanto as telas carregam. */
const MEDIDAS = {
  desktop: { width: 1400, height: 875 },
  celular: { width: 780, height: 1688 },
}

function Ampliada({ tela, formato, aoFechar }) {
  const painelRef = useDialog(Boolean(tela), aoFechar)
  if (!tela || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9996] bg-brand-dark/90 backdrop-blur-md p-4 sm:p-8 overflow-auto"
      onClick={aoFechar}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${tela.titulo} — ${formato === 'desktop' ? 'computador' : 'celular'}`}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        className="mx-auto w-fit max-w-full focus:outline-none"
      >
        <img
          src={tela[formato]}
          alt={`${tela.titulo} no ${formato === 'desktop' ? 'computador' : 'celular'}`}
          className="rounded-xl shadow-glass max-w-full h-auto"
          {...MEDIDAS[formato]}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <p className="type-meta text-text-secondary">{tela.legenda}</p>
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-11 px-4 rounded-xl border border-white/20 text-text-primary hover:bg-white/10 transition-colors cursor-pointer type-label"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Galeria das telas do site.
 *
 * Um formato por vez, não os dois lado a lado: a captura de celular tem mais
 * que o dobro da altura da de computador, e emparelhadas a linha fica com um
 * vão enorme de um lado. O botão troca o conjunto inteiro, que é como a pessoa
 * olha — "como ficou no celular", não "como ficou a home no celular".
 *
 * Clicar amplia, porque em 700px de largura não dá para ler o texto de uma
 * tela de 1440. A ampliação é diálogo de verdade: Escape fecha, o foco volta.
 */
export default function Galeria() {
  const impressao = ehImpressao()
  const [formato, setFormato] = useState('desktop')
  const [ampliada, setAmpliada] = useState(null)

  /* No papel não há botão para trocar de formato: os dois conjuntos entram um
     depois do outro, com um título dizendo qual é qual. */
  if (impressao) {
    return (
      <div className="space-y-8">
        {[
          ['desktop', 'No computador'],
          ['celular', 'No celular'],
        ].map(([chave, rotulo]) => (
          <div key={chave}>
            <h3 className="type-subtitle text-text-dark mb-4">{rotulo}</h3>
            <div className={`grid gap-6 ${chave === 'celular' ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {TELAS.map((tela) => (
                <figure key={tela.id} className="print:break-inside-avoid">
                  <img
                    src={tela[chave]}
                    alt={`${tela.titulo} ${rotulo.toLowerCase()}`}
                    className="w-full h-auto block rounded-xl border border-line"
                    {...MEDIDAS[chave]}
                  />
                  <figcaption className="mt-2">
                    <span className="type-meta text-text-dark font-semibold block">{tela.titulo}</span>
                    {chave === 'desktop' && (
                      <span className="type-meta text-text-muted block">{tela.legenda}</span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div
        className="inline-flex p-1 rounded-xl bg-surface-muted mb-6"
        role="group"
        aria-label="Formato das capturas"
      >
        {[
          ['desktop', 'Computador'],
          ['celular', 'Celular'],
        ].map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setFormato(chave)}
            aria-pressed={formato === chave}
            className={`min-h-11 px-5 rounded-lg type-label transition-colors cursor-pointer ${
              formato === chave
                ? 'bg-white text-text-dark shadow-card'
                : 'text-text-muted hover:text-text-dark'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${formato === 'celular' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
        {TELAS.map((tela) => (
          <figure key={tela.id}>
            <button
              type="button"
              onClick={() => setAmpliada(tela)}
              className="block w-full rounded-xl overflow-hidden border border-line bg-white cursor-pointer hover:border-brand-accent transition-colors"
            >
              <img
                src={tela[formato]}
                alt={`${tela.titulo} no ${formato === 'desktop' ? 'computador' : 'celular'}`}
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
                {...MEDIDAS[formato]}
              />
            </button>
            <figcaption className="mt-3">
              <span className="type-subtitle text-text-dark block">{tela.titulo}</span>
              <span className="type-meta text-text-muted block mt-1">{tela.legenda}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <Ampliada tela={ampliada} formato={formato} aoFechar={() => setAmpliada(null)} />
    </div>
  )
}
