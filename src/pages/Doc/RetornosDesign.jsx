import { useCallback, useEffect, useMemo, useState } from 'react'
import { DESTINOS, ROTULO_DO_DESTINO } from '../../content/marketing-imagens'
import { BLOCOS_TEXTO, destinoDoBloco } from '../../content/marketing-quebras'
import medidasQuebras from '../../content/marketing-quebras-medidas.json'
import { listarArquivosDesign, lerArquivoDesign, apagarArquivoDesign, baixarBlob } from './retornos'
import ComQuebras from './ComQuebras'

/* "Arquivos do design" dentro de /doc/retornos.
 *
 * O que a agência mandou por /doc/marketing, agrupado pelo espaço do site a
 * que se destina, na ordem das fichas. Cada arquivo com miniatura (as
 * imagens raster; SVG não vira miniatura, só download), quem mandou, quando,
 * o peso, e os botões de baixar e apagar.
 *
 * Os arquivos são privados: só saem do servidor com a senha. A miniatura e o
 * download passam pelo mesmo `lerArquivoDesign`, que devolve um Blob.
 */

const ORDEM = new Map(DESTINOS.map((destino, posicao) => [destino.id, posicao]))

const quilos = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('pt-BR')} KB`

function Miniatura({ senha, arquivo }) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const raster = arquivo.tipo !== 'image/svg+xml'

  useEffect(() => {
    if (!raster) return undefined
    let ativo = true
    let endereco = null
    lerArquivoDesign(senha, arquivo.caminho)
      .then((blob) => {
        endereco = URL.createObjectURL(blob)
        if (ativo) setEstado({ tipo: 'pronto', endereco })
        else URL.revokeObjectURL(endereco)
      })
      .catch(() => {
        if (ativo) setEstado({ tipo: 'erro' })
      })
    return () => {
      ativo = false
      if (endereco) URL.revokeObjectURL(endereco)
    }
  }, [senha, arquivo.caminho, raster])

  const caixa = 'w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl border border-line bg-surface-muted'

  if (!raster) {
    return (
      <span className={`${caixa} flex items-center justify-center type-label text-text-muted`} aria-label="Arquivo SVG, sem miniatura">
        SVG
      </span>
    )
  }
  if (estado.tipo === 'pronto') {
    return (
      <a href={estado.endereco} target="_blank" rel="noopener noreferrer" className={`${caixa} block overflow-clip hover:border-brand-accent transition-colors cursor-zoom-in`}>
        <img src={estado.endereco} alt={`Miniatura de ${arquivo.arquivo}`} className="w-full h-full object-contain" />
      </a>
    )
  }
  return (
    <span className={`${caixa} flex items-center justify-center type-meta text-text-muted`} role="status">
      {estado.tipo === 'erro' ? 'Sem prévia' : <span className="sr-only">Carregando miniatura</span>}
    </span>
  )
}

function LinhaArquivo({ senha, arquivo, quando, aoApagar, acoesDe }) {
  const [baixando, setBaixando] = useState(false)
  const [erro, setErro] = useState('')

  const baixar = async () => {
    setBaixando(true)
    setErro('')
    try {
      baixarBlob(await lerArquivoDesign(senha, arquivo.caminho), arquivo.arquivo)
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <li className="flex gap-4 py-4">
      <Miniatura senha={senha} arquivo={arquivo} />
      <div className="min-w-0 flex-1">
        <p className="type-body text-text-dark break-all">{arquivo.arquivo}</p>
        <p className="type-meta text-text-muted mt-0.5">
          {arquivo.nome || 'Sem nome'} · <span className="type-numeric">{quando(arquivo.enviadoEm)}</span> ·{' '}
          <span className="type-numeric">{quilos(arquivo.tamanho)}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1 mt-2 -ml-3">
          <button
            type="button"
            onClick={baixar}
            disabled={baixando}
            aria-busy={baixando}
            className="min-h-11 px-3 type-label text-brand-accent hover:text-brand-glow disabled:opacity-60 transition-colors cursor-pointer"
          >
            {baixando ? 'Baixando…' : 'Baixar'}
          </button>
          {acoesDe(() => aoApagar(arquivo))}
        </div>
        {erro && (
          <p role="alert" className="type-meta text-state-error">
            {erro}
          </p>
        )}
      </div>
    </li>
  )
}

const normalizar = (texto) => String(texto ?? '').replace(/\s+/g, ' ').trim()
const textoAtual = (idBloco, idTexto) => medidasQuebras.blocos?.[idBloco]?.textos?.[idTexto] ?? ''

/* O arquivo que a equipe usa para aplicar no código: os arquivos enviados, as
   quebras pedidas por pessoa e, junto, o texto e as linhas de hoje de cada
   bloco (o site pode mudar depois do download). Formato estável. */
function baixarJsonDesign({ arquivos, retornos }) {
  const conteudo = {
    baixadoEm: new Date().toISOString(),
    arquivos: arquivos ?? [],
    quebras: retornos.map((retorno) => ({
      pessoa: retorno.id,
      nome: retorno.nome,
      atualizadoEm: retorno.atualizadoEm,
      blocos: retorno.quebras,
    })),
    textosAtuais: {
      medidoEm: medidasQuebras.medidoEm,
      blocos: Object.fromEntries(
        BLOCOS_TEXTO.map((bloco) => [
          bloco.id,
          {
            pagina: bloco.pagina,
            parte: bloco.parte,
            rota: bloco.rota,
            textos: Object.fromEntries(
              bloco.textos.map((texto) => [
                texto.id,
                {
                  tipo: texto.tipo,
                  seletor: texto.seletor,
                  texto: textoAtual(bloco.id, texto.id),
                  linhasDesktop: medidasQuebras.blocos?.[bloco.id]?.formatos?.desktop?.textos?.[texto.id]?.linhas ?? null,
                  linhasCelular: medidasQuebras.blocos?.[bloco.id]?.formatos?.celular?.textos?.[texto.id]?.linhas ?? null,
                },
              ]),
            ),
          },
        ]),
      ),
    },
  }
  const data = new Date().toISOString().slice(0, 10)
  baixarBlob(new Blob([JSON.stringify(conteudo, null, 2)], { type: 'application/json' }), `design-locafacil-${data}.json`)
}

function Pedido({ rotulo, texto, original }) {
  const mudouPalavra = normalizar(texto) !== normalizar(original)
  return (
    <div className="rounded-lg border border-line px-3 py-2 min-w-0">
      <p className="type-label text-text-dark mb-1">{rotulo}</p>
      <p className="type-body text-text-dark break-words">
        <ComQuebras texto={texto} />
      </p>
      {mudouPalavra && (
        <p className="type-meta text-text-dark mt-1 rounded bg-brand-gold/10 px-2 py-1">Mudou palavra: tratar como pedido de texto.</p>
      )}
    </div>
  )
}

/* As quebras pedidas por uma pessoa num bloco: por texto, hoje e o pedido no
   computador e no celular; depois destaque, observação e os prints. */
function QuebrasDoBloco({ bloco, resposta, anexos, senha, quando, acoesDe, aoApagar }) {
  const textos = bloco.textos.filter((texto) => resposta.textos?.[texto.id])
  return (
    <article className="rounded-xl border border-line bg-surface-light p-4 sm:p-5">
      <h5 className="type-subtitle text-text-dark">
        {bloco.pagina} · {bloco.parte}
      </h5>

      {textos.length > 0 && (
        <ul className="mt-4 space-y-4">
          {textos.map((texto) => {
            const pedido = resposta.textos[texto.id]
            const original = textoAtual(bloco.id, texto.id)
            return (
              <li key={texto.id} className="rounded-xl bg-white border border-line p-3 sm:p-4">
                <p className="type-label text-text-muted">
                  <span className="type-numeric">{bloco.textos.indexOf(texto) + 1}</span> · {texto.tipo}
                </p>
                <div className="mt-2 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-surface-light px-3 py-2 min-w-0">
                    <p className="type-label text-text-muted mb-1">Hoje</p>
                    <p className="type-body text-text-muted break-words">
                      <ComQuebras texto={original} />
                    </p>
                  </div>
                  {pedido.mesma ? (
                    <div className="md:col-span-2">
                      <Pedido rotulo="Computador e celular" texto={pedido.desktop} original={original} />
                    </div>
                  ) : (
                    <>
                      <Pedido rotulo="Computador" texto={pedido.desktop || original} original={original} />
                      <Pedido rotulo="Celular" texto={pedido.celular || original} original={original} />
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {resposta.destaque && (
        <div className="mt-4">
          <p className="type-label text-text-muted mb-1">Destacar ou ajustar</p>
          <p className="type-body text-text-dark whitespace-pre-wrap break-words rounded-lg bg-white border border-line px-3 py-2">{resposta.destaque}</p>
        </div>
      )}
      {resposta.nota && (
        <div className="mt-4">
          <p className="type-label text-text-muted mb-1">Observação</p>
          <p className="type-body text-text-dark whitespace-pre-wrap break-words rounded-lg bg-white border border-line px-3 py-2">{resposta.nota}</p>
        </div>
      )}
      {anexos.length > 0 && (
        <div className="mt-4">
          <p className="type-label text-text-muted">Prints</p>
          <ul className="divide-y divide-line-soft">
            {anexos.map((arquivo) => (
              <LinhaArquivo key={arquivo.caminho} senha={senha} arquivo={arquivo} quando={quando} aoApagar={aoApagar} acoesDe={acoesDe} />
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

function QuebrasDeLinha({ retornos, arquivos, senha, quando, acoesDe, aoApagar }) {
  return (
    <div className="mt-12">
      <h3 id="quebras-de-linha" className="type-title text-text-dark scroll-mt-8">Quebras de linha</h3>
      <p className="type-body text-text-muted mt-3 mb-6 max-w-2xl">
        O que o design pediu em “Textos: quebras de linha e leitura”. O ↵ marca cada quebra. Vai inteiro no JSON do design.
      </p>

      {retornos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface-light p-8 text-center">
          <p className="type-subtitle text-text-dark">Nenhuma quebra pedida ainda</p>
          <p className="type-body text-text-muted mt-2">Aparecem aqui assim que alguém marcar um texto em /doc/marketing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retornos.map((retorno) => (
            <section key={retorno.id} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <header className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h4 className={`type-subtitle ${retorno.nome ? 'text-text-dark' : 'text-text-muted'}`}>{retorno.nome || 'Sem nome'}</h4>
                <p className="type-meta text-text-muted">
                  Atualizado em <span className="type-numeric">{quando(retorno.atualizadoEm)}</span>
                </p>
              </header>
              <div className="space-y-4">
                {BLOCOS_TEXTO.filter((bloco) => retorno.quebras?.[bloco.id]).map((bloco) => (
                  <QuebrasDoBloco
                    key={bloco.id}
                    bloco={bloco}
                    resposta={retorno.quebras[bloco.id]}
                    anexos={(arquivos ?? []).filter((a) => a.pessoa === retorno.id && a.espaco === destinoDoBloco(bloco.id))}
                    senha={senha}
                    quando={quando}
                    acoesDe={acoesDe}
                    aoApagar={aoApagar}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * `acoesDe(aoConfirmar)` devolve o botão de apagar da tela de retornos (o de
 * dois cliques), para os dois tipos de retorno se apagarem do mesmo jeito.
 */
export default function RetornosDesign({ senha, quando, acoesDe, retornos = [] }) {
  const [arquivos, setArquivos] = useState(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setErro('')
    try {
      setArquivos(await listarArquivosDesign(senha))
    } catch (falha) {
      setErro(falha.message)
    }
  }, [senha])

  useEffect(() => {
    carregar()
  }, [carregar])

  const grupos = useMemo(() => {
    const porDestino = new Map()
    for (const arquivo of arquivos ?? []) {
      if (arquivo.espaco.startsWith('quebras-') && retornos.some((r) => r.id === arquivo.pessoa)) continue
      if (!porDestino.has(arquivo.espaco)) porDestino.set(arquivo.espaco, [])
      porDestino.get(arquivo.espaco).push(arquivo)
    }
    return [...porDestino.entries()].sort(
      ([a], [b]) => (ORDEM.get(a) ?? Number.MAX_SAFE_INTEGER) - (ORDEM.get(b) ?? Number.MAX_SAFE_INTEGER),
    )
  }, [arquivos, retornos])

  const apagar = async (arquivo) => {
    try {
      await apagarArquivoDesign(senha, arquivo.caminho)
      setArquivos((lista) => lista.filter((item) => item.caminho !== arquivo.caminho))
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <section id="arquivos-design" aria-labelledby="arquivos-design-titulo" className="scroll-mt-8 mt-16 pt-12 border-t border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="arquivos-design-titulo" className="type-title text-text-dark">
          Arquivos do design
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={carregar}
            className="min-h-11 px-4 rounded-xl border border-line type-label text-text-dark hover:border-brand-accent transition-colors cursor-pointer"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => baixarJsonDesign({ arquivos, retornos })}
            className="min-h-11 px-4 rounded-xl bg-brand-accent hover:bg-brand-glow text-white type-label transition-colors cursor-pointer"
          >
            Baixar JSON
          </button>
          <a
            href="#quebras-de-linha"
            className="min-h-11 inline-flex items-center px-3 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer"
          >
            Quebras de linha <span className="type-numeric ml-1">{retornos.length}</span>
          </a>
        </div>
      </div>
      <p className="type-body text-text-muted mt-3 mb-6 max-w-2xl">
        As imagens que a agência enviou por /doc/marketing, agrupadas pelo espaço do site. Chegam inteiras, como saíram do
        programa de quem desenhou.
      </p>

      {erro && (
        <p role="alert" className="type-meta text-state-error mb-6">
          {erro}
        </p>
      )}

      {arquivos === null && !erro && (
        <p className="type-meta text-text-muted" role="status">
          Carregando os arquivos…
        </p>
      )}

      {arquivos && grupos.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface-light p-8 text-center">
          <p className="type-subtitle text-text-dark">Nenhum arquivo ainda</p>
          <p className="type-body text-text-muted mt-2">
            Os arquivos aparecem aqui assim que alguém enviar uma imagem por uma das fichas de /doc/marketing.
          </p>
        </div>
      )}

      {grupos.length > 0 && (
        <div className="space-y-4">
          {grupos.map(([espaco, lista]) => (
            <article key={espaco} className="rounded-2xl border border-line bg-white px-5 sm:px-6 pt-5">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="type-subtitle text-text-dark">{ROTULO_DO_DESTINO.get(espaco) ?? espaco}</h3>
                <p className="type-meta text-text-muted">
                  <span className="type-numeric">{lista.length}</span> {lista.length === 1 ? 'arquivo' : 'arquivos'}
                </p>
              </header>
              <ul className="divide-y divide-line-soft">
                {lista.map((arquivo) => (
                  <LinhaArquivo
                    key={arquivo.caminho}
                    senha={senha}
                    arquivo={arquivo}
                    quando={quando}
                    aoApagar={apagar}
                    acoesDe={acoesDe}
                  />
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      <QuebrasDeLinha
        retornos={retornos}
        arquivos={arquivos}
        senha={senha}
        quando={quando}
        acoesDe={acoesDe}
        aoApagar={apagar}
      />
    </section>
  )
}
