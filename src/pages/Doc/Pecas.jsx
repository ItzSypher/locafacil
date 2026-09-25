import { useState } from 'react'
import { ESTADOS } from '../../content/documentacao'
import { useCopia } from './hooks'
import { ehImpressao } from './modoImpressao'

/* Peças de montagem das duas páginas de documentação. Nada aqui sabe de qual
   público é a página — quem escolhe é o arquivo que monta a seção. */

export function Secao({ id, numero, titulo, resumo, children }) {
  return (
    <section id={id} className="scroll-mt-28 mb-14 sm:mb-20 print:mb-10 print:break-inside-auto">
      <header className="mb-6">
        <div className="flex items-baseline gap-3">
          {numero != null && (
            <span className="type-numeric type-label text-brand-accent" aria-hidden="true">
              {String(numero).padStart(2, '0')}
            </span>
          )}
          <h2 className="type-title text-text-dark">{titulo}</h2>
        </div>
        {resumo && <p className="type-body text-text-muted mt-3 max-w-2xl">{resumo}</p>}
      </header>
      {children}
    </section>
  )
}

export function Selo({ estado }) {
  const { rotulo, classe } = ESTADOS[estado] ?? ESTADOS['a-fazer']
  return <span className={`type-label ${classe}`}>{rotulo}</span>
}

/**
 * Bloco de item com linhas rótulo/valor.
 *
 * Fechado por padrão quando `recolhivel`: a lista de pendências tem nove
 * itens e, aberta de uma vez, vira uma parede de texto que ninguém lê. O
 * título e o responsável ficam sempre visíveis — é o que a pessoa procura ao
 * varrer a lista.
 */
export function Cartao({ titulo, responsavel, linhas, recolhivel = false, destaque = false }) {
  // No papel não há o que clicar: tudo o que estaria recolhido nasce aberto.
  const impressao = ehImpressao()
  const [aberto, setAberto] = useState(!recolhivel || impressao)

  const cabeca = (
    <>
      <h3 className="type-subtitle text-text-dark text-left">{titulo}</h3>
      {responsavel && (
        <span className="type-label text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full whitespace-nowrap">
          {responsavel}
        </span>
      )}
    </>
  )

  return (
    <div
      className={`rounded-2xl border bg-white p-5 sm:p-6 print:break-inside-avoid ${
        destaque ? 'border-brand-accent/30 shadow-card' : 'border-line'
      }`}
    >
      {recolhivel && !impressao ? (
        <button
          type="button"
          onClick={() => setAberto((valor) => !valor)}
          aria-expanded={aberto}
          className="w-full min-h-11 flex items-center justify-between gap-4 cursor-pointer text-left"
        >
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">{cabeca}</span>
          <svg
            className={`w-5 h-5 shrink-0 text-text-muted transition-transform ${aberto ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">{cabeca}</div>
      )}

      {aberto && (
        <dl className="mt-4 space-y-3">
          {linhas.map(([rotulo, texto]) => (
            <div key={rotulo} className="sm:flex sm:gap-4">
              <dt className="type-label text-text-muted sm:w-40 sm:shrink-0 sm:pt-1">{rotulo}</dt>
              <dd className="type-body text-text-dark mt-1 sm:mt-0">{texto}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

/** Caixa de observação. Cabeçalho curto em cor, corpo em texto normal. */
export function Aviso({ titulo, children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-light p-5 sm:p-6 my-6 print:break-inside-avoid">
      <p className="type-label text-brand-accent mb-2">{titulo}</p>
      <div className="type-body text-text-dark space-y-3">{children}</div>
    </div>
  )
}

/**
 * Botão de copiar.
 *
 * O aviso de sucesso troca o próprio rótulo em vez de abrir um balão: o
 * feedback aparece onde o dedo acabou de tocar. Quando o navegador nega o
 * acesso à área de transferência — contexto inseguro, permissão recusada —, o
 * botão diz para selecionar à mão, em vez de fingir que copiou.
 */
export function BotaoCopiar({ texto, rotulo = 'Copiar', className = '' }) {
  const [copiar, copiado] = useCopia()
  const [falhou, setFalhou] = useState(false)

  const aoClicar = async () => {
    const deuCerto = await copiar(texto)
    setFalhou(!deuCerto)
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      className={`min-h-11 inline-flex items-center gap-2 px-4 rounded-xl border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 transition-colors cursor-pointer type-label print:hidden ${className}`}
    >
      {copiado ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 012-2h10" />
        </svg>
      )}
      {falhou ? 'Selecione e copie' : copiado ? 'Copiado' : rotulo}
    </button>
  )
}

/** Tabela com rolagem própria: em telas estreitas a tabela desliza, a página não. */
export function Tabela({ colunas, children }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[34rem] border-collapse">
        <thead>
          <tr className="border-b border-line">
            {colunas.map((coluna) => (
              <th key={coluna} scope="col" className="type-label text-text-muted text-left py-3 pr-4 last:pr-0">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
