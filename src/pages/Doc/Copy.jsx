import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../../assets/brand/logo-lockup-pingo.svg'
import { useArmazenamento, useSemIndice } from './hooks'
import { salvarRetorno, novoIdentificador } from './retornos'
import {
  INVENTARIO, DECKS, TODAS_AS_DOBRAS, CHAVE_VALIDA, LIMITE_LIVRE,
  dobrasDoDeck, enderecoPptx, classeCampo, nomeCurto, mudou, situacaoDaDobra,
  linhaDeResumo, mudancasDe, useCapturas, ICONES,
} from './copyRevisao'
import { CampoAnexo, AvisoSalvamento, Previa, SeloSituacao, Icone } from './CopyPecas'
import CopyPainel from './CopyPainel'

/* Prazo combinado com o marketing. Escrito à mão pelo mesmo motivo do rótulo
   da reunião em `documentacao.js`: "sexta-feira, 02/10" lê melhor no meio da
   frase do que qualquer formatação automática. */
const PRAZO = 'sexta-feira, 02/10'

const VAZIO = { textos: {}, dobras: {}, livre: {} }

const ITEM_POR_ID = new Map(TODAS_AS_DOBRAS.map((item, indice) => [item.dobra.id, { ...item, indice }]))

const quando = (iso) => {
  const data = new Date(iso)
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/* Observação, anexo e "concluída" de uma dobra, só com o que existe. Bloco
   vazio não vai para o servidor: abrir a caixa e desistir não é resposta. */
function blocoParaEnvio(bloco, { comRevisada = true } = {}) {
  if (!bloco || typeof bloco !== 'object') return null
  const nota = String(bloco.nota ?? '')
  const saida = {}
  if (nota.trim()) saida.nota = nota
  if (bloco.anexo) saida.anexo = bloco.anexo
  if (comRevisada && bloco.revisada === true) saida.revisada = true
  return Object.keys(saida).length ? saida : null
}

function comBloco(respostas, alvo, mudanca) {
  if (alvo === 'livre') return { ...respostas, livre: { ...respostas.livre, ...mudanca } }
  return {
    ...respostas,
    dobras: { ...respostas.dobras, [alvo]: { ...respostas.dobras?.[alvo], ...mudanca } },
  }
}

/* A dobra aberta vive no endereço (`#home-02-topo`): o "voltar" do celular
   fecha o painel em vez de sair da página, e o link leva direto a uma parte. */
const dobraDoEndereco = () => {
  if (typeof window === 'undefined') return null
  const id = decodeURIComponent(window.location.hash.slice(1))
  return ITEM_POR_ID.has(id) ? id : null
}

/**
 * Salvamento automático no servidor, 1,2 s depois da última alteração.
 *
 * `corpo` nulo quer dizer "não salvar" (sem nome, ou nada respondido ainda).
 * Os envios saem um de cada vez: com dois no ar, o mais velho podia chegar
 * por último e sobrescrever o mais novo. O que muda durante um envio espera
 * na fila e sai logo depois.
 *
 * Quando a aba some — trocou de aplicativo, bloqueou o celular, fechou —, o
 * que ainda estava na espera sai na hora, com `keepalive`, para a última
 * frase não ficar só no navegador.
 */
function useSalvamento(corpo) {
  const assinatura = corpo ? JSON.stringify(corpo) : null
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const [confirmada, setConfirmada] = useState(null)
  const emVoo = useRef(false)
  const fila = useRef(null)
  const ultima = useRef(null)
  const atual = useRef(null)

  const enviar = useCallback(async function enviarAgora(texto) {
    if (emVoo.current) {
      fila.current = texto
      return
    }
    emVoo.current = true
    setEstado({ tipo: 'salvando' })
    try {
      const resultado = await salvarRetorno(JSON.parse(texto))
      ultima.current = texto
      setConfirmada(texto)
      setEstado(resultado.salvo ? { tipo: 'salvo', em: resultado.atualizadoEm } : { tipo: 'local' })
    } catch (erro) {
      setEstado({ tipo: 'erro', mensagem: erro.message })
    } finally {
      emVoo.current = false
      const proxima = fila.current
      fila.current = null
      if (proxima && proxima !== ultima.current) enviarAgora(proxima)
    }
  }, [])

  useEffect(() => {
    atual.current = assinatura
    if (!assinatura || assinatura === ultima.current) return undefined
    const timer = setTimeout(() => enviar(assinatura), 1200)
    return () => clearTimeout(timer)
  }, [assinatura, enviar])

  useEffect(() => {
    const aoEsconder = () => {
      if (document.visibilityState !== 'hidden') return
      const texto = atual.current
      if (!texto || texto === ultima.current) return
      salvarRetorno(JSON.parse(texto), { keepalive: true })
        .then(() => {
          ultima.current = texto
        })
        .catch(() => {
          // O salvamento normal tenta de novo quando a aba voltar.
        })
    }
    document.addEventListener('visibilitychange', aoEsconder)
    return () => document.removeEventListener('visibilitychange', aoEsconder)
  }, [])

  const tentarDeNovo = useCallback(() => {
    if (atual.current) enviar(atual.current)
  }, [enviar])

  // Enquanto o que está na tela não é o que o servidor confirmou, está
  // salvando — inclusive no intervalo de espera. O erro fica à vista até a
  // próxima tentativa, para o "tentar de novo" não sumir debaixo do dedo.
  const pendente = Boolean(assinatura) && assinatura !== confirmada
  const exibido = estado.tipo !== 'erro' && pendente ? { tipo: 'salvando' } : estado

  return { estado: exibido, tentarDeNovo }
}

/* Os PPTX são gravados à parte e podem ainda não estar no ar. Um arquivo que
   falta não dá 404 aqui: o rewrite do SPA devolve o index.html, e o link
   baixaria uma página da web com nome de apresentação. */
function usePptxDisponiveis() {
  const [disponiveis, setDisponiveis] = useState({})
  useEffect(() => {
    let ativo = true
    DECKS.forEach(async (deck) => {
      const endereco = enderecoPptx(deck.pptx)
      if (!endereco) return
      let existe = false
      try {
        const resposta = await fetch(endereco, { method: 'HEAD' })
        existe = resposta.ok && !(resposta.headers.get('content-type') ?? '').includes('text/html')
      } catch {
        existe = false
      }
      if (ativo) setDisponiveis((atual) => ({ ...atual, [deck.id]: existe }))
    })
    return () => {
      ativo = false
    }
  }, [])
  return disponiveis
}

function Progresso({ feitos, total, rotulo }) {
  const largura = total ? Math.round((feitos / total) * 100) : 0
  return (
    <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
      <div
        className="h-full bg-brand-accent transition-[width] duration-300"
        style={{ width: `${largura}%` }}
        role="progressbar"
        aria-valuenow={feitos}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={rotulo}
      />
    </div>
  )
}

const PASSOS = [
  { icone: ICONES.grade, texto: 'Escolha uma parte da página' },
  { icone: ICONES.lapis, texto: 'Mude só o que quiser — o resto fica como está' },
  { icone: ICONES.nuvem, texto: 'Pronto, salva sozinho' },
]

/* Até duas linhas do que mudou na dobra, para o cartão. Textos primeiro,
   depois observação e imagem — é a ordem em que a equipe vai aplicar. */
function linhasDoCartao(situacao, bloco) {
  const linhas = situacao.alterados.map(linhaDeResumo)
  const nota = String(bloco?.nota ?? '').replace(/\s+/g, ' ').trim()
  if (nota) linhas.push(`Observação: “${nota.length > 60 ? `${nota.slice(0, 59)}…` : nota}”`)
  if (bloco?.anexo) linhas.push('Imagem anexada')
  return linhas
}

function Cartao({ item, situacao, bloco, capturas, aoAbrir }) {
  const { dobra, posicao } = item
  const linhas = linhasDoCartao(situacao, bloco)
  const visiveis = linhas.slice(0, 2)
  const resto = linhas.length - visiveis.length

  return (
    <li className="rounded-2xl border border-line bg-white overflow-clip flex flex-col">
      {/* A prévia também abre a parte, mas fica fora do teclado: o botão logo
          abaixo faz o mesmo e diz o que faz. */}
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={aoAbrir} className="block cursor-pointer group">
        <Previa dobra={dobra} capturas={capturas} className="border-b border-line group-hover:opacity-90 transition-opacity" />
      </button>
      <div className="p-5 flex flex-col gap-3 grow">
        <h3 className="type-subtitle text-text-dark">
          <span className="text-text-muted">
            Parte <span className="type-numeric">{posicao}</span> ·
          </span>{' '}
          {dobra.titulo}
        </h3>
        <div>
          <SeloSituacao situacao={situacao} />
        </div>
        {visiveis.length > 0 && (
          <ul className="space-y-1">
            {visiveis.map((linha) => (
              <li key={linha} className="type-meta text-text-dark break-words line-clamp-2">{linha}</li>
            ))}
            {resto > 0 && <li className="type-meta text-text-muted">e mais {resto}</li>}
          </ul>
        )}
        <button
          type="button"
          onClick={aoAbrir}
          className="mt-auto min-h-11 w-full inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 transition-colors cursor-pointer type-label"
        >
          Revisar esta parte
          <Icone caminho={ICONES.seta} />
        </button>
      </div>
    </li>
  )
}

/* Resumo de tudo o que a pessoa mudou, em todas as páginas: é o que ela
   confere antes de avisar que terminou, e o mesmo recorte que a equipe lê. */
function Resumo({ respostas, miniaturas, capturas, aoAbrir, total, concluidas }) {
  const { grupos } = mudancasDe(respostas)

  if (!grupos.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface-light p-6 sm:p-8 text-center">
        <p className="type-subtitle text-text-dark">Nenhuma alteração ainda</p>
        <p className="type-body text-text-muted mt-2">
          O que você não mudar fica como está. Quando trocar ou tirar um texto, ele aparece aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="type-body text-text-muted">
        {plural(total, 'alteração', 'alterações')} · {plural(concluidas, 'parte concluída', 'partes concluídas')} de{' '}
        <span className="type-numeric">{TODAS_AS_DOBRAS.length}</span>. Já está tudo salvo: aqui é só para conferir.
      </p>
      {grupos.map(({ deck, dobras }) => (
        <section key={deck.id} aria-labelledby={`resumo-${deck.id}`}>
          <h3 id={`resumo-${deck.id}`} className="type-label text-text-muted">
            <span className="type-numeric">{deck.numero}</span> · {nomeCurto(deck)}
          </h3>
          <ul className="mt-2 divide-y divide-line">
            {dobras.map(({ dobra, textos, nota, anexo }) => (
              <li key={dobra.id} className="flex gap-4 py-5">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => aoAbrir(dobra.id)}
                  className="w-24 sm:w-36 shrink-0 self-start rounded-lg overflow-hidden border border-line cursor-pointer"
                >
                  <Previa dobra={dobra} capturas={capturas} />
                </button>
                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-start justify-between gap-x-3">
                    <p className="type-body text-text-dark font-semibold pt-2.5">
                      <span className="text-text-muted font-normal">
                        Parte <span className="type-numeric">{ITEM_POR_ID.get(dobra.id)?.posicao}</span> ·
                      </span>{' '}
                      {dobra.titulo}
                    </p>
                    <button
                      type="button"
                      onClick={() => aoAbrir(dobra.id)}
                      className="min-h-11 px-2 -mx-2 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                  <ul className="mt-2 space-y-3">
                    {textos.map(({ texto, resposta }) => (
                      <li key={texto.id} className="type-body break-words">
                        {resposta.decisao === 'tirar' ? (
                          <>
                            <span className="type-label text-state-error mr-2">Tirar</span>
                            <span className="text-text-muted line-through decoration-state-error whitespace-pre-line">{texto.texto}</span>
                          </>
                        ) : (
                          // Antes e depois em linhas próprias: título de duas
                          // linhas ao lado de uma seta vira um bloco ilegível.
                          <div className="grid gap-x-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
                            <span className="type-label text-text-muted sm:pt-1">Antes</span>
                            <span className="text-text-muted whitespace-pre-line">{texto.texto}</span>
                            <span className="type-label text-text-dark sm:pt-1 mt-2 sm:mt-0">→ Depois</span>
                            <span className="text-text-dark whitespace-pre-line">{resposta.novo || '(vazio)'}</span>
                          </div>
                        )}
                      </li>
                    ))}
                    {String(nota).trim() && (
                      <li className="type-body text-text-dark break-words">
                        <span className="type-label text-text-muted mr-2">Observação</span>
                        {nota}
                      </li>
                    )}
                    {anexo && (
                      <li className="flex items-center gap-3">
                        <span className="type-label text-text-muted">Imagem anexada</span>
                        {miniaturas[dobra.id] && (
                          <img src={miniaturas[dobra.id]} alt="" className="h-12 w-auto rounded border border-line" />
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/**
 * Revisão de copy do site, parte por parte, para o marketing da locadora.
 *
 * Pública para quem tem o link e fora das buscas. A primeira versão listava
 * os trezentos e tantos textos de uma vez, cada um pedindo uma escolha; ficou
 * longa e pouco clara. Agora a página é um mapa: uma grade de cartões, um por
 * dobra do site, com a prévia da tela e o que já mudou nela. Revisar é abrir
 * um cartão (`CopyPainel`), ver a tela de hoje ao lado dos textos e mexer só
 * no que incomoda — manter é o padrão.
 *
 * Os textos vêm do inventário (`src/content/copy/inventario.json`), gerado a
 * partir do código. Cada alteração é salva sozinha em `/api/retornos`
 * (público `copy`) e aparece em `/doc/retornos`, de onde a equipe aplica as
 * mudanças no código.
 */
export default function DocCopy() {
  useSemIndice('Revisão dos textos do site')

  const [pessoa, setPessoa] = useArmazenamento('locafacil_doc_pessoa', {
    id: novoIdentificador(),
    nome: '',
  })
  const [guardadas, setRespostas] = useArmazenamento('locafacil_doc_copy_respostas', VAZIO)
  const [miniaturas, setMiniaturas] = useArmazenamento('locafacil_doc_copy_miniaturas', {})
  const [concluidaEm, setConcluidaEm] = useArmazenamento('locafacil_doc_copy_concluida', null)
  const [parte, setParte] = useArmazenamento('locafacil_doc_copy_parte', DECKS[0]?.id ?? null)
  const [aberta, setAberta] = useState(dobraDoEndereco)
  const [resumoVisivel, setResumoVisivel] = useState(false)
  const pptx = usePptxDisponiveis()
  const capturas = useCapturas()

  // O que estava guardado pode ser de uma versão anterior da página.
  const respostas = useMemo(
    () => ({
      textos: guardadas?.textos ?? {},
      dobras: guardadas?.dobras ?? {},
      livre: guardadas?.livre ?? {},
    }),
    [guardadas],
  )

  const deck = DECKS.find((item) => item.id === parte) ?? DECKS[0]
  const indiceDeck = DECKS.indexOf(deck)
  const proximoDeck = DECKS[indiceDeck + 1]
  const nome = pessoa.nome.trim()

  /* ------------------------------------------------------- alterações -- */

  const decidir = useCallback(
    (id, decisao, textoAtual) =>
      setRespostas((atual) => {
        const anterior = atual?.textos?.[id] ?? {}
        // Desfazer volta ao padrão, que é manter: some a decisão e o rascunho.
        const proxima = decisao
          ? { ...anterior, decisao, ...(decisao === 'trocar' && anterior.novo == null ? { novo: textoAtual } : {}) }
          : {}
        return { ...VAZIO, ...atual, textos: { ...atual?.textos, [id]: proxima } }
      }),
    [setRespostas],
  )

  const escrever = useCallback(
    (id, novo) =>
      setRespostas((atual) => ({
        ...VAZIO,
        ...atual,
        textos: { ...atual?.textos, [id]: { ...atual?.textos?.[id], novo } },
      })),
    [setRespostas],
  )

  const anotar = useCallback(
    (alvo, nota) => setRespostas((atual) => comBloco({ ...VAZIO, ...atual }, alvo, { nota })),
    [setRespostas],
  )

  const anexar = useCallback(
    (alvo, caminho, miniatura) => {
      setRespostas((atual) => comBloco({ ...VAZIO, ...atual }, alvo, { anexo: caminho || undefined }))
      setMiniaturas((atual) => ({ ...atual, [alvo]: miniatura }))
    },
    [setRespostas, setMiniaturas],
  )

  /* Tira o anexo do retorno. O arquivo no servidor fica — é sobrescrito se a
     pessoa anexar de novo, e sai junto quando a equipe apaga o retorno. */
  const removerAnexo = useCallback(
    (alvo) => {
      setRespostas((atual) => comBloco({ ...VAZIO, ...atual }, alvo, { anexo: undefined }))
      setMiniaturas((atual) => {
        const resto = { ...atual }
        delete resto[alvo]
        return resto
      })
    },
    [setRespostas, setMiniaturas],
  )

  /* ------------------------------------------------------------ painel -- */

  /* Abrir a primeira parte empilha uma entrada no histórico; andar entre
     partes dentro do painel só troca o endereço. Painel aberto por um link
     direto não tem entrada nossa para desempilhar — ali fechar só limpa o
     endereço, senão o "voltar" levaria para fora da página. */
  const abertaRef = useRef(aberta)
  abertaRef.current = aberta

  const abrir = useCallback((id) => {
    const atual = window.history.state ?? {}
    if (abertaRef.current || atual.painelCopy) {
      window.history.replaceState({ ...atual, painelCopy: atual.painelCopy ? id : undefined }, '', `#${id}`)
    } else {
      window.history.pushState({ ...atual, painelCopy: id }, '', `#${id}`)
    }
    setAberta(id)
  }, [])

  const fechar = useCallback(() => {
    if (window.history.state?.painelCopy) {
      window.history.back()
      return
    }
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    setAberta(null)
  }, [])

  useEffect(() => {
    const aoVoltar = () => setAberta(dobraDoEndereco())
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  // A aba acompanha a parte aberta: ao fechar, a grade mostra onde ela está.
  useEffect(() => {
    if (aberta) setParte(ITEM_POR_ID.get(aberta).deck.id)
  }, [aberta, setParte])

  /* Concluir marca a parte e já abre a próxima: é o caminho de quem está
     revisando em sequência. Na última, volta para a grade. */
  const concluir = useCallback(
    (id, valor) => {
      setRespostas((atual) => comBloco({ ...VAZIO, ...atual }, id, { revisada: valor || undefined }))
      if (!valor) return
      const seguinte = TODAS_AS_DOBRAS[ITEM_POR_ID.get(id).indice + 1]
      if (seguinte) abrir(seguinte.dobra.id)
      else fechar()
    },
    [setRespostas, abrir, fechar],
  )

  /* ---------------------------------------------------------- servidor -- */

  const corpo = useMemo(() => {
    const textos = {}
    Object.entries(respostas.textos).forEach(([id, resposta]) => {
      if (!CHAVE_VALIDA.test(id) || !mudou(resposta)) return
      textos[id] =
        resposta.decisao === 'trocar'
          ? { decisao: 'trocar', novo: String(resposta.novo ?? '') }
          : { decisao: 'tirar' }
    })
    const dobras = {}
    Object.entries(respostas.dobras).forEach(([id, bloco]) => {
      const limpo = CHAVE_VALIDA.test(id) && blocoParaEnvio(bloco)
      if (limpo) dobras[id] = limpo
    })
    return {
      publico: 'copy',
      id: pessoa.id,
      nome,
      versao: String(INVENTARIO?.versao ?? ''),
      textos,
      dobras,
      livre: blocoParaEnvio(respostas.livre, { comRevisada: false }) ?? {},
      enviadoEm: concluidaEm,
    }
  }, [respostas, pessoa.id, nome, concluidaEm])

  const temConteudo =
    Object.keys(corpo.textos).length > 0 ||
    Object.keys(corpo.dobras).length > 0 ||
    Object.keys(corpo.livre).length > 0 ||
    Boolean(concluidaEm)

  const { estado, tentarDeNovo } = useSalvamento(nome && temConteudo ? corpo : null)
  const estadoExibido = !nome && temConteudo ? { tipo: 'sem-nome' } : estado

  /* ---------------------------------------------------------- contagem -- */

  const situacoes = useMemo(
    () =>
      Object.fromEntries(
        TODAS_AS_DOBRAS.map(({ dobra }) => [
          dobra.id,
          situacaoDaDobra(dobra, respostas.textos, respostas.dobras[dobra.id]),
        ]),
      ),
    [respostas],
  )
  const porDeck = Object.fromEntries(
    DECKS.map((item) => {
      const lista = dobrasDoDeck(item).map((dobra) => situacoes[dobra.id])
      return [item.id, {
        total: lista.length,
        concluidas: lista.filter((situacao) => situacao.revisada).length,
        alteracoes: lista.reduce((soma, situacao) => soma + situacao.alteracoes, 0),
      }]
    }),
  )
  const livreConta = (String(respostas.livre.nota ?? '').trim() ? 1 : 0) + (respostas.livre.anexo ? 1 : 0)
  const totalAlteracoes = Object.values(porDeck).reduce((soma, item) => soma + item.alteracoes, 0) + livreConta
  const totalConcluidas = Object.values(porDeck).reduce((soma, item) => soma + item.concluidas, 0)

  // O botão fixo "Ver minhas alterações" some quando o resumo já está à vista.
  useEffect(() => {
    const alvo = document.getElementById('resumo')
    if (!alvo) return undefined
    const observador = new IntersectionObserver(([entrada]) => setResumoVisivel(entrada.isIntersecting), {
      rootMargin: '0px 0px -20% 0px',
    })
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])

  const irParaDeck = (id) => {
    setParte(id)
    const inicio = document.getElementById('partes')
    if (inicio && inicio.getBoundingClientRect().top < 0) inicio.scrollIntoView({ block: 'start' })
  }

  const item = aberta ? ITEM_POR_ID.get(aberta) : null
  const dobrasDaAba = dobrasDoDeck(deck)
  const livre = respostas.livre

  return (
    <div className="on-light min-h-screen bg-white overflow-x-clip">
      <header className="bg-hero-gradient">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-10 sm:pt-10 sm:pb-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="inline-flex min-h-11 items-center">
              <img src={logo} alt="Locafácil" width={850} height={255} className="h-8 w-auto" />
            </Link>
            <span className="type-label text-text-secondary border border-white/20 rounded-full px-3 py-1.5">
              Documento interno
            </span>
          </div>

          <h1 className="type-headline text-text-primary mt-10 max-w-3xl text-balance">
            Revisão dos textos do site
          </h1>
          <p className="type-body text-text-secondary mt-3 max-w-2xl text-balance">
            Cada cartão abaixo é uma parte do site, com a tela de hoje. Abra, veja
            os textos daquela parte e mude só o que quiser. Prazo: {PRAZO}.
          </p>

          <ol className="mt-8 grid gap-3 sm:grid-cols-3 max-w-4xl">
            {PASSOS.map((passo, indice) => (
              <li key={passo.texto} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="w-10 h-10 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-text-primary">
                  <Icone caminho={passo.icone} className="w-5 h-5" />
                </span>
                <span className="type-body text-text-primary">
                  <span className="sr-only">Passo {indice + 1}: </span>
                  {passo.texto}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-10">
        <section aria-label="Quem está respondendo" className="rounded-2xl border border-line bg-white p-5 sm:p-6 sm:flex sm:items-end sm:gap-8">
          <div className="sm:w-80 shrink-0">
            <label htmlFor="copy-nome" className="type-label text-text-muted block mb-2">
              Seu nome
            </label>
            <input
              id="copy-nome"
              type="text"
              value={pessoa.nome}
              onChange={(evento) => setPessoa((atual) => ({ ...atual, nome: evento.target.value }))}
              placeholder="Seu nome"
              autoComplete="name"
              maxLength={80}
              required
              aria-describedby="copy-nome-ajuda"
              className={classeCampo()}
            />
            <p id="copy-nome-ajuda" className={`type-meta mt-2 ${nome ? 'text-text-muted' : 'text-text-dark'}`}>
              {nome ? 'As alterações chegam à equipe com este nome.' : 'Obrigatório: sem ele nada chega à equipe.'}
            </p>
          </div>
          <div className="grow mt-6 sm:mt-0 sm:pb-7">
            <p className="type-body text-text-dark mb-2">
              <span className="type-numeric font-semibold">{totalConcluidas}</span> de{' '}
              <span className="type-numeric">{TODAS_AS_DOBRAS.length}</span> partes concluídas
              <span className="text-text-muted"> · {plural(totalAlteracoes, 'alteração', 'alterações')}</span>
            </p>
            <Progresso feitos={totalConcluidas} total={TODAS_AS_DOBRAS.length} rotulo="Partes concluídas no site inteiro" />
          </div>
        </section>
      </div>

      {/* Barra fixa: a página do site em que se está e se o que mudou chegou.
          Rola na horizontal no celular, como o índice do DocShell. */}
      <nav aria-label="Páginas do site" className="sticky top-0 z-30 mt-8 bg-white/95 backdrop-blur-md border-y border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <ul className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            {DECKS.map((item) => {
              const ativo = item.id === deck?.id
              const { concluidas, total } = porDeck[item.id]
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => irParaDeck(item.id)}
                    aria-current={ativo ? 'true' : undefined}
                    className={`min-h-11 flex items-center gap-2 px-3 whitespace-nowrap type-label border-b-2 transition-colors cursor-pointer ${
                      ativo ? 'border-brand-accent text-brand-accent' : 'border-transparent text-text-muted hover:text-text-dark'
                    }`}
                  >
                    <span>
                      <span className="type-numeric">{item.numero}</span> · {nomeCurto(item)}
                    </span>
                    <span className={`type-numeric ${ativo ? 'text-brand-accent/70' : 'text-text-muted'}`}>
                      {concluidas}/{total}
                      <span className="sr-only"> partes concluídas</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <AvisoSalvamento estado={estadoExibido} aoTentarDeNovo={tentarDeNovo} className="pb-2.5 lg:pb-0" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-28">
        {deck ? (
          <section id="partes" aria-labelledby="titulo-pagina" className="scroll-mt-24 pt-10 sm:pt-12">
            <h2 id="titulo-pagina" className="type-title text-text-dark">{deck.titulo}</h2>
            <p className="type-meta text-text-muted mt-2 mb-6">
              {plural(porDeck[deck.id].total, 'parte', 'partes')} ·{' '}
              <span className="type-numeric">{porDeck[deck.id].concluidas}</span> concluídas ·{' '}
              {plural(porDeck[deck.id].alteracoes, 'alteração', 'alterações')}
            </p>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dobrasDaAba.map((dobra) => (
                <Cartao
                  key={dobra.id}
                  item={ITEM_POR_ID.get(dobra.id)}
                  situacao={situacoes[dobra.id]}
                  bloco={respostas.dobras[dobra.id]}
                  capturas={capturas}
                  aoAbrir={() => abrir(dobra.id)}
                />
              ))}
            </ul>

            {proximoDeck && (
              <div className="mt-8">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => irParaDeck(proximoDeck.id)}
                  className="min-h-11 inline-flex items-center gap-2 px-6 rounded-xl bg-brand-accent hover:bg-brand-glow text-white type-label transition-colors cursor-pointer"
                >
                  Ir para {nomeCurto(proximoDeck)}
                  <Icone caminho={ICONES.seta} />
                </motion.button>
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-line bg-surface-light p-8 text-center mt-10">
            <p className="type-subtitle text-text-dark">Os textos ainda estão sendo reunidos</p>
            <p className="type-body text-text-muted mt-2">Volte mais tarde — este link continua valendo.</p>
          </div>
        )}

        {/* ------------------------------------------------------ resumo -- */}
        <section id="resumo" aria-labelledby="titulo-resumo" className="scroll-mt-24 mt-16 sm:mt-20 pt-10 border-t border-line">
          <h2 id="titulo-resumo" className="type-title text-text-dark">Suas alterações</h2>
          <div className="mt-6">
            <Resumo
              respostas={respostas}
              miniaturas={miniaturas}
              capturas={capturas}
              aoAbrir={abrir}
              total={totalAlteracoes}
              concluidas={totalConcluidas}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <p className="type-body text-text-muted max-w-xl">
              Não precisa apertar nada para as alterações chegarem — este botão só
              avisa a equipe que a revisão acabou.
              {concluidaEm && (
                <span className="block text-text-dark mt-1">
                  Aviso registrado em <span className="type-numeric">{quando(concluidaEm)}</span>. Se lembrar de mais
                  alguma coisa, é só voltar e mexer.
                </span>
              )}
              {!nome && <span className="block text-text-dark mt-1">Escreva seu nome no topo para avisar.</span>}
            </p>
            <motion.button
              type="button"
              whileHover={nome ? { scale: 1.02 } : undefined}
              whileTap={nome ? { scale: 0.97 } : undefined}
              disabled={!nome}
              onClick={() => setConcluidaEm(new Date().toISOString())}
              className="mt-4 sm:mt-0 shrink-0 min-h-11 px-6 rounded-xl bg-brand-accent hover:bg-brand-glow disabled:opacity-60 disabled:cursor-not-allowed text-white type-label transition-colors cursor-pointer"
            >
              {concluidaEm ? 'Avisar de novo que terminei' : 'Avisar que terminei'}
            </motion.button>
          </div>
        </section>

        {/* ------------------------------------ espaço livre e powerpoint -- */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section id="livre" aria-labelledby="titulo-livre" className="scroll-mt-24 rounded-2xl border border-line bg-surface-light p-5 sm:p-6">
            <h2 id="titulo-livre" className="type-subtitle text-text-dark">Espaço livre</h2>
            <p className="type-meta text-text-muted mt-1 mb-3">
              Um texto novo, uma seção que falta, um tom que não soou certo — o que não coube nas partes.
            </p>
            <label htmlFor="copy-livre" className="sr-only">Espaço livre</label>
            <textarea
              id="copy-livre"
              value={livre.nota ?? ''}
              onChange={(evento) => anotar('livre', evento.target.value)}
              rows={4}
              maxLength={LIMITE_LIVRE}
              placeholder="Escreva aqui o que quiser pedir."
              className={classeCampo('bg-white')}
            />
            <div className="mt-3">
              <CampoAnexo
                alvo="livre"
                idPessoa={pessoa.id}
                liberado={Boolean(nome)}
                anexo={livre.anexo}
                miniatura={miniaturas.livre}
                aoAnexar={anexar}
                aoRemover={removerAnexo}
              />
            </div>
          </section>

          <section id="powerpoint" aria-labelledby="titulo-powerpoint" className="scroll-mt-24 rounded-2xl border border-line bg-surface-light p-5 sm:p-6">
            <h2 id="titulo-powerpoint" className="type-subtitle text-text-dark">Prefere o PowerPoint ou o Canva?</h2>
            <p className="type-meta text-text-muted mt-1">
              Não precisa: o que você muda nesta página já chega sozinho. Os slides são uma alternativa.
            </p>
            <ul className="mt-3 space-y-2">
              {DECKS.map((item) => {
                const endereco = enderecoPptx(item.pptx)
                const disponivel = Boolean(endereco) && pptx[item.id] !== false
                return (
                  <li key={item.id}>
                    {disponivel ? (
                      <a
                        href={endereco}
                        download
                        className="min-h-11 flex items-center justify-between gap-3 px-4 py-2 rounded-xl border border-line bg-white hover:border-brand-accent transition-colors cursor-pointer"
                      >
                        <span className="type-body text-text-dark">
                          <span className="type-numeric">{item.numero}</span> · {nomeCurto(item)}{' '}
                          <span className="type-meta text-text-muted">.pptx</span>
                        </span>
                        <Icone caminho={ICONES.baixar} className="w-5 h-5 text-brand-accent" />
                      </a>
                    ) : (
                      <span className="min-h-11 flex items-center justify-between gap-3 px-4 py-2 rounded-xl border border-dashed border-line">
                        <span className="type-body text-text-muted">
                          <span className="type-numeric">{item.numero}</span> · {nomeCurto(item)}
                        </span>
                        <span className="type-meta text-text-muted">em preparação</span>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="type-meta text-text-muted mt-3">
              <strong className="text-text-dark">PowerPoint:</strong> abra e digite nas próprias caixas de texto.{' '}
              <strong className="text-text-dark">Canva:</strong> Criar design → Importar arquivo → escolha o .pptx; ao
              terminar, baixe como PPTX e mande para nós.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <p className="type-meta text-text-muted max-w-md">
            Página interna, fora do menu do site e fora das buscas. O link é o
            acesso — mande só para quem precisa.
          </p>
        </div>
      </footer>

      {/* Atalho para o resumo. Camada fixa fora de qualquer motion.* (ver
          CLAUDE.md); some quando o resumo já está na tela ou o painel abre. */}
      {totalAlteracoes > 0 && !resumoVisivel && !item && (
        <div className="fixed bottom-4 inset-x-0 z-20 flex justify-center px-5 pointer-events-none">
          <a
            href="#resumo"
            className="pointer-events-auto min-h-11 inline-flex items-center gap-2 px-5 rounded-full bg-brand-dark text-text-primary shadow-glass type-label hover:bg-brand-navy transition-colors cursor-pointer"
          >
            <Icone caminho={ICONES.lapis} />
            Ver minhas alterações (<span className="type-numeric">{totalAlteracoes}</span>)
          </a>
        </div>
      )}

      {item && (
        <CopyPainel
          item={item}
          anterior={TODAS_AS_DOBRAS[item.indice - 1]}
          proxima={TODAS_AS_DOBRAS[item.indice + 1]}
          respostas={respostas.textos}
          bloco={respostas.dobras[item.dobra.id]}
          miniatura={miniaturas[item.dobra.id]}
          pessoa={pessoa}
          aoMudarNome={(valor) => setPessoa((atual) => ({ ...atual, nome: valor }))}
          estadoSalvamento={estadoExibido}
          aoTentarDeNovo={tentarDeNovo}
          capturas={capturas}
          aoDecidir={decidir}
          aoEscrever={escrever}
          aoAnotar={anotar}
          aoAnexar={anexar}
          aoRemover={removerAnexo}
          aoConcluir={concluir}
          aoIr={abrir}
          aoFechar={fechar}
        />
      )}
    </div>
  )
}
