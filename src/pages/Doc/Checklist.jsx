import { useEffect, useMemo, useState } from 'react'
import { ROTEIRO, O_QUE_ANOTAR, SITE } from '../../content/documentacao'
import { useArmazenamento } from './hooks'
import { BotaoCopiar } from './Pecas'
import { ehImpressao } from './modoImpressao'
import { salvarRetorno, novoIdentificador } from './retornos'

const hora = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * Roteiro de homologação com marcação e anotação.
 *
 * A página não é só leitura: é o instrumento do retorno. Quem confere marca o
 * passo e escreve ali mesmo o que incomodou.
 *
 * O retorno chega por dois caminhos. O primeiro é automático: cada alteração
 * é salva no servidor (`/api/retornos`, Vercel Blob) pouco depois de feita, e
 * aparece em `/doc/retornos` para quem tem a senha — quem marca três passos e
 * fecha a aba já deixou o retorno. O segundo é o WhatsApp: um botão abre a
 * conversa com o texto montado, para a resposta chegar também onde a conversa
 * com o cliente já acontece.
 *
 * O navegador guarda uma cópia local, para a pessoa continuar de onde parou e
 * para nada se perder se o servidor falhar num salvamento.
 */
export default function Checklist({ publico }) {
  const impressao = ehImpressao()
  const [estado, setEstado] = useArmazenamento(`locafacil_doc_${publico}_roteiro`, {})
  const [pessoa, setPessoa] = useArmazenamento('locafacil_doc_pessoa', {
    id: novoIdentificador(),
    nome: '',
  })
  const [enviadoEm, setEnviadoEm] = useArmazenamento(`locafacil_doc_${publico}_enviado`, null)
  const [salvamento, setSalvamento] = useState({ tipo: 'ocioso' })
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)

  const feitos = ROTEIRO.filter((passo) => estado[passo.id]?.feito).length
  const comNota = ROTEIRO.filter((passo) => (estado[passo.id]?.nota ?? '').trim()).length
  const temConteudo = Boolean(pessoa.nome.trim()) || feitos > 0 || comNota > 0

  /* Salvamento automático, um pouco depois da última alteração: quem digita
     uma observação não dispara uma gravação por letra. Página vazia não
     salva — abrir o link e fechar não é retorno. */
  useEffect(() => {
    if (impressao || !temConteudo) return undefined
    const timer = setTimeout(async () => {
      try {
        const resultado = await salvarRetorno({
          publico,
          id: pessoa.id,
          nome: pessoa.nome,
          passos: estado,
          enviadoEm,
        })
        setSalvamento(
          resultado.salvo ? { tipo: 'salvo', em: resultado.atualizadoEm } : { tipo: 'local' },
        )
      } catch {
        setSalvamento({ tipo: 'erro' })
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [impressao, temConteudo, publico, pessoa.id, pessoa.nome, estado, enviadoEm])

  const alternar = (id) =>
    setEstado((atual) => ({ ...atual, [id]: { ...atual[id], feito: !atual[id]?.feito } }))

  const anotar = (id, nota) =>
    setEstado((atual) => ({ ...atual, [id]: { ...atual[id], nota } }))

  const retorno = useMemo(() => {
    const quem = pessoa.nome.trim()
    const pagina = publico === 'cliente' ? 'do cliente' : 'do marketing'
    const linhas = [
      `Homologação do site da Locafácil — ${SITE.rotulo}`,
      ...(quem ? [`Retorno de ${quem} (página ${pagina}).`] : []),
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
  }, [estado, feitos, pessoa.nome, publico])

  // Sem número fixo: o WhatsApp abre a lista de contatos e a pessoa escolhe a
  // conversa com a equipe do projeto, que ela já tem.
  const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(retorno)}`

  const avisoSalvamento = {
    salvo: salvamento.em && `Salvo às ${hora(salvamento.em)}. Chega direto à equipe do projeto.`,
    local: 'Salvo neste navegador.',
    erro: 'Não consegui salvar agora. As marcações continuam neste navegador, e o salvamento tenta de novo na próxima alteração.',
  }[salvamento.tipo]

  const progresso = Math.round((feitos / ROTEIRO.length) * 100)

  return (
    <div>
      {/* Barra de progresso: o número manda, a barra só ilustra. */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 mb-6">
        <label className="block mb-5 print:hidden">
          <span className="type-label text-text-muted block mb-2">Quem está respondendo?</span>
          <input
            type="text"
            value={pessoa.nome}
            onChange={(evento) => setPessoa((atual) => ({ ...atual, nome: evento.target.value }))}
            placeholder="Seu nome e empresa"
            autoComplete="name"
            maxLength={80}
            className="w-full sm:max-w-md rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
          />
        </label>

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
        <p
          className={`type-meta mt-3 min-h-5 print:hidden ${
            salvamento.tipo === 'erro' ? 'text-state-error' : 'text-text-muted'
          }`}
          aria-live="polite"
        >
          {avisoSalvamento}
        </p>
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
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setEnviadoEm(new Date().toISOString())}
            className="min-h-11 inline-flex items-center gap-2 px-5 rounded-xl bg-brand-whatsapp hover:bg-brand-whatsapp-hover text-white transition-colors cursor-pointer type-label"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Enviar retorno pelo WhatsApp
          </a>
          <BotaoCopiar texto={retorno} rotulo="Copiar retorno" />
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
          O que você marca e escreve aqui é salvo sozinho e chega à equipe do
          projeto. Quando terminar, mande também pelo WhatsApp: o botão abre a
          conversa com o retorno já escrito, é só escolher o contato.
          {enviadoEm && ` Último envio pelo WhatsApp às ${hora(enviadoEm)}.`}
        </p>
      </div>
    </div>
  )
}
