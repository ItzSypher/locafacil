import { useCallback, useEffect, useMemo, useState } from 'react'
import { DESTINOS, ROTULO_DO_DESTINO } from '../../content/marketing-imagens'
import { listarArquivosDesign, lerArquivoDesign, apagarArquivoDesign, baixarBlob } from './retornos'

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

/**
 * `acoesDe(aoConfirmar)` devolve o botão de apagar da tela de retornos (o de
 * dois cliques), para os dois tipos de retorno se apagarem do mesmo jeito.
 */
export default function RetornosDesign({ senha, quando, acoesDe }) {
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
      if (!porDestino.has(arquivo.espaco)) porDestino.set(arquivo.espaco, [])
      porDestino.get(arquivo.espaco).push(arquivo)
    }
    return [...porDestino.entries()].sort(
      ([a], [b]) => (ORDEM.get(a) ?? Number.MAX_SAFE_INTEGER) - (ORDEM.get(b) ?? Number.MAX_SAFE_INTEGER),
    )
  }, [arquivos])

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
        <button
          type="button"
          onClick={carregar}
          className="min-h-11 px-4 rounded-xl border border-line type-label text-text-dark hover:border-brand-accent transition-colors cursor-pointer"
        >
          Atualizar
        </button>
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

      {arquivos?.length === 0 && (
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
    </section>
  )
}
