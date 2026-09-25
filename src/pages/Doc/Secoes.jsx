import { BotaoCopiar } from './Pecas'
import {
  SITE, DADOS_TESTE, REUNIAO, API_FALTA, DOCUMENTACAO, PROXIMOS_PASSOS,
} from '../../content/documentacao'

/* Corpos de seção que as duas páginas compartilham. A casca (`Secao`, com
   número e título) fica em quem monta a página: a numeração muda de uma para
   a outra, o conteúdo não. */

/* Só o que se digita ganha botão de copiar. Loja, grupo, proteção e estado são
   escolhidos numa lista — copiar o nome não adianta nada ali. As datas também
   ficam de fora: campo de data do navegador não aceita colar, e um botão que
   copia sem efeito ensina a desconfiar dos outros. */
const COPIAVEIS = new Set([
  'Nome', 'Sobrenome', 'DDD', 'Telefone', 'E-mail', 'CPF', 'Endereço',
  'Complemento', 'Cidade',
])

/**
 * Dados fictícios para percorrer a reserva, tela a tela.
 *
 * Sem eles, cada pessoa inventa um CPF que não passa no dígito verificador,
 * trava na etapa de dados e manda "o site não deixa avançar" como retorno.
 * Com eles, todo mundo chega à proteção — que é onde está o upsell — e à tela
 * final, que é a que mais importa conferir.
 */
export function DadosTeste() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DADOS_TESTE.map((bloco, indice) => {
        // Cartão largo para o condutor, que tem dez campos, e para a proteção,
        // que é o upsell. Sem isso a proteção ficava sozinha numa linha, com
        // um buraco ao lado, bem no meio da sequência.
        const largo = bloco.campos.length > 4 || bloco.destaque
        return (
          <article
            key={bloco.tela}
            className={`rounded-2xl border bg-white p-5 sm:p-6 print:break-inside-avoid ${
              largo ? 'md:col-span-2' : ''
            } ${bloco.destaque ? 'border-brand-accent/30 shadow-card' : 'border-line'}`}
          >
            <header className="flex items-baseline gap-3 mb-3">
              <span className="type-numeric type-label text-brand-accent">{indice + 1}</span>
              <h3 className="type-subtitle text-text-dark">{bloco.tela}</h3>
              {bloco.destaque && (
                <span className="type-label text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full">Upsell</span>
              )}
            </header>

            <dl className={`${largo ? 'sm:grid sm:grid-cols-2 sm:gap-x-8' : ''}`}>
              {bloco.campos.map(([rotulo, valor, hora]) => (
                <div
                  key={rotulo}
                  className="flex items-center justify-between gap-3 border-b border-line-soft last:border-b-0 py-1"
                >
                  <div className="min-w-0 py-1.5">
                    <dt className="type-label text-text-muted">{rotulo}</dt>
                    <dd className="type-body text-text-dark break-words">
                      <span className={/\d/.test(valor) ? 'type-numeric' : ''}>{valor}</span>
                      {hora && (
                        <span className="text-text-muted">
                          {' '}às <span className="type-numeric text-text-dark">{hora}</span>
                        </span>
                      )}
                    </dd>
                  </div>
                  {COPIAVEIS.has(rotulo) && (
                    <BotaoCopiar texto={valor} rotulo={`Copiar ${rotulo.toLowerCase()}`} compacto />
                  )}
                </div>
              ))}
            </dl>

            {bloco.dica && (
              <p className={`mt-3 ${bloco.destaque ? 'type-body text-text-dark' : 'type-meta text-text-muted'}`}>
                {bloco.dica}
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}

/** Pauta da reunião de validação. A data é o dado principal; a hora ainda não existe. */
export function Reuniao() {
  return (
    <div className="rounded-2xl border border-brand-accent/30 bg-white shadow-card p-6 sm:p-8 print:break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="type-title text-text-dark">{SITE.reuniaoRotulo}</p>
        <p className="type-label text-text-muted">{REUNIAO.horario}</p>
      </div>

      <ol className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {REUNIAO.pauta.map((item, indice) => (
          <li key={item.titulo} className="flex gap-4">
            <span className="type-numeric type-label text-brand-accent pt-1" aria-hidden="true">
              {String(indice + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="type-subtitle text-text-dark">{item.titulo}</p>
              <p className="type-body text-text-muted mt-1">{item.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * O que falta para fechar a API, na ordem em que as coisas destravam.
 *
 * Numerado de propósito, ao contrário das pendências: aqui a ordem é a
 * informação. O item um segura todos os outros, e quem lê precisa ver isso
 * sem ler o texto.
 */
export function ApiFalta() {
  return (
    <ol className="relative">
      {API_FALTA.map((item, indice) => {
        const nosso = item.quem === 'Desenvolvimento'
        return (
          <li key={item.passo} className="flex gap-4 pb-6 last:pb-0 print:break-inside-avoid">
            <div className="flex flex-col items-center">
              <span
                className={`type-numeric type-label w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                  indice === 0 ? 'bg-brand-accent text-white' : 'bg-surface-muted text-text-dark'
                }`}
              >
                {indice + 1}
              </span>
              {indice < API_FALTA.length - 1 && <span className="w-px grow bg-line mt-2" aria-hidden="true" />}
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="type-subtitle text-text-dark">{item.passo}</p>
                <span
                  className={`type-label px-2.5 py-1 rounded-full whitespace-nowrap ${
                    nosso ? 'text-text-dark bg-surface-muted' : 'text-brand-accent bg-brand-accent/10'
                  }`}
                >
                  {item.quem}
                </span>
              </div>
              <p className="type-body text-text-muted mt-1 max-w-2xl">{item.texto}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Documentação versionada no repositório, com link direto para cada arquivo. */
export function Documentacao() {
  return (
    <div>
      <a
        href={SITE.repositorio}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-light p-5 sm:p-6 hover:border-brand-accent transition-colors cursor-pointer mb-4"
      >
        <span>
          <span className="type-label text-text-muted block">Repositório público</span>
          <span className="type-subtitle text-text-dark block mt-1 break-all">
            {SITE.repositorio.replace('https://', '')}
          </span>
        </span>
        <span className="type-label text-brand-accent inline-flex items-center gap-2">
          Abrir no GitHub
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5" />
          </svg>
        </span>
      </a>

      <ul className="grid gap-3 sm:grid-cols-2">
        {DOCUMENTACAO.map((doc) => (
          <li key={doc.arquivo}>
            <a
              href={`${SITE.repositorio}/blob/main/${doc.arquivo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-xl border border-line bg-white p-4 min-h-11 hover:border-brand-accent transition-colors cursor-pointer"
            >
              <span className="type-body text-text-dark font-semibold block">{doc.arquivo}</span>
              <span className="type-meta text-text-muted block mt-1">{doc.para}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Linha do tempo dos próximos passos, da homologação aos dados reais. */
export function ProximosPassos() {
  return (
    <ol className="space-y-5">
      {PROXIMOS_PASSOS.map((passo) => (
        <li key={passo.titulo} className="sm:flex sm:gap-6 print:break-inside-avoid">
          <p className="type-label text-brand-accent sm:w-48 sm:shrink-0 sm:pt-1">{passo.quando}</p>
          <div className="mt-1 sm:mt-0">
            <p className="type-subtitle text-text-dark">{passo.titulo}</p>
            <p className="type-body text-text-muted mt-1 max-w-2xl">{passo.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
