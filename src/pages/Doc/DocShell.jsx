import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/brand/logo-lockup-white.svg'
import { SITE } from '../../content/documentacao'
import { useSemIndice } from './hooks'

/* Quantos dias faltam para a reunião. Meia-noite local dos dois lados: comparar
   com `new Date()` cru faria "hoje" virar zero ou um conforme a hora. */
function diasAte(iso) {
  const alvo = new Date(`${iso}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo - hoje) / 86400000)
}

/**
 * Casca das páginas internas de documentação.
 *
 * Não entra no menu do site e não é indexada: é um link que se manda para
 * alguém, não uma página que se acha (ver `useSemIndice`).
 */
export default function DocShell({ publico, titulo, tituloAba, resumo, secoes, pdf, children }) {
  const [ativa, setAtiva] = useState(secoes[0]?.id)

  useSemIndice(tituloAba ?? titulo)

  /* Marca no índice a seção que está sendo lida. A margem de topo tira da
     conta a faixa fixa: sem ela, a seção acende quando encosta no topo da
     janela, que é debaixo da barra. */
  useEffect(() => {
    const alvos = secoes
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean)
    if (!alvos.length) return undefined

    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: '-96px 0px -70% 0px' },
    )

    alvos.forEach((alvo) => observador.observe(alvo))
    return () => observador.disconnect()
  }, [secoes])

  const dias = diasAte(SITE.reuniao)
  const outro = publico === 'cliente'
    ? { para: '/doc/marketing', rotulo: 'Ver a versão do marketing' }
    : { para: '/doc/cliente', rotulo: 'Ver a versão do cliente' }

  return (
    <div className="on-light min-h-screen bg-white overflow-x-hidden">
      <header className="bg-hero-gradient">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="inline-flex min-h-11 items-center">
              <img src={logo} alt="Locafácil" width={850} height={255} className="h-8 w-auto" />
            </Link>
            <span className="type-label text-text-secondary border border-white/20 rounded-full px-3 py-1.5">
              Documento interno
            </span>
          </div>

          <h1 className="type-headline text-text-primary mt-10 max-w-3xl text-balance">{titulo}</h1>
          <p className="type-body text-text-secondary mt-4 max-w-2xl text-balance">{resumo}</p>

          <div className="flex flex-wrap gap-3 mt-8 print:hidden">
            <a
              href={SITE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 inline-flex items-center gap-2 px-5 rounded-xl bg-brand-accent hover:bg-brand-glow text-white transition-colors cursor-pointer type-label"
            >
              Abrir o site
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5" />
              </svg>
            </a>
            <a
              href={pdf}
              download
              className="min-h-11 inline-flex items-center gap-2 px-5 rounded-xl border border-white/20 text-text-primary hover:bg-white/10 transition-colors cursor-pointer type-label"
            >
              Baixar em PDF
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
              </svg>
            </a>
          </div>

          <dl className="flex flex-wrap gap-x-10 gap-y-4 mt-10 pt-8 border-t border-white/10">
            <div>
              <dt className="type-label text-text-secondary">Endereço de teste</dt>
              <dd className="type-body text-text-primary mt-1">{SITE.rotulo}</dd>
            </div>
            <div>
              <dt className="type-label text-text-secondary">Atualizado em</dt>
              <dd className="type-body text-text-primary mt-1">{SITE.atualizado}</dd>
            </div>
            <div>
              <dt className="type-label text-text-secondary">Reunião de validação</dt>
              <dd className="type-body text-text-primary mt-1">
                {SITE.reuniaoRotulo}
                {dias > 0 && (
                  <span className="text-text-secondary">
                    {' '}· <span className="type-numeric">{dias}</span> {dias === 1 ? 'dia' : 'dias'}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Índice fixo. Rola na horizontal no celular — cinco rótulos não cabem
          numa linha de 375px, e quebrá-los em duas rouba a página inteira. */}
      <nav
        aria-label="Seções deste documento"
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-line print:hidden"
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <ul className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            {secoes.map((secao) => (
              <li key={secao.id}>
                <a
                  href={`#${secao.id}`}
                  aria-current={ativa === secao.id ? 'true' : undefined}
                  className={`min-h-11 flex items-center px-3 whitespace-nowrap type-label border-b-2 transition-colors ${
                    ativa === secao.id
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-text-muted hover:text-text-dark'
                  }`}
                >
                  {secao.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-8 print:pt-10">{children}</main>

      <footer className="border-t border-line print:hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 flex flex-wrap items-center justify-between gap-4">
          <p className="type-meta text-text-muted max-w-md">
            Página interna, fora do menu do site e fora das buscas. O link é o
            acesso — mande só para quem precisa.
          </p>
          <Link
            to={outro.para}
            className="min-h-11 inline-flex items-center type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer"
          >
            {outro.rotulo}
          </Link>
        </div>
      </footer>
    </div>
  )
}
