import { useMemo, useState } from 'react'
import { ROTEIRO, O_QUE_ANOTAR, SITE } from '../../content/documentacao'
import { useArmazenamento } from './hooks'
import { BotaoCopiar } from './Pecas'
import { ehImpressao } from './modoImpressao'

/**
 * Roteiro de homologação com marcação e anotação.
 *
 * A página não é só leitura: é o instrumento do retorno. Quem confere marca o
 * passo e escreve ali mesmo o que incomodou; no fim, um botão monta o texto
 * pronto para mandar. Antes disso o caminho era ler um PDF, abrir o bloco de
 * notas e reconstruir de memória o que estava na página três.
 *
 * Tudo mora no navegador de quem lê — nada é enviado. O retorno só existe
 * quando a pessoa copia e manda.
 */
export default function Checklist({ publico }) {
  const impressao = ehImpressao()
  const [estado, setEstado] = useArmazenamento(`locafacil_doc_${publico}_roteiro`, {})
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)

  const feitos = ROTEIRO.filter((passo) => estado[passo.id]?.feito).length
  const comNota = ROTEIRO.filter((passo) => (estado[passo.id]?.nota ?? '').trim()).length

  const alternar = (id) =>
    setEstado((atual) => ({ ...atual, [id]: { ...atual[id], feito: !atual[id]?.feito } }))

  const anotar = (id, nota) =>
    setEstado((atual) => ({ ...atual, [id]: { ...atual[id], nota } }))

  const retorno = useMemo(() => {
    const linhas = [
      `Homologação do site da Locafácil — ${SITE.rotulo}`,
      `${feitos} de ${ROTEIRO.length} passos conferidos.`,
      '',
    ]
    ROTEIRO.forEach((passo, indice) => {
      const marca = estado[passo.id]?.feito ? '[x]' : '[ ]'
      const nota = (estado[passo.id]?.nota ?? '').trim()
      linhas.push(`${marca} ${indice + 1}. ${passo.titulo}`)
      if (nota) linhas.push(`    ${nota}`)
    })
    return linhas.join('\n')
  }, [estado, feitos])

  const progresso = Math.round((feitos / ROTEIRO.length) * 100)

  return (
    <div>
      {/* Barra de progresso: o número manda, a barra só ilustra. */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="type-subtitle text-text-dark">
            <span className="type-numeric">{feitos}</span> de{' '}
            <span className="type-numeric">{ROTEIRO.length}</span> passos conferidos
          </p>
          <p className="type-meta text-text-muted">
            {comNota > 0
              ? `${comNota} com observação`
              : 'Marque o que já conferiu e escreva o que incomodar'}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-surface-sunken mt-4 overflow-hidden">
          <div
            className="h-full bg-brand-accent transition-[width] duration-300"
            style={{ width: `${progresso}%` }}
            role="progressbar"
            aria-valuenow={feitos}
            aria-valuemin={0}
            aria-valuemax={ROTEIRO.length}
            aria-label="Passos conferidos"
          />
        </div>
      </div>

      <ol className="space-y-3">
        {ROTEIRO.map((passo, indice) => {
          const marcado = Boolean(estado[passo.id]?.feito)
          const nota = estado[passo.id]?.nota ?? ''
          return (
            <li
              key={passo.id}
              className={`rounded-2xl border bg-white p-5 transition-colors print:break-inside-avoid ${
                marcado ? 'border-brand-success/40' : 'border-line'
              }`}
            >
              <div className="flex gap-4">
                <label className="flex items-start gap-3 cursor-pointer min-h-11 grow">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(passo.id)}
                    className="w-5 h-5 mt-1 shrink-0 accent-brand-accent cursor-pointer"
                  />
                  <span>
                    <span className="type-subtitle text-text-dark block">
                      <span className="type-numeric text-text-muted mr-2">{indice + 1}.</span>
                      {passo.titulo}
                    </span>
                    <span className="type-body text-text-muted block mt-1">{passo.texto}</span>
                  </span>
                </label>
              </div>

              {/* No papel a caixa vazia é só uma moldura: só a observação
                  escrita continua valendo alguma coisa. */}
              {impressao ? (
                nota.trim() && (
                  <p className="type-body text-text-dark mt-4 rounded-xl bg-surface-light border border-line px-4 py-3">
                    {nota}
                  </p>
                )
              ) : (
                <label className="block mt-4">
                  <span className="sr-only">Observação sobre “{passo.titulo}”</span>
                  <textarea
                    value={nota}
                    onChange={(evento) => anotar(passo.id, evento.target.value)}
                    rows={nota ? 3 : 1}
                    placeholder="Alguma observação neste passo?"
                    className="w-full rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors resize-y"
                  />
                </label>
              )}
            </li>
          )
        })}
      </ol>

      <div className="rounded-2xl border border-line bg-surface-light p-5 sm:p-6 mt-6">
        <p className="type-label text-brand-accent mb-2">O que vale anotar</p>
        <ul className="type-body text-text-dark space-y-1.5 list-disc pl-5">
          {O_QUE_ANOTAR.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3 mt-6 print:hidden">
          <BotaoCopiar texto={retorno} rotulo="Copiar retorno para enviar" />
          {confirmandoLimpeza ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEstado({})
                  setConfirmandoLimpeza(false)
                }}
                className="min-h-11 px-4 rounded-xl border border-state-error/40 text-state-error hover:bg-state-error-soft transition-colors cursor-pointer type-label"
              >
                Apagar tudo mesmo
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoLimpeza(false)}
                className="min-h-11 px-4 type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoLimpeza(true)}
              className="min-h-11 px-4 type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
            >
              Limpar marcações
            </button>
          )}
        </div>

        <p className="type-meta text-text-muted mt-4 print:hidden">
          As marcações e as observações ficam salvas neste navegador e não são
          enviadas para ninguém. Use o botão de copiar para mandar o retorno.
        </p>
      </div>
    </div>
  )
}
