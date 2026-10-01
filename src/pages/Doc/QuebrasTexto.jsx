import { useEffect, useState } from 'react'
import { BLOCOS_TEXTO, LIMITES_QUEBRA, destinoDoBloco } from '../../content/marketing-quebras'
import medidas from '../../content/marketing-quebras-medidas.json'
import { useArmazenamento, usePessoa } from './hooks'
import { salvarRetorno } from './retornos'
import { CHAVE_QUEBRAS, CHAVE_ROTEIRO_MARKETING, CHAVE_ENVIADO_MARKETING, lerLocal } from './retornoMarketing'
import { ehImpressao } from './modoImpressao'
import Envio from './EnvioArquivos'
import ComQuebras from './ComQuebras'

/**
 * "Textos: quebras de linha e leitura", em /doc/marketing.
 *
 * O design achou quebras ruins nos textos novos. Aqui cada bloco do site
 * aparece como está hoje, no computador e no celular lado a lado, com os
 * textos numerados no recorte. Para cada texto, um campo já preenchido com o
 * texto atual: o designer aperta Enter onde quer a quebra — a mesma nos dois
 * formatos, ou uma para cada. Observação e print marcado fecham o bloco.
 *
 * As respostas vão no retorno do marketing (`quebras`, ver
 * `retornoMarketing.js`), salvas sozinhas como o roteiro de homologação. Os
 * prints vão pelo envio de arquivos do design, no destino
 * `quebras-<bloco>`.
 */

const LIMITE_LINHAS = 12

const normalizar = (texto) => String(texto ?? '').replace(/\s+/g, ' ').trim()

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function textoAtual(idBloco, idTexto) {
  return medidas.blocos?.[idBloco]?.textos?.[idTexto] ?? ''
}

function medidaDe(idBloco, formato, idTexto) {
  return medidas.blocos?.[idBloco]?.formatos?.[formato]?.textos?.[idTexto] ?? null
}

function recorteDe(idBloco, formato) {
  return medidas.blocos?.[idBloco]?.formatos?.[formato]?.recorte ?? null
}

function ComoQuebraHoje({ idBloco, idTexto }) {
  const formatos = [
    ['desktop', 'Computador'],
    ['celular', 'Celular'],
  ]
  return (
    <dl className="grid sm:grid-cols-2 gap-2 mt-2">
      {formatos.map(([formato, rotulo]) => {
        const medida = medidaDe(idBloco, formato, idTexto)
        if (!medida) return null
        const n = medida.linhas.length
        return (
          <div key={formato} className="rounded-lg bg-surface-light border border-line px-3 py-2 min-w-0">
            <dt className="type-meta text-text-muted">
              {rotulo} hoje: <span className="type-numeric">{n}</span> {n === 1 ? 'linha' : 'linhas'}, até{' '}
              <span className="type-numeric">{medida.caracteresPorLinha}</span> caracteres por linha
            </dt>
            <dd className="type-meta text-text-dark mt-1 break-words">
              <ComQuebras texto={medida.linhas.join('\n')} />
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/* Antes e depois de um exemplo fixo, embaixo de cada campo: quem nunca fez
   isso entende o gesto vendo o resultado, não lendo a regra. */
function DicaExemplo() {
  return (
    <p className="type-meta text-text-muted mt-2">
      Exemplo: “Alugue Fácil Vá Mais Longe.” →{' '}
      <span className="text-text-dark">
        “<ComQuebras texto={'Alugue Fácil\nVá Mais Longe.'} />”
      </span>
    </p>
  )
}

/* O que muda de palavra, e não só de quebra. Gentil e sem travar: pode ser
   de propósito, e aí é pedido de texto. */
function AvisoPalavra({ valor, original }) {
  if (normalizar(valor) === normalizar(original)) return null
  return (
    <p className="type-meta text-text-dark mt-2 rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-3 py-2">
      Você mudou uma palavra. Se for de propósito, tudo bem: vamos tratar como pedido de texto.
    </p>
  )
}

function Previa({ valor }) {
  return (
    <div className="mt-2 rounded-lg bg-surface-light border border-line px-3 py-2" aria-live="polite">
      <p className="type-meta text-text-muted">Prévia com as suas quebras</p>
      <p className="type-body text-text-dark mt-0.5 break-words">
        <ComQuebras texto={valor} />
      </p>
    </div>
  )
}

function CampoQuebra({ id, rotulo, valor, original, aoMudar, exemplo = true }) {
  const linhas = valor.split('\n').length
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="type-label text-text-dark block">{rotulo}</span>
      <span className="type-meta text-text-muted block mt-0.5 mb-1.5">
        Clique no ponto onde a linha deve terminar e aperte Enter. Não mude as palavras, só as quebras.
      </span>
      <textarea
        id={id}
        value={valor}
        rows={Math.min(LIMITE_LINHAS, Math.max(2, linhas + 1))}
        maxLength={LIMITES_QUEBRA.texto}
        onChange={(evento) => {
          const novo = evento.target.value
          // Mais linhas do que qualquer título aguenta é tecla presa.
          if (novo.split('\n').length > LIMITE_LINHAS) return
          aoMudar(novo)
        }}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 type-body text-text-dark focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors resize-y"
      />
      <Previa valor={valor} />
      <AvisoPalavra valor={valor} original={original} />
      {exemplo && <DicaExemplo />}
    </label>
  )
}

function TextoDoBloco({ bloco, texto, numero, pedido, aoMudar }) {
  const original = textoAtual(bloco.id, texto.id)
  const mesma = pedido?.mesma !== false
  const desktop = pedido?.desktop ?? original
  const celular = pedido?.celular ?? desktop
  const mexido = Boolean(pedido)

  if (!original) return null

  return (
    <li className="py-5 first:pt-0">
      <div className="flex items-baseline gap-2">
        <span className="type-label type-numeric w-6 h-6 shrink-0 rounded-full bg-brand-accent text-white inline-flex items-center justify-center" aria-hidden="true">
          {numero}
        </span>
        <p className="type-label text-text-muted">{texto.tipo}</p>
      </div>
      <p className="type-body text-text-dark mt-2">
        <ComQuebras texto={original} />
      </p>
      <ComoQuebraHoje idBloco={bloco.id} idTexto={texto.id} />

      <div className="mt-4 rounded-xl border border-line p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="type-label text-text-dark">Como deve quebrar</p>
          <label className="min-h-11 inline-flex items-center gap-2 cursor-pointer type-meta text-text-dark">
            <input
              type="checkbox"
              checked={mesma}
              onChange={(evento) =>
                aoMudar(
                  evento.target.checked
                    ? { mesma: true, desktop }
                    : { mesma: false, desktop, celular: desktop },
                )
              }
              className="w-5 h-5 rounded border-line text-brand-accent focus:ring-brand-accent cursor-pointer"
            />
            A mesma quebra no computador e no celular
          </label>
        </div>

        {mesma ? (
          <CampoQuebra
            id={`quebra-${bloco.id}-${texto.id}`}
            rotulo="Computador e celular"
            valor={desktop}
            original={original}
            aoMudar={(valor) => aoMudar({ mesma: true, desktop: valor })}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <CampoQuebra
              id={`quebra-${bloco.id}-${texto.id}-desktop`}
              rotulo="No computador"
              valor={desktop}
              original={original}
              aoMudar={(valor) => aoMudar({ mesma: false, desktop: valor, celular })}
            />
            <CampoQuebra
              id={`quebra-${bloco.id}-${texto.id}-celular`}
              rotulo="No celular"
              valor={celular}
              original={original}
              exemplo={false}
              aoMudar={(valor) => aoMudar({ mesma: false, desktop, celular: valor })}
            />
          </div>
        )}

        {mexido && (
          <button
            type="button"
            onClick={() => aoMudar(null)}
            className="min-h-11 -mb-2 mt-1 px-0 type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
          >
            Voltar ao texto de hoje
          </button>
        )}
      </div>
    </li>
  )
}

function Recortes({ bloco }) {
  const formatos = [
    ['desktop', 'Computador (1440)'],
    ['celular', 'Celular (390)'],
  ]
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start">
      {formatos.map(([formato, rotulo]) => {
        const recorte = recorteDe(bloco.id, formato)
        return (
          <figure key={formato} className="min-w-0">
            <figcaption className="flex items-center justify-between gap-2 mb-2">
              <span className="type-label text-text-muted">{rotulo}</span>
              {recorte && (
                <a
                  href={recorte.caminho}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 inline-flex items-center type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer print:hidden"
                >
                  Ampliar
                </a>
              )}
            </figcaption>
            {recorte ? (
              <img
                src={recorte.caminho}
                alt={`${bloco.parte}: como o texto fica hoje no ${formato === 'desktop' ? 'computador' : 'celular'}, com os textos numerados`}
                width={recorte.largura}
                height={recorte.altura}
                loading="lazy"
                decoding="async"
                className={`block h-auto rounded-xl border border-line bg-white ${
                  formato === 'celular' ? 'w-auto max-w-full max-h-[640px] mx-auto' : 'w-full'
                }`}
              />
            ) : (
              <p className="type-meta text-text-muted rounded-xl border border-line p-6 text-center">
                Recorte ainda não gerado. Rode <code>node scripts/capturar-textos.mjs</code>.
              </p>
            )}
          </figure>
        )
      })}
    </div>
  )
}

const SALVAMENTO = {
  'sem-nome': 'Escreva seu nome para as quebras chegarem à equipe. Por enquanto ficam neste navegador.',
  salvando: 'Salvando…',
  local: 'Salvo neste navegador.',
  erro: 'Não consegui salvar agora. Fica neste navegador, e tento de novo na próxima alteração.',
}

function AvisoSalvamento({ estado }) {
  if (estado.tipo === 'ocioso') return null
  const texto = estado.tipo === 'salvo' ? `Salvo às ${hora(estado.em)}. Já chegou à equipe.` : SALVAMENTO[estado.tipo]
  return (
    <p className={`type-meta ${estado.tipo === 'erro' ? 'text-state-error' : 'text-text-muted'}`} aria-live="polite">
      {texto}
    </p>
  )
}

function FichaBloco({ bloco, numero, resposta, aoMudarTexto, aoAnotar, enviados, aoEnviar, salvamento }) {
  const textos = bloco.textos.filter((texto) => textoAtual(bloco.id, texto.id))
  const nota = resposta?.nota ?? ''
  const destaque = resposta?.destaque ?? ''
  const pedidos = Object.keys(resposta?.textos ?? {}).length

  return (
    <article
      id={`quebras-${bloco.id}`}
      aria-labelledby={`quebras-titulo-${bloco.id}`}
      className="scroll-mt-28 rounded-2xl border border-line bg-white overflow-clip"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-line">
        <div className="min-w-0">
          <p className="type-label text-brand-accent">
            <span className="type-numeric mr-2">{String(numero).padStart(2, '0')}</span>
            {bloco.pagina}
          </p>
          <h4 id={`quebras-titulo-${bloco.id}`} className="type-subtitle text-text-dark mt-1 text-balance">
            {bloco.parte}
          </h4>
        </div>
        {pedidos > 0 && (
          <span className="type-label text-text-dark bg-state-success-soft border border-brand-success/40 rounded-full px-2.5 py-1">
            <span className="type-numeric">{pedidos}</span> {pedidos === 1 ? 'quebra pedida' : 'quebras pedidas'}
          </span>
        )}
      </header>

      <div className="p-5 sm:p-6 bg-surface-light border-b border-line">
        <Recortes bloco={bloco} />
      </div>

      <div className="p-5 sm:p-6">
        <p className="type-body text-text-muted mb-5 max-w-2xl">
          Você pode indicar onde cada texto deve quebrar: os números do recorte são os da lista abaixo.
        </p>

        <ol className="divide-y divide-line-soft">
          {textos.map((texto) => (
            <TextoDoBloco
              key={texto.id}
              bloco={bloco}
              texto={texto}
              numero={bloco.textos.indexOf(texto) + 1}
              pedido={resposta?.textos?.[texto.id]}
              aoMudar={(pedido) => aoMudarTexto(bloco.id, texto.id, pedido)}
            />
          ))}
        </ol>

        <label htmlFor={`quebras-destaque-${bloco.id}`} className="block mt-2 print:hidden">
          <span className="type-label text-text-dark block">Algo mais para destacar ou ajustar?</span>
          <span className="type-meta text-text-muted block mt-0.5 mb-1.5">
            Ênfase, palavra em destaque, um trecho que não pode quebrar. Ex.: deixar “sem caução” em negrito; não separar
            “Nova Iguaçu” em duas linhas.
          </span>
          <textarea
            id={`quebras-destaque-${bloco.id}`}
            value={destaque}
            rows={3}
            maxLength={LIMITES_QUEBRA.nota}
            onChange={(evento) => aoAnotar(bloco.id, { destaque: evento.target.value })}
            className="w-full rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
          />
        </label>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 print:hidden">
          <label htmlFor={`quebras-nota-${bloco.id}`} className="block">
            <span className="type-label text-text-dark block mb-1.5">Observação livre</span>
            <textarea
              id={`quebras-nota-${bloco.id}`}
              value={nota}
              rows={4}
              maxLength={LIMITES_QUEBRA.nota}
              onChange={(evento) => aoAnotar(bloco.id, { nota: evento.target.value })}
              placeholder="Qualquer outra coisa sobre este bloco: largura do texto, alinhamento, leitura no celular."
              className="w-full rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
            />
          </label>
          <Envio
            destino={destinoDoBloco(bloco.id)}
            rotulo="Print marcado (opcional)"
            botao="Anexar imagem"
            enviados={enviados[destinoDoBloco(bloco.id)]}
            aoEnviar={aoEnviar}
          />
        </div>
        <div className="mt-3 print:hidden">
          <AvisoSalvamento estado={salvamento} />
        </div>
      </div>
    </article>
  )
}

const PASSOS = [
  {
    titulo: 'Veja como está',
    texto: 'Cada bloco mostra o texto no computador e no celular, lado a lado, com os textos numerados.',
    icone: 'M4 5h16v10H4zM8 19h8M12 15v4',
  },
  {
    titulo: 'Marque onde quebrar com Enter',
    texto: 'No campo do texto, clique onde a linha deve terminar e aperte Enter. Se muda do computador para o celular, desmarque “a mesma quebra”.',
    icone: 'M19 5v6a3 3 0 01-3 3H6m0 0l4-4m-4 4l4 4',
  },
  {
    titulo: 'Salva sozinho',
    texto: 'Com o seu nome preenchido, tudo chega à equipe do projeto, sem botão de enviar.',
    icone: 'M5 13l4 4L19 7',
  },
]

/* Três passos e um campo de teste. O campo não salva nada: existe para a
   pessoa apertar Enter uma vez e ver o ↵ aparecer antes de mexer no real. */
function Tutorial() {
  const exemplo = 'Alugue Fácil Vá Mais Longe.'
  const [teste, setTeste] = useState(exemplo)
  return (
    <div className="rounded-2xl border border-line bg-surface-light p-5 sm:p-6">
      <p className="type-label text-brand-accent mb-4">Como marcar, em três passos</p>
      <ol className="space-y-4">
        {PASSOS.map((passo, i) => (
          <li key={passo.titulo} className="flex gap-3">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-accent/10 text-brand-accent inline-flex items-center justify-center" aria-hidden="true">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={passo.icone} />
              </svg>
            </span>
            <div>
              <p className="type-body text-text-dark font-semibold">
                <span className="type-numeric">{i + 1}.</span> {passo.titulo}
              </p>
              <p className="type-meta text-text-muted mt-0.5">{passo.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 pt-5 border-t border-line print:hidden">
        <label htmlFor="quebras-teste" className="type-label text-text-dark block">
          Experimente aqui (não é salvo)
        </label>
        <span className="type-meta text-text-muted block mt-0.5 mb-1.5">
          Clique depois de “Fácil” e aperte Enter.
        </span>
        <textarea
          id="quebras-teste"
          value={teste}
          rows={2}
          onChange={(evento) => setTeste(evento.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 type-body text-text-dark focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
        />
        <Previa valor={teste} />
        <AvisoPalavra valor={teste} original={exemplo} />
      </div>
    </div>
  )
}

export default function QuebrasTexto() {
  const impressao = ehImpressao()
  const [pessoa, setPessoa] = usePessoa()
  const [quebras, setQuebras] = useArmazenamento(CHAVE_QUEBRAS, {})
  const [enviados, setEnviados] = useArmazenamento('locafacil_doc_quebras_envios', {})
  const [salvamento, setSalvamento] = useState({ tipo: 'ocioso' })
  const [mexeu, setMexeu] = useState(false)
  // Um bloco por vez: os doze juntos davam uma página de dezenas de telas.
  // Na impressão saem todos.
  const [ativo, setAtivo] = useState(BLOCOS_TEXTO[0]?.id)
  const posicaoAtiva = Math.max(0, BLOCOS_TEXTO.findIndex((bloco) => bloco.id === ativo))
  const irPara = (posicao) => {
    setAtivo(BLOCOS_TEXTO[posicao].id)
    document.getElementById('quebras-blocos')?.scrollIntoView({ block: 'start' })
  }

  const nome = pessoa.nome.trim()
  const temConteudo = Object.keys(quebras).length > 0

  /* Salva sozinho, 1,2 s depois da última alteração, como o roteiro. Manda o
     roteiro junto (lido da cópia local) para não apagar o que ele gravou no
     mesmo arquivo. Só depois de alguém mexer aqui: abrir a página não salva. */
  useEffect(() => {
    if (impressao || !mexeu || !temConteudo) return undefined
    if (!nome) {
      setSalvamento({ tipo: 'sem-nome' })
      return undefined
    }
    const timer = setTimeout(async () => {
      setSalvamento({ tipo: 'salvando' })
      try {
        const resultado = await salvarRetorno({
          publico: 'marketing',
          id: pessoa.id,
          nome,
          passos: lerLocal(CHAVE_ROTEIRO_MARKETING, {}),
          enviadoEm: lerLocal(CHAVE_ENVIADO_MARKETING, null),
          quebras,
        })
        setSalvamento(resultado.salvo ? { tipo: 'salvo', em: resultado.atualizadoEm } : { tipo: 'local' })
      } catch {
        setSalvamento({ tipo: 'erro' })
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [impressao, mexeu, temConteudo, nome, pessoa.id, quebras])

  const atualizarBloco = (idBloco, mudar) => {
    setMexeu(true)
    setQuebras((atual) => {
      const bloco = mudar({ ...(atual[idBloco] ?? {}) })
      const vazio =
        !Object.keys(bloco.textos ?? {}).length && !String(bloco.nota ?? '').trim() && !String(bloco.destaque ?? '').trim()
      const proximo = { ...atual }
      if (vazio) delete proximo[idBloco]
      else proximo[idBloco] = bloco
      return proximo
    })
  }

  const aoMudarTexto = (idBloco, idTexto, pedido) =>
    atualizarBloco(idBloco, (bloco) => {
      const textos = { ...(bloco.textos ?? {}) }
      if (pedido) textos[idTexto] = pedido
      else delete textos[idTexto]
      return { ...bloco, textos }
    })

  // `campos`: { nota } ou { destaque }.
  const aoAnotar = (idBloco, campos) => atualizarBloco(idBloco, (bloco) => ({ ...bloco, ...campos }))

  const aoEnviar = (destino, item) =>
    setEnviados((atual) => ({
      ...atual,
      [destino]: [...(atual[destino] ?? []).filter((x) => x.arquivo !== item.arquivo), item],
    }))

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Tutorial />

        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 print:hidden">
          <label htmlFor="nome-quebras" className="type-label text-text-dark block mb-2">
            Quem está respondendo?
          </label>
          <input
            id="nome-quebras"
            type="text"
            value={pessoa.nome}
            onChange={(evento) => setPessoa((atual) => ({ ...atual, nome: evento.target.value }))}
            placeholder="Seu nome e empresa"
            autoComplete="name"
            maxLength={80}
            className="w-full rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
          />
          <p className="type-meta text-text-muted mt-3">
            O mesmo nome das imagens e do roteiro. Medido em{' '}
            <span className="type-numeric">{String(medidas.medidoEm ?? '').split('-').reverse().join('/')}</span>, com a copy
            que está no ar.
          </p>
          <div className="mt-2">
            <AvisoSalvamento estado={salvamento} />
          </div>
        </div>
      </div>

      <nav id="quebras-blocos" aria-label="Blocos de texto" className="flex flex-wrap gap-2 scroll-mt-32 print:hidden">
        {BLOCOS_TEXTO.map((bloco, posicao) => (
          <button
            key={bloco.id}
            type="button"
            onClick={() => irPara(posicao)}
            aria-current={posicao === posicaoAtiva ? 'true' : undefined}
            className={`min-h-11 inline-flex items-center gap-2 px-3 rounded-xl border type-label transition-colors cursor-pointer ${
              posicao === posicaoAtiva
                ? 'border-brand-accent bg-brand-accent/10 text-text-dark'
                : quebras[bloco.id] ? 'border-brand-success/40 bg-state-success-soft text-text-dark' : 'border-line text-text-muted hover:text-text-dark'
            }`}
          >
            <span className="type-numeric text-brand-accent">{String(posicao + 1).padStart(2, '0')}</span>
            {bloco.pagina} · {bloco.parte.split(':')[0]}
          </button>
        ))}
      </nav>

      {BLOCOS_TEXTO.map((bloco, posicao) => (impressao || posicao === posicaoAtiva) && (
        <FichaBloco
          key={bloco.id}
          bloco={bloco}
          numero={posicao + 1}
          resposta={quebras[bloco.id]}
          aoMudarTexto={aoMudarTexto}
          aoAnotar={aoAnotar}
          enviados={enviados}
          aoEnviar={aoEnviar}
          salvamento={salvamento}
        />
      ))}

      {!impressao && (
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => irPara(posicaoAtiva - 1)}
            disabled={posicaoAtiva === 0}
            className="min-h-11 px-4 rounded-xl border border-line type-label text-text-dark hover:border-brand-accent transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            ← Bloco anterior
          </button>
          <span className="type-meta text-text-muted type-numeric">
            Bloco {posicaoAtiva + 1} de {BLOCOS_TEXTO.length}
          </span>
          <button
            type="button"
            onClick={() => irPara(posicaoAtiva + 1)}
            disabled={posicaoAtiva === BLOCOS_TEXTO.length - 1}
            className="min-h-11 px-4 rounded-xl bg-brand-accent text-white type-label hover:bg-brand-glow transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Próximo bloco →
          </button>
        </div>
      )}
    </div>
  )
}
