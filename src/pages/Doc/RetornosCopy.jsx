import { useEffect, useMemo, useState } from 'react'
import { BotaoCopiar } from './Pecas'
import { lerAnexo } from './retornos'
import { INVENTARIO, TOTAL_TEXTOS, ROTULO_TIPO, mudancasDe, comoLista } from './copyRevisao'

/* Revisão de copy dentro de `/doc/retornos`. Mostra só o que muda — trocar,
   tirar, observação, anexo, espaço livre —, na ordem em que os textos
   aparecem no site. O que foi mantido entra só na contagem: é o que não pede
   trabalho de ninguém. */

const semAcento = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/* O arquivo leva o retorno como veio do servidor e o inventário da hora do
   download, junto: é com os dois que as mudanças são aplicadas no código,
   e o inventário pode mudar depois. */
function baixarJson(retorno) {
  const conteudo = JSON.stringify(
    { baixadoEm: new Date().toISOString(), retorno, inventario: INVENTARIO },
    null,
    2,
  )
  const endereco = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = endereco
  link.download = `revisao-copy-${semAcento(retorno.nome) || 'sem-nome'}-${String(retorno.atualizadoEm ?? '').slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(endereco), 1000)
}

/* O anexo é privado: só sai do servidor com a senha, então não dá para pôr o
   caminho num <img>. Baixa com a senha e mostra por um object URL, que é
   liberado quando a miniatura sai da tela. */
function MiniaturaAnexo({ senha, caminho }) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })

  useEffect(() => {
    let ativo = true
    let endereco = null
    lerAnexo(senha, caminho)
      .then((blob) => {
        endereco = URL.createObjectURL(blob)
        if (ativo) setEstado({ tipo: 'pronto', endereco })
        else URL.revokeObjectURL(endereco)
      })
      .catch((erro) => {
        if (ativo) setEstado({ tipo: 'erro', mensagem: erro.message })
      })
    return () => {
      ativo = false
      if (endereco) URL.revokeObjectURL(endereco)
    }
  }, [senha, caminho])

  if (estado.tipo === 'carregando') {
    return (
      <div className="w-40 h-24 rounded-xl bg-surface-muted" role="status">
        <span className="sr-only">Carregando imagem anexada</span>
      </div>
    )
  }

  if (estado.tipo === 'erro') {
    return (
      <p className="type-meta text-state-error">
        {estado.mensagem} <span className="text-text-muted break-all">({caminho})</span>
      </p>
    )
  }

  return (
    <a
      href={estado.endereco}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-40 rounded-xl overflow-hidden border border-line hover:border-brand-accent transition-colors cursor-zoom-in"
    >
      <img src={estado.endereco} alt="Imagem anexada" className="block w-full h-auto" />
    </a>
  )
}

function Observacao({ rotulo, texto }) {
  return (
    <div className="mt-3">
      <p className="type-label text-text-muted">{rotulo}</p>
      <p className="type-body text-text-dark mt-1 rounded-xl bg-surface-light border border-line px-4 py-3 whitespace-pre-wrap break-words">
        {texto}
      </p>
    </div>
  )
}

function Mudanca({ texto, resposta }) {
  const tirar = resposta.decisao === 'tirar'
  const novo = String(resposta.novo ?? '')
  const igual = !tirar && novo.trim() === String(texto.texto).trim()

  return (
    <li>
      <p className="type-meta text-text-muted break-words">
        {ROTULO_TIPO[texto.tipo] ?? texto.tipo} · [{texto.id}]
        {texto.arquivo && (
          <>
            {' · '}
            {texto.arquivo}
            {texto.linha != null && <span className="type-numeric">:{texto.linha}</span>}
          </>
        )}
      </p>

      {tirar ? (
        <p className="type-body mt-1 whitespace-pre-line break-words">
          <span className="type-label text-state-error mr-2">Tirar</span>
          <span className="text-text-muted line-through decoration-state-error">{texto.texto}</span>
        </p>
      ) : (
        <div className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
          <span className="type-label text-text-muted sm:pt-1">Antes</span>
          <p className="type-body text-text-muted whitespace-pre-line break-words">{texto.texto}</p>
          <span className="type-label text-text-dark sm:pt-1 mt-1 sm:mt-0">Depois</span>
          <p className="type-body text-text-dark whitespace-pre-line break-words">
            {novo.trim() ? novo : <span className="text-text-muted">(campo vazio)</span>}
          </p>
          {igual && (
            <p className="type-meta text-text-muted sm:col-start-2">
              Marcou trocar, mas o texto ficou igual ao de hoje.
            </p>
          )}
        </div>
      )}
    </li>
  )
}

function CartaoCopy({ retorno, senha, quando, acoes }) {
  const { grupos, soltos, dobrasSoltas, contagem, livre } = useMemo(() => mudancasDe(retorno), [retorno])
  const marcados = contagem.manter + contagem.trocar + contagem.tirar
  const temLivre = Boolean(livre.nota || livre.anexo)
  const nada = !grupos.length && !soltos.length && !dobrasSoltas.length && !temLivre
  const lista = useMemo(() => comoLista(retorno, { quando }), [retorno, quando])

  return (
    <article className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h3 className={`type-subtitle ${retorno.nome ? 'text-text-dark' : 'text-text-muted'}`}>
            {retorno.nome || 'Sem nome'}
          </h3>
          <p className="type-meta text-text-muted mt-1">
            Atualizado em <span className="type-numeric">{quando(retorno.atualizadoEm)}</span>
            {retorno.enviadoEm && (
              <>
                {' · '}avisou que terminou em <span className="type-numeric">{quando(retorno.enviadoEm)}</span>
              </>
            )}
          </p>
          <p className="type-meta text-text-dark mt-1">
            <span className="type-numeric">{marcados}</span> de <span className="type-numeric">{TOTAL_TEXTOS}</span>{' '}
            textos marcados · <span className="type-numeric">{contagem.trocar}</span> trocar ·{' '}
            <span className="type-numeric">{contagem.tirar}</span> tirar ·{' '}
            <span className="type-numeric">{contagem.manter}</span> manter
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => baixarJson(retorno)}
            className="min-h-11 inline-flex items-center gap-2 px-4 rounded-xl border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 transition-colors cursor-pointer type-label"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
            </svg>
            Baixar JSON
          </button>
          <BotaoCopiar texto={lista} rotulo="Copiar como lista" />
          {acoes}
        </div>
      </header>

      {nada ? (
        <p className="type-body text-text-muted mt-5">
          {marcados
            ? 'Nada para mudar até agora: tudo o que foi marcado fica como está.'
            : 'Ainda não marcou nenhum texto.'}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {grupos.map(({ deck, dobras }) => (
            <section key={deck.id}>
              <h4 className="type-label text-text-muted">
                <span className="type-numeric">{deck.numero}</span> · {deck.titulo}
              </h4>
              <div className="mt-3 space-y-6">
                {dobras.map(({ dobra, textos, nota, anexo }) => (
                  <div key={dobra.id} className="border-l-2 border-line pl-4">
                    <p className="type-body text-text-dark font-semibold">
                      {dobra.titulo} <span className="type-meta text-text-muted font-normal">{dobra.id}</span>
                    </p>
                    {textos.length > 0 && (
                      <ul className="mt-3 space-y-5">
                        {textos.map(({ texto, resposta }) => (
                          <Mudanca key={texto.id} texto={texto} resposta={resposta} />
                        ))}
                      </ul>
                    )}
                    {nota && <Observacao rotulo="Observação desta parte" texto={nota} />}
                    {anexo && (
                      <div className="mt-3">
                        <p className="type-label text-text-muted mb-1">Imagem anexada</p>
                        <MiniaturaAnexo senha={senha} caminho={anexo} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {(soltos.length > 0 || dobrasSoltas.length > 0) && (
            <section>
              <h4 className="type-label text-text-muted">Fora do inventário atual</h4>
              <p className="type-meta text-text-muted mt-1">
                Respostas para textos ou partes que o inventário de hoje não tem mais.
              </p>
              <ul className="mt-3 space-y-2">
                {soltos.map(({ id, resposta }) => (
                  <li key={id} className="type-body text-text-dark break-words">
                    <span className="type-meta text-text-muted">[{id}]</span>{' '}
                    {resposta.decisao === 'tirar' ? 'Tirar' : `→ ${resposta.novo ?? ''}`}
                  </li>
                ))}
                {dobrasSoltas.map(({ id, nota, anexo }) => (
                  <li key={id} className="type-body text-text-dark break-words">
                    <span className="type-meta text-text-muted">[{id}]</span> {nota}
                    {anexo && <MiniaturaAnexo senha={senha} caminho={anexo} />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {temLivre && (
            <section>
              <h4 className="type-label text-text-muted">Espaço livre</h4>
              {livre.nota && (
                <p className="type-body text-text-dark mt-3 rounded-xl bg-surface-light border border-line px-4 py-3 whitespace-pre-wrap break-words">
                  {livre.nota}
                </p>
              )}
              {livre.anexo && (
                <div className="mt-3">
                  <MiniaturaAnexo senha={senha} caminho={livre.anexo} />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </article>
  )
}

/**
 * Seção "Revisão de copy" da página de retornos.
 *
 * `acoesDe` devolve os controles que dependem da página que lista (o apagar,
 * que precisa da senha e atualiza a lista) — esta seção só mostra.
 */
export default function RetornosCopy({ retornos, senha, quando, acoesDe }) {
  return (
    <section id="revisao-copy" aria-labelledby="titulo-revisao-copy" className="scroll-mt-8 mt-16 pt-10 border-t border-line">
      <h2 id="titulo-revisao-copy" className="type-title text-text-dark">Revisão de copy</h2>
      <p className="type-body text-text-muted mt-3 max-w-2xl">
        O que cada pessoa pediu em <span className="whitespace-nowrap">/doc/copy</span>: texto
        a trocar (antes e depois), texto a tirar, observações e imagens por
        parte, e o espaço livre. O que foi mantido só entra na contagem.
      </p>

      {retornos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface-light p-8 text-center mt-6">
          <p className="type-subtitle text-text-dark">Nenhuma revisão ainda</p>
          <p className="type-body text-text-muted mt-2">
            Aparece aqui assim que alguém escrever o nome e marcar o primeiro
            texto em /doc/copy.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {retornos.map((retorno) => (
            <CartaoCopy
              key={retorno.id}
              retorno={retorno}
              senha={senha}
              quando={quando}
              acoes={acoesDe(retorno)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
