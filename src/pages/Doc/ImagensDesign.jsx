import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ESPACOS, LOGOS, FROTA, REVISAO, MEDIDO_EM, LIMITE_ENVIO, FORMATOS_ACEITOS,
  caixasDe, recorteDe, alturasDasLogos, areaSegura, nomeDoGrupo,
} from '../../content/marketing-imagens'
import { useArmazenamento, usePessoa } from './hooks'
import { BotaoCopiar, Aviso } from './Pecas'
import { ehImpressao } from './modoImpressao'
import { enviarArquivoDesign, baixarBlob } from './retornos'
import { zipDeEnderecos } from './zip'

/**
 * "Imagens do site: entrega do design", em /doc/marketing.
 *
 * O time de design da Marketins passa a responder por todas as imagens do
 * site. Esta seção é a mesa de trabalho deles: uma ficha por espaço de
 * imagem, com o recorte da tela mostrando exatamente o que troca, o pedido do
 * cliente, a copy que vai junto, o tamanho em que o arquivo deve vir, a
 * imagem de hoje para baixar e o campo para mandar a nova.
 *
 * Os arquivos sobem inteiros para `/api/retornos?arquivo=1` (Vercel Blob
 * privado), sem passar por canvas — é o arquivo final, não um print — e
 * aparecem em /doc/retornos, na seção "Arquivos do design". O navegador
 * guarda a lista do que cada pessoa já mandou, para ela ver ao voltar.
 */

const CAMINHOS = {
  baixar: 'M12 4v11m0 0l-4-4m4 4l4-4M5 19h14',
  subir: 'M12 16V4m0 0L8 8m4-4l4 4M5 20h14',
  abrir: 'M14 5h5v5M19 5l-8 8M18 14v5H5V6h5',
  check: 'M5 13l4 4L19 7',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  imagem: 'M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
}

function Icone({ caminho, className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={caminho} />
    </svg>
  )
}

const BOTAO_SECUNDARIO =
  'min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-line bg-white type-label text-text-dark hover:border-brand-accent hover:text-brand-accent transition-colors cursor-pointer'

const megas = (bytes) => `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
const quilos = (bytes) =>
  bytes >= 1024 * 1024 ? megas(bytes) : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('pt-BR')} KB`
const medida = ([largura, altura]) => `${largura.toLocaleString('pt-BR')} × ${altura.toLocaleString('pt-BR')} px`

const hora = (iso) => {
  if (!iso) return ''
  const data = new Date(iso)
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const extensaoDe = (nome) => String(nome ?? '').toLowerCase().split('.').pop()

/* -------------------------------------------------------------- recorte -- */

function formatoInicial() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop'
  return window.matchMedia('(max-width: 639px)').matches ? 'celular' : 'desktop'
}

/* O recorte da seção com o espaço contornado. Computador e celular, um de
   cada vez: o do celular é alto, e lado a lado o cartão ficaria com um vão. */
function Recorte({ id, titulo }) {
  const impressao = ehImpressao()
  const [formato, setFormato] = useState(formatoInicial)
  const atual = recorteDe(id, impressao ? 'desktop' : formato)
  const outros = [
    ['desktop', 'Computador'],
    ['celular', 'Celular'],
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 print:hidden">
        <div className="inline-flex rounded-xl border border-line bg-white p-1" role="group" aria-label="Formato do recorte">
          {outros.map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => setFormato(chave)}
              aria-pressed={formato === chave}
              className={`min-h-11 px-4 rounded-lg type-label transition-colors cursor-pointer ${
                formato === chave ? 'bg-brand-accent text-white' : 'text-text-muted hover:text-text-dark'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {atual && (
          <a
            href={atual.caminho}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 inline-flex items-center gap-1.5 px-2 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer"
          >
            Abrir em tamanho real
            <Icone caminho={CAMINHOS.abrir} />
          </a>
        )}
      </div>

      {atual ? (
        <img
          src={atual.caminho}
          alt={`${titulo}: recorte da tela no ${formato === 'desktop' ? 'computador' : 'celular'}, com o espaço da imagem contornado`}
          width={atual.largura}
          height={atual.altura}
          loading="lazy"
          decoding="async"
          className={`block rounded-xl border border-line bg-white h-auto ${
            formato === 'celular' && !impressao ? 'w-auto max-w-full max-h-[70vh] mx-auto' : 'w-full'
          }`}
        />
      ) : (
        <p className="type-meta text-text-muted rounded-xl border border-line bg-white p-6 text-center">
          Recorte ainda não gerado. Rode <code>node scripts/capturar-espacos.mjs</code>.
        </p>
      )}
    </div>
  )
}

/* ----------------------------------------------------------- partes -- */

function Pedido({ texto, leitura, duvida }) {
  return (
    <div>
      <p className="type-label text-text-muted mb-2">Pedido do cliente</p>
      <blockquote className="border-l-2 border-brand-accent pl-4">
        <p className="type-body text-text-dark">“{texto}”</p>
        <footer className="type-meta text-text-muted mt-1">
          {REVISAO.quem}, revisão de <span className="type-numeric">{REVISAO.data}</span>
        </footer>
      </blockquote>
      {duvida && (
        <p className="type-body text-text-dark mt-3 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-4 py-3">
          <strong>Dúvida em aberto:</strong> {duvida}
        </p>
      )}
      {leitura && <p className="type-meta text-text-muted mt-3">{leitura}</p>}
    </div>
  )
}

/* Desenho da área segura: o arquivo inteiro e, tracejado, o miolo que aparece
   em todas as telas. Proporção real, então dá para ver de relance quanto cada
   lado perde. */
function DesenhoAreaSegura({ exportar, area }) {
  return (
    <div
      className="relative w-full max-w-[220px] rounded-lg bg-surface-sunken"
      style={{ aspectRatio: `${exportar[0]} / ${exportar[1]}` }}
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-dashed border-brand-accent bg-brand-accent/10"
        style={{ width: `${area.pctLargura}%`, height: `${area.pctAltura}%` }}
      />
    </div>
  )
}

function Especificacao({ linhas, nome, aviso }) {
  return (
    <div>
      <p className="type-label text-text-muted mb-2">Especificação</p>
      <dl className="rounded-xl border border-line divide-y divide-line-soft">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="px-4 py-3 sm:flex sm:gap-4">
            <dt className="type-meta text-text-muted sm:w-28 sm:shrink-0">{rotulo}</dt>
            <dd className="type-body text-text-dark mt-0.5 sm:mt-0 min-w-0">{valor}</dd>
          </div>
        ))}
        {nome && (
          <div className="px-4 py-2 sm:flex sm:items-center sm:gap-4">
            <dt className="type-meta text-text-muted sm:w-28 sm:shrink-0">Nome do arquivo</dt>
            <dd className="flex items-center gap-1 min-w-0">
              <code className="type-meta text-text-dark break-words min-w-0">{nome}</code>
              <BotaoCopiar texto={nome} rotulo="Copiar o nome do arquivo" compacto />
            </dd>
          </div>
        )}
      </dl>
      {aviso}
    </div>
  )
}

function NaTela({ caixas }) {
  return (
    <ul className="space-y-0.5">
      {caixas.map((caixa) => (
        <li key={caixa.formato}>
          {caixa.rotulo}:{' '}
          <span className="type-numeric whitespace-nowrap">
            {caixa.largura} × {caixa.altura}
          </span>
        </li>
      ))}
    </ul>
  )
}

function CopyAprovada({ copy }) {
  // Aberta: é o texto com que a imagem vai conversar, e o designer precisa
  // dele à vista. Quem quiser a ficha curta fecha.
  return (
    <details className="group rounded-xl border border-line bg-surface-light" open>
      <summary className="min-h-11 flex items-center justify-between gap-3 px-4 cursor-pointer list-none">
        <span className="type-label text-text-dark">
          Copy aprovada desta parte · <span className="type-numeric">{copy.textos.length}</span>{' '}
          {copy.textos.length === 1 ? 'texto' : 'textos'}
        </span>
        <svg className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180 print:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="px-4 pb-4">
        <p className="type-meta text-text-muted mb-3">
          O que está no ar hoje, já com a revisão do cliente aplicada. A imagem conversa com estes textos.
        </p>
        <ul className="space-y-2.5">
          {copy.textos.map((item, indice) => (
            <li key={indice}>
              <p className="type-meta text-text-muted">{item.tipo}</p>
              <p className="type-body text-text-dark">{item.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

function BaixarAtual({ src, nome, rotulo = 'Baixar a imagem atual' }) {
  return (
    <a href={src} download={nome} className={`${BOTAO_SECUNDARIO} print:hidden`}>
      <Icone caminho={CAMINHOS.baixar} />
      {rotulo}
    </a>
  )
}

/* "Baixar todas" de um bloco: monta um .zip no navegador com os arquivos de
   hoje, com o nome que cada um teria no download avulso. */
function BaixarTodas({ itens, nomeZip, rotulo }) {
  const [estado, setEstado] = useState('ocioso')
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={estado === 'montando'}
        aria-busy={estado === 'montando'}
        onClick={async () => {
          setEstado('montando')
          try {
            baixarBlob(await zipDeEnderecos(itens), nomeZip)
            setEstado('ocioso')
          } catch {
            setEstado('erro')
          }
        }}
        className="min-h-11 inline-flex items-center gap-2 px-5 rounded-xl bg-brand-accent hover:bg-brand-glow disabled:opacity-60 text-white type-label transition-colors cursor-pointer"
      >
        <Icone caminho={CAMINHOS.baixar} />
        {estado === 'montando' ? 'Preparando o .zip…' : rotulo}
      </motion.button>
      {estado === 'erro' && (
        <span role="alert" className="type-meta text-state-error">
          Não consegui montar o .zip. Baixe uma a uma.
        </span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------- envio -- */

const MENSAGEM_ESTADO = {
  enviando: 'Enviando…',
  enviado: 'Chegou à equipe',
  local: 'Só neste navegador: o servidor não guardou',
  erro: null,
}

/* Confere no navegador o que o servidor recusaria, para a pessoa saber na
   hora — e sem gastar um envio de 3 MB para ouvir "não". */
function problemaDe(arquivo) {
  const extensao = extensaoDe(arquivo.name)
  const tipo = FORMATOS_ACEITOS.tipos[extensao]
  if (!tipo) return { erro: 'Formato não aceito: use JPG, PNG, WEBP ou SVG.' }
  if (arquivo.size > LIMITE_ENVIO) {
    return { erro: `Tem ${megas(arquivo.size)}; o limite é 3 MB. Exporte com mais compressão ou mande por link à equipe.` }
  }
  if (!arquivo.size) return { erro: 'Arquivo vazio.' }
  return { tipo }
}

/**
 * Campo de envio de um destino (um espaço, as logos, um grupo da frota).
 *
 * Aceita vários arquivos de uma vez, por clique ou arrastando. Cada um sobe
 * sozinho, em sequência, e a lista mostra o estado de cada um. O que já
 * chegou fica guardado no navegador (`enviados`), para a pessoa ver o que
 * mandou quando voltar; a prévia só existe na visita em que foi enviado.
 */
function Envio({ destino, rotulo, enviados = [], aoEnviar, compacto = false }) {
  const [pessoa] = usePessoa()
  const [fila, setFila] = useState([])
  const [arrastando, setArrastando] = useState(false)
  const previas = useRef(new Map())
  const liberado = Boolean(pessoa.nome.trim())
  const ocupado = fila.some((item) => item.estado === 'enviando')
  const idCampo = `envio-${destino}`

  // As prévias são object URLs: soltas quando o cartão sai da tela.
  useEffect(() => {
    const mapa = previas.current
    return () => mapa.forEach((endereco) => URL.revokeObjectURL(endereco))
  }, [])

  const enviar = async (lista) => {
    if (!liberado) return
    const novos = [...lista].map((arquivo, indice) => ({
      chave: `${Date.now()}-${indice}-${arquivo.name}`,
      arquivo,
      original: arquivo.name,
      tamanho: arquivo.size,
      ...problemaDe(arquivo),
    }))
    setFila((atual) => [
      ...novos.map(({ chave, original, tamanho, erro }) => ({
        chave,
        original,
        tamanho,
        estado: erro ? 'erro' : 'enviando',
        mensagem: erro,
      })),
      ...atual.filter((item) => item.estado !== 'enviado' && item.estado !== 'local'),
    ])

    for (const item of novos) {
      if (item.erro) continue
      try {
        const resultado = await enviarArquivoDesign({
          id: pessoa.id,
          nome: pessoa.nome.trim(),
          espaco: destino,
          arquivo: item.arquivo,
          tipo: item.tipo,
        })
        if (item.tipo !== 'image/svg+xml') {
          const anterior = previas.current.get(resultado.arquivo)
          if (anterior) URL.revokeObjectURL(anterior)
          previas.current.set(resultado.arquivo, URL.createObjectURL(item.arquivo))
        }
        aoEnviar(destino, {
          arquivo: resultado.arquivo,
          original: item.original,
          tamanho: resultado.tamanho ?? item.tamanho,
          enviadoEm: resultado.enviadoEm ?? new Date().toISOString(),
          salvo: Boolean(resultado.salvo),
        })
        setFila((atual) =>
          atual.map((x) => (x.chave === item.chave ? { ...x, estado: resultado.salvo ? 'enviado' : 'local', arquivo: resultado.arquivo } : x)),
        )
      } catch (erro) {
        const mensagem = erro instanceof TypeError ? 'Sem conexão agora. Tente de novo em instantes.' : erro.message
        setFila((atual) => atual.map((x) => (x.chave === item.chave ? { ...x, estado: 'erro', mensagem } : x)))
      }
    }
  }

  const escolher = (evento) => {
    const arquivos = evento.target.files
    if (arquivos?.length) enviar(arquivos)
    // Limpa para que escolher o mesmo arquivo de novo dispare outra vez.
    evento.target.value = ''
  }

  // Na lista: o que está subindo ou falhou nesta visita, e depois o que já
  // chegou (guardado no navegador), do mais novo para o mais antigo.
  const pendentes = fila.filter((item) => item.estado === 'enviando' || item.estado === 'erro')
  const chegaram = [...enviados].sort((a, b) => String(b.enviadoEm).localeCompare(String(a.enviadoEm)))

  return (
    <div
      onDragOver={(evento) => {
        if (!liberado) return
        evento.preventDefault()
        setArrastando(true)
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(evento) => {
        evento.preventDefault()
        setArrastando(false)
        if (liberado && evento.dataTransfer?.files?.length) enviar(evento.dataTransfer.files)
      }}
      className={`rounded-xl border border-dashed p-4 transition-colors print:hidden ${
        arrastando ? 'border-brand-accent bg-brand-accent/10' : 'border-line bg-surface-light'
      }`}
    >
      {!compacto && <p className="type-label text-text-dark mb-2">{rotulo ?? 'Enviar arquivo novo'}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label
          htmlFor={idCampo}
          className={`min-h-11 inline-flex items-center gap-2 px-4 rounded-xl border type-label transition-colors focus-within:ring-2 focus-within:ring-brand-accent ${
            liberado && !ocupado
              ? 'border-brand-accent/40 bg-white text-brand-accent hover:bg-brand-accent/10 cursor-pointer'
              : 'border-line bg-white text-text-muted cursor-not-allowed'
          }`}
        >
          <input
            id={idCampo}
            type="file"
            multiple
            accept={FORMATOS_ACEITOS.accept}
            disabled={!liberado || ocupado}
            onChange={escolher}
            className="sr-only"
          />
          <Icone caminho={CAMINHOS.subir} />
          {ocupado ? 'Enviando…' : compacto ? 'Enviar foto nova' : 'Enviar arquivo novo'}
        </label>
        <p className="type-meta text-text-muted">
          {liberado ? (
            <>JPG, PNG, WEBP ou SVG, até 3 MB cada. Pode mandar mais de um, ou arrastar até aqui.</>
          ) : (
            <>
              <a href="#quem-envia" className="text-brand-accent hover:text-brand-glow underline underline-offset-2">
                Escreva seu nome
              </a>{' '}
              para enviar.
            </>
          )}
        </p>
      </div>

      {(pendentes.length > 0 || chegaram.length > 0) && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {pendentes.map((item) => (
            <li key={item.chave} className="flex items-start gap-3 rounded-lg bg-white border border-line px-3 py-2">
              <span className={`mt-0.5 ${item.estado === 'erro' ? 'text-state-error' : 'text-text-muted'}`}>
                <Icone caminho={item.estado === 'erro' ? CAMINHOS.alerta : CAMINHOS.subir} />
              </span>
              <div className="min-w-0">
                <p className="type-body text-text-dark break-all">{item.original}</p>
                <p className={`type-meta ${item.estado === 'erro' ? 'text-state-error' : 'text-text-muted'}`}>
                  {item.estado === 'erro' ? item.mensagem : MENSAGEM_ESTADO[item.estado]}
                </p>
              </div>
            </li>
          ))}
          {chegaram.map((item) => {
            const previa = previas.current.get(item.arquivo)
            return (
              <li key={item.arquivo} className="flex items-center gap-3 rounded-lg bg-white border border-line px-3 py-2">
                {previa ? (
                  <img src={previa} alt="" className="w-12 h-12 rounded-md object-contain bg-surface-muted shrink-0" />
                ) : (
                  <span className="w-12 h-12 rounded-md bg-surface-muted text-text-muted inline-flex items-center justify-center shrink-0">
                    <Icone caminho={CAMINHOS.imagem} className="w-5 h-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="type-body text-text-dark break-all">{item.arquivo}</p>
                  <p className="type-meta text-text-muted">
                    <span className="type-numeric">{quilos(item.tamanho)}</span> ·{' '}
                    <span className="type-numeric">{hora(item.enviadoEm)}</span> ·{' '}
                    {item.salvo ? (
                      <span className="text-text-dark">Chegou à equipe</span>
                    ) : (
                      <span className="text-state-error">{MENSAGEM_ESTADO.local}</span>
                    )}
                  </p>
                </div>
                <span className={`ml-auto ${item.salvo ? 'text-brand-success' : 'text-state-error'}`}>
                  <Icone caminho={item.salvo ? CAMINHOS.check : CAMINHOS.alerta} />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ cartões -- */

function CabecalhoFicha({ id, pagina, parte, rota, numero }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-line">
      <div className="min-w-0">
        <p className="type-label text-brand-accent">
          {numero != null && <span className="type-numeric mr-2">{String(numero).padStart(2, '0')}</span>}
          {pagina}
        </p>
        <h4 id={`titulo-${id}`} className="type-subtitle text-text-dark mt-1 text-balance">{parte}</h4>
      </div>
      <a
        href={rota}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-11 inline-flex items-center gap-1.5 type-label text-text-muted hover:text-brand-accent transition-colors cursor-pointer print:hidden"
      >
        Ver no site
        <Icone caminho={CAMINHOS.abrir} />
      </a>
    </header>
  )
}

function FichaEspaco({ espaco, numero, enviados, aoEnviar }) {
  const caixas = caixasDe(espaco.id)
  const area = espaco.corte === 'cover' ? areaSegura(espaco.id, espaco.exportar) : null
  const compartilhada = espaco.compartilhada ? ESPACOS.find((outro) => outro.id === espaco.compartilhada) : null

  const linhas = [
    ['Proporção', espaco.proporcao],
    ['Exportar em', <span key="e" className="type-numeric">{medida(espaco.exportar)}</span>],
    ['Formato', espaco.formato],
    ['Peso máximo', `${espaco.peso} (o envio aceita até 3 MB)`],
    ['Na tela hoje', <NaTela key="t" caixas={caixas} />],
    [
      'Corte',
      espaco.corte === 'cover'
        ? 'A caixa tem forma própria em cada tela e corta a imagem a partir do centro.'
        : 'Aparece inteira. A altura da caixa segue o arquivo: fora da proporção, a seção muda de altura.',
    ],
  ]

  return (
    <article
      id={`espaco-${espaco.id}`}
      aria-labelledby={`titulo-${espaco.id}`}
      className="scroll-mt-28 rounded-2xl border border-line bg-white overflow-clip print:break-inside-avoid"
    >
      <CabecalhoFicha id={espaco.id} numero={numero} pagina={espaco.pagina} parte={espaco.parte} rota={espaco.rota} />

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="bg-surface-light p-4 sm:p-5 border-b border-line lg:border-b-0 lg:border-r">
          <Recorte id={espaco.id} titulo={espaco.parte} />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`w-16 h-12 rounded-lg overflow-clip border border-line shrink-0 ${espaco.transparente ? 'bg-brand-navy' : 'bg-white'}`}
            >
              <img src={espaco.atual.src} alt="" className="w-full h-full object-contain" loading="lazy" decoding="async" />
            </span>
            <div className="min-w-0 mr-auto">
              <p className="type-meta text-text-dark break-all">{espaco.atual.arquivo}</p>
              <p className="type-meta text-text-muted">
                Hoje: <span className="type-numeric">{medida([espaco.atual.largura, espaco.atual.altura])}</span>
              </p>
            </div>
            <BaixarAtual src={espaco.atual.src} nome={`atual-${espaco.nome.replace(/\.[a-z]+$/, '')}.webp`} />
          </div>

          <div className="mt-6">
            <CopyAprovada copy={espaco.copy} />
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 min-w-0">
          <Pedido texto={espaco.pedido} leitura={espaco.leitura} />

          <Especificacao
            linhas={linhas}
            nome={espaco.nome}
            aviso={
              <>
                {area && (
                  <div className="mt-3 rounded-xl border border-line p-4 flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <DesenhoAreaSegura exportar={espaco.exportar} area={area} />
                    <p className="type-meta text-text-dark">
                      <strong>Área segura:</strong>{' '}
                      <span className="type-numeric">{medida([area.largura, area.altura])}</span> no centro do arquivo
                      (<span className="type-numeric">{area.pctLargura}%</span> da largura,{' '}
                      <span className="type-numeric">{area.pctAltura}%</span> da altura). Rosto, carro e logotipo ficam
                      dentro do tracejado: o resto aparece numa tela e some noutra.
                    </p>
                  </div>
                )}
                {compartilhada && (
                  <p className="type-meta text-text-dark mt-3 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-4 py-3">
                    Hoje este espaço usa o mesmo arquivo de <strong>{compartilhada.pagina} · {compartilhada.parte}</strong>.
                    Mande um arquivo para cada um: as duas fichas pedem coisas diferentes.
                  </p>
                )}
              </>
            }
          />

          <Envio destino={espaco.id} enviados={enviados[espaco.id]} aoEnviar={aoEnviar} />
        </div>
      </div>
    </article>
  )
}

function FichaLogos({ numero, enviados, aoEnviar }) {
  const temos = LOGOS.marcas.filter((marca) => marca.atual)
  const alturas = alturasDasLogos()

  return (
    <article
      id={`espaco-${LOGOS.id}`}
      aria-labelledby={`titulo-${LOGOS.id}`}
      className="scroll-mt-28 rounded-2xl border border-line bg-white overflow-clip"
    >
      <CabecalhoFicha id={LOGOS.id} numero={numero} pagina={LOGOS.pagina} parte={LOGOS.parte} rota={LOGOS.rota} />

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="bg-surface-light p-4 sm:p-5 border-b border-line lg:border-b-0 lg:border-r space-y-6">
          <Recorte id={LOGOS.id} titulo="Faixa de montadoras" />
          <Pedido texto={LOGOS.pedido} />
          <CopyAprovada copy={LOGOS.copy} />
        </div>

        <div className="p-5 sm:p-6 space-y-6 min-w-0">
          <div>
            <p className="type-label text-text-muted mb-2">Regra de simetria</p>
            <ul className="space-y-3">
              {LOGOS.regras.map((regra) => (
                <li key={regra.titulo}>
                  <p className="type-body text-text-dark font-semibold">{regra.titulo}</p>
                  <p className="type-meta text-text-muted mt-0.5">{regra.texto}</p>
                </li>
              ))}
            </ul>
          </div>

          <Especificacao
            linhas={[
              ['Formato', LOGOS.formato],
              ['Peso máximo', LOGOS.peso],
              [
                'Altura na tela',
                <ul key="a" className="space-y-0.5">
                  {alturas.map((item) => (
                    <li key={item.formato}>
                      {item.rotulo}: <span className="type-numeric">{item.altura} px</span>
                    </li>
                  ))}
                </ul>,
              ],
            ]}
            nome={LOGOS.nome}
          />
        </div>
      </div>

      <div className="border-t border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <h5 className="type-subtitle text-text-dark">
            As doze marcas · <span className="type-numeric">{temos.length}</span> temos,{' '}
            <span className="type-numeric">{LOGOS.marcas.length - temos.length}</span> faltam
          </h5>
          <p className="type-meta text-text-muted">A {LOGOS.sai} sai da faixa.</p>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {LOGOS.marcas.map((marca) => (
            <li key={marca.id} className="rounded-xl border border-line p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="type-body text-text-dark font-semibold">{marca.nome}</span>
                <span
                  className={`type-label px-2 py-0.5 rounded-full border ${
                    marca.atual
                      ? 'bg-state-success-soft border-brand-success/40 text-text-dark'
                      : 'bg-brand-gold/10 border-brand-gold/40 text-text-dark'
                  }`}
                >
                  {marca.atual ? 'Temos' : 'Falta'}
                </span>
              </div>
              <div className="h-16 rounded-lg bg-surface-muted flex items-center justify-center">
                {marca.atual ? (
                  <img
                    src={marca.atual.src}
                    alt={`Logo atual da ${marca.nome}`}
                    width={marca.atual.largura}
                    height={marca.atual.altura}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <code className="type-meta text-text-muted">logo-{marca.id}.svg</code>
                )}
              </div>
              {marca.atual && (
                <a
                  href={marca.atual.src}
                  download={`atual-logo-${marca.id}.webp`}
                  className="min-h-11 -mb-1 inline-flex items-center gap-1.5 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer print:hidden"
                >
                  <Icone caminho={CAMINHOS.baixar} />
                  Baixar
                  <span className="type-meta text-text-muted">
                    · <span className="type-numeric">{marca.atual.largura}×{marca.atual.altura}</span>
                  </span>
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden">
          <BaixarTodas
            itens={temos.map((marca) => ({ nome: `atual-logo-${marca.id}.webp`, endereco: marca.atual.src }))}
            nomeZip="locafacil-logos-atuais.zip"
            rotulo={`Baixar as ${temos.length} logos`}
          />
          <p className="type-meta text-text-muted max-w-md">
            São as de hoje, cromadas e pequenas (até 121 px de largura): servem de referência, não de matriz.
          </p>
        </div>

        <div className="mt-6">
          <Envio destino={LOGOS.id} rotulo="Enviar logos novas" enviados={enviados[LOGOS.id]} aoEnviar={aoEnviar} />
        </div>
      </div>
    </article>
  )
}

function FichaFrota({ numero, enviados, aoEnviar }) {
  const caixas = caixasDe(FROTA.id)
  const nomeAtual = (grupo) => `atual-${nomeDoGrupo(grupo)}.webp`

  return (
    <article
      id={`espaco-${FROTA.id}`}
      aria-labelledby={`titulo-${FROTA.id}`}
      className="scroll-mt-28 rounded-2xl border border-line bg-white overflow-clip"
    >
      <CabecalhoFicha id={FROTA.id} numero={numero} pagina={FROTA.pagina} parte={FROTA.parte} rota="/reservar" />

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="bg-surface-light p-4 sm:p-5 border-b border-line lg:border-b-0 lg:border-r">
          <Recorte id={FROTA.id} titulo="Lista de veículos" />
          <div className="mt-6">
            <p className="type-label text-text-muted mb-2">Como fotografar</p>
            <ul className="space-y-1.5 list-disc pl-5 type-meta text-text-dark">
              {FROTA.regras.map((regra) => (
                <li key={regra}>{regra}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-6 min-w-0">
          <Pedido texto={FROTA.pedido} duvida={FROTA.duvida} leitura={FROTA.leitura} />
          <Especificacao
            linhas={[
              ['Proporção', `${FROTA.proporcao} (a placa do cartão)`],
              ['Exportar em', <span key="e" className="type-numeric">{medida(FROTA.exportar)}</span>],
              ['Formato', FROTA.formato],
              ['Peso máximo', FROTA.peso],
              ['Na tela hoje', <NaTela key="t" caixas={caixas} />],
            ]}
            nome={FROTA.nome}
          />
        </div>
      </div>

      <div className="border-t border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h5 className="type-subtitle text-text-dark">
            Os <span className="type-numeric">{FROTA.grupos.length}</span> grupos
          </h5>
          <span className="print:hidden">
            <BaixarTodas
              itens={FROTA.grupos.map((grupo) => ({ nome: nomeAtual(grupo), endereco: grupo.atual }))}
              nomeZip="locafacil-frota-fotos-atuais.zip"
              rotulo={`Baixar as ${FROTA.grupos.length} fotos atuais`}
            />
          </span>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FROTA.grupos.map((grupo) => {
            const destino = `frota-${grupo.codigo.toLowerCase()}`
            return (
              <li key={grupo.codigo} className="rounded-xl border border-line p-4 flex flex-col gap-3 print:break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="type-body text-text-dark font-semibold">
                    Grupo <span className="type-numeric">{grupo.codigo}</span> · {grupo.modelo}
                  </p>
                  <p className="type-meta text-text-muted">{grupo.categoria}</p>
                </div>
                <img
                  src={grupo.atual}
                  alt={`Foto atual do grupo ${grupo.codigo}, ${grupo.modelo}`}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto rounded-lg border border-line bg-white"
                />
                {grupo.observacao && (
                  <p className="type-meta text-text-dark rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-3 py-2">
                    {grupo.observacao}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={grupo.atual}
                    download={nomeAtual(grupo)}
                    className="min-h-11 inline-flex items-center gap-1.5 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer print:hidden"
                  >
                    <Icone caminho={CAMINHOS.baixar} />
                    Baixar a foto atual
                  </a>
                  <span className="type-meta text-text-muted">
                    Hoje <span className="type-numeric">800×600</span>
                  </span>
                </div>
                <code className="type-meta text-text-muted break-words">{nomeDoGrupo(grupo)}.png</code>
                <div className="mt-auto">
                  <Envio destino={destino} enviados={enviados[destino]} aoEnviar={aoEnviar} compacto />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}

/* --------------------------------------------------------------- seção -- */

export default function ImagensDesign() {
  const [pessoa, setPessoa] = usePessoa()
  const [enviados, setEnviados] = useArmazenamento('locafacil_doc_design_envios', {})

  const aoEnviar = (destino, item) =>
    setEnviados((atual) => ({
      ...atual,
      [destino]: [...(atual[destino] ?? []).filter((x) => x.arquivo !== item.arquivo), item],
    }))

  const quantos = (destino) => (enviados[destino] ?? []).filter((item) => item.salvo).length
  const quantosFrota = FROTA.grupos.reduce((soma, grupo) => soma + quantos(`frota-${grupo.codigo.toLowerCase()}`), 0)

  const indice = [
    ...ESPACOS.map((espaco) => ({
      id: espaco.id,
      rotulo: `${espaco.pagina} · ${espaco.parte}`,
      tamanho: medida(espaco.exportar),
      enviados: quantos(espaco.id),
    })),
    { id: LOGOS.id, rotulo: 'Home · Logos das montadoras', tamanho: 'SVG · 240 px de altura', enviados: quantos(LOGOS.id) },
    { id: FROTA.id, rotulo: 'Reserva · Fotos da frota (7 grupos)', tamanho: medida(FROTA.exportar), enviados: quantosFrota },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-surface-light p-5 sm:p-6">
          <p className="type-label text-brand-accent mb-3">Como entregar</p>
          <ol className="space-y-2 type-body text-text-dark list-decimal pl-5">
            <li>Escreva seu nome aqui ao lado. É ele que diz à equipe de quem é cada arquivo.</li>
            <li>Em cada ficha: o recorte mostra o que troca, com o resto da tela apagado. Ao lado, o pedido do cliente e a copy que vai junto.</li>
            <li>Exporte no tamanho, no formato e com o nome sugeridos.</li>
            <li>Envie pela própria ficha. Pode mandar mais de uma opção; mesmo nome substitui.</li>
          </ol>
        </div>

        <div id="quem-envia" className="scroll-mt-28 rounded-2xl border border-line bg-white p-5 sm:p-6 print:hidden">
          <label htmlFor="nome-design" className="type-label text-text-dark block mb-2">
            Quem está enviando?
          </label>
          <input
            id="nome-design"
            type="text"
            value={pessoa.nome}
            onChange={(evento) => setPessoa((atual) => ({ ...atual, nome: evento.target.value }))}
            placeholder="Seu nome e empresa"
            autoComplete="name"
            maxLength={80}
            className="w-full rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
          />
          <p className="type-meta text-text-muted mt-3">
            Os arquivos chegam inteiros, sem recompressão, e só a equipe do projeto vê. Até 3 MB por arquivo: maior
            que isso, mande por link à equipe.
          </p>
        </div>
      </div>

      <nav aria-label="Espaços de imagem" className="rounded-2xl border border-line bg-white">
        <p className="type-label text-text-muted px-5 sm:px-6 pt-4 pb-2">
          <span className="type-numeric">{indice.length}</span> espaços · medidos em{' '}
          <span className="type-numeric">{MEDIDO_EM?.split('-').reverse().join('/')}</span> a 1440, 768 e 390 px · exportar no dobro da maior caixa
        </p>
        <ol className="divide-y divide-line-soft">
          {indice.map((item, posicao) => (
            <li key={item.id}>
              <a
                href={`#espaco-${item.id}`}
                className="min-h-11 flex flex-wrap items-center gap-x-4 gap-y-0.5 px-5 sm:px-6 py-2.5 hover:bg-surface-light transition-colors cursor-pointer"
              >
                <span className="type-numeric type-label text-brand-accent w-6">{String(posicao + 1).padStart(2, '0')}</span>
                <span className="type-body text-text-dark flex-1 min-w-[12rem]">{item.rotulo}</span>
                <span className="type-meta type-numeric text-text-muted">{item.tamanho}</span>
                {item.enviados > 0 && (
                  <span className="type-label text-text-dark bg-state-success-soft border border-brand-success/40 rounded-full px-2 py-0.5">
                    <span className="type-numeric">{item.enviados}</span> enviado{item.enviados === 1 ? '' : 's'}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <h3 className="type-subtitle text-text-dark pt-2">Fotos das seções</h3>
      {ESPACOS.map((espaco, posicao) => (
        <FichaEspaco key={espaco.id} espaco={espaco} numero={posicao + 1} enviados={enviados} aoEnviar={aoEnviar} />
      ))}

      <h3 className="type-subtitle text-text-dark pt-2">Logos das montadoras</h3>
      <FichaLogos numero={ESPACOS.length + 1} enviados={enviados} aoEnviar={aoEnviar} />

      <h3 className="type-subtitle text-text-dark pt-2">Fotos da frota</h3>
      <FichaFrota numero={ESPACOS.length + 2} enviados={enviados} aoEnviar={aoEnviar} />

      <Aviso titulo="Depois do envio">
        <p>
          Cada arquivo chega à equipe do projeto com o seu nome e o espaço de destino. A equipe confere o tamanho, aplica no
          site e avisa. Se precisar mudar algo, mande de novo com o mesmo nome: o arquivo anterior é substituído.
        </p>
      </Aviso>
    </div>
  )
}
