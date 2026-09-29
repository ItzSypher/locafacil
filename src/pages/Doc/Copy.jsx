import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../../assets/brand/logo-lockup-pingo.svg'
import { useArmazenamento, useSemIndice } from './hooks'
import { salvarRetorno, novoIdentificador } from './retornos'
import {
  INVENTARIO, DECKS, TOTAL_TEXTOS, DECISOES, CHAVE_VALIDA, LIMITE_LIVRE,
  textosDoDeck, contarMarcados, enderecoPptx, classeCampo, nomeCurto,
} from './copyRevisao'
import { Dobra, CampoAnexo, AvisoSalvamento } from './CopyPecas'

/* Prazo combinado com o marketing. Escrito à mão pelo mesmo motivo do rótulo
   da reunião em `documentacao.js`: "sexta-feira, 02/10" lê melhor no meio da
   frase do que qualquer formatação automática. */
const PRAZO = 'sexta-feira, 02/10'

const VAZIO = { textos: {}, dobras: {}, livre: {} }

const quando = (iso) => {
  const data = new Date(iso)
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

/* Observação e anexo de uma dobra, só com o que foi escrito. Bloco vazio não
   vai para o servidor: abrir a caixa e desistir não é resposta. */
function blocoParaEnvio(bloco) {
  if (!bloco || typeof bloco !== 'object') return null
  const nota = String(bloco.nota ?? '')
  const saida = {}
  if (nota.trim()) saida.nota = nota
  if (bloco.anexo) saida.anexo = bloco.anexo
  return Object.keys(saida).length ? saida : null
}

function comBloco(respostas, alvo, mudanca) {
  if (alvo === 'livre') return { ...respostas, livre: { ...respostas.livre, ...mudanca } }
  return {
    ...respostas,
    dobras: { ...respostas.dobras, [alvo]: { ...respostas.dobras?.[alvo], ...mudanca } },
  }
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

function Progresso({ marcados, total, rotulo }) {
  const largura = total ? Math.round((marcados / total) * 100) : 0
  return (
    <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
      <div
        className="h-full bg-brand-accent transition-[width] duration-300"
        style={{ width: `${largura}%` }}
        role="progressbar"
        aria-valuenow={marcados}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={rotulo}
      />
    </div>
  )
}

const PASSOS = [
  'Marque Manter, Trocar ou Tirar em cada texto.',
  'Quando trocar, escreva o texto novo no campo que abre — ele já vem com o texto de hoje.',
  'Tudo salva sozinho e chega para a equipe. Pode parar e voltar depois, neste mesmo navegador.',
]

/**
 * Revisão de copy do site, texto por texto, para o marketing da locadora.
 *
 * Pública para quem tem o link e fora das buscas. Os textos vêm do inventário
 * (`src/content/copy/inventario.json`), gerado a partir do código; a página
 * não sabe nada do site além dele. Cada resposta é salva sozinha em
 * `/api/retornos` (público `copy`) e aparece em `/doc/retornos`, de onde a
 * equipe aplica as mudanças no código.
 *
 * Uma parte do site por vez (Home, Reserva, Empresas e Contato): trezentos
 * textos numa rolagem só são uma parede, e o progresso por parte dá a quem
 * revisa um lugar para parar.
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
  const pptx = usePptxDisponiveis()

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
  const proximo = DECKS[indiceDeck + 1]
  const nome = pessoa.nome.trim()

  const decidir = useCallback(
    (id, decisao, textoAtual) =>
      setRespostas((atual) => {
        const anterior = atual?.textos?.[id] ?? {}
        const proximaResposta = { ...anterior, decisao }
        if (decisao === 'trocar' && proximaResposta.novo == null) proximaResposta.novo = textoAtual
        return { ...VAZIO, ...atual, textos: { ...atual?.textos, [id]: proximaResposta } }
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

  const corpo = useMemo(() => {
    const textos = {}
    Object.entries(respostas.textos).forEach(([id, resposta]) => {
      if (!CHAVE_VALIDA.test(id) || !DECISOES.includes(resposta?.decisao)) return
      textos[id] =
        resposta.decisao === 'trocar'
          ? { decisao: 'trocar', novo: String(resposta.novo ?? '') }
          : { decisao: resposta.decisao }
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
      livre: blocoParaEnvio(respostas.livre) ?? {},
      enviadoEm: concluidaEm,
    }
  }, [respostas, pessoa.id, nome, concluidaEm])

  const temConteudo =
    Object.keys(corpo.textos).length > 0 ||
    Object.keys(corpo.dobras).length > 0 ||
    Object.keys(corpo.livre).length > 0

  const { estado, tentarDeNovo } = useSalvamento(nome && temConteudo ? corpo : null)
  const estadoExibido = !nome && temConteudo ? { tipo: 'sem-nome' } : estado

  const progresso = useMemo(
    () =>
      Object.fromEntries(
        DECKS.map((item) => {
          const textos = textosDoDeck(item)
          return [item.id, { total: textos.length, marcados: contarMarcados(textos, respostas.textos) }]
        }),
      ),
    [respostas.textos],
  )
  const marcadosNoTotal = Object.values(progresso).reduce((soma, item) => soma + item.marcados, 0)
  const contagem = { manter: 0, trocar: 0, tirar: 0 }
  Object.values(corpo.textos).forEach((resposta) => {
    contagem[resposta.decisao] += 1
  })

  /* Troca de parte leva ao começo dela, mas só se a pessoa já desceu: quem
     clica ainda no topo não precisa ver a página pular. */
  const irPara = (id) => {
    setParte(id)
    const inicio = document.getElementById('revisao')
    if (inicio && inicio.getBoundingClientRect().top < 0) inicio.scrollIntoView({ block: 'start' })
  }

  const dobras = Array.isArray(deck?.dobras) ? deck.dobras : []
  const livre = respostas.livre

  return (
    <div className="on-light min-h-screen bg-white overflow-x-clip">
      <header className="bg-hero-gradient">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-12 sm:pt-10 sm:pb-16">
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
          <p className="type-body text-text-secondary mt-4 max-w-2xl text-balance">
            Todos os textos do novo site, um por um, na ordem em que aparecem na
            tela. Para cada um, diga se fica como está, se muda ou se sai.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3 max-w-4xl">
            {PASSOS.map((passo, indice) => (
              <li key={passo} className="flex gap-3">
                <span className="type-numeric type-label text-text-primary w-7 h-7 shrink-0 rounded-full border border-white/20 flex items-center justify-center">
                  {indice + 1}
                </span>
                <span className="type-body text-text-secondary">{passo}</span>
              </li>
            ))}
          </ol>

          <dl className="flex flex-wrap gap-x-10 gap-y-4 mt-10 pt-8 border-t border-white/10">
            <div>
              <dt className="type-label text-text-secondary">Prazo</dt>
              <dd className="type-body text-text-primary mt-1 first-letter:uppercase">{PRAZO}</dd>
            </div>
            <div>
              <dt className="type-label text-text-secondary">Textos</dt>
              <dd className="type-body text-text-primary mt-1">
                <span className="type-numeric">{TOTAL_TEXTOS}</span>, em{' '}
                <span className="type-numeric">{DECKS.length}</span> {DECKS.length === 1 ? 'parte' : 'partes'} do site
              </dd>
            </div>
            <div>
              <dt className="type-label text-text-secondary">Prefere slides?</dt>
              <dd className="mt-1">
                <a
                  href="#powerpoint"
                  className="type-body text-text-primary underline underline-offset-4 decoration-white/30 hover:decoration-white inline-flex min-h-11 -my-3 items-center cursor-pointer"
                >
                  PowerPoint ou Canva
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12">
        <section aria-label="Quem está respondendo" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
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
            className={`${classeCampo()} sm:max-w-md`}
          />
          <p id="copy-nome-ajuda" className={`type-meta mt-2 ${nome ? 'text-text-muted' : 'text-text-dark'}`}>
            {nome
              ? 'As respostas chegam à equipe com este nome.'
              : 'Obrigatório. Sem ele as respostas ficam só neste navegador e não chegam à equipe.'}
          </p>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mt-6 mb-3">
            <p className="type-subtitle text-text-dark">
              <span className="type-numeric">{marcadosNoTotal}</span> de{' '}
              <span className="type-numeric">{TOTAL_TEXTOS}</span> textos marcados
            </p>
            {marcadosNoTotal > 0 && (
              <p className="type-meta text-text-muted">
                <span className="type-numeric">{contagem.trocar}</span> para trocar ·{' '}
                <span className="type-numeric">{contagem.tirar}</span> para tirar
              </p>
            )}
          </div>
          <Progresso marcados={marcadosNoTotal} total={TOTAL_TEXTOS} rotulo="Textos marcados no site inteiro" />
        </section>
      </div>

      {/* Barra fixa: a parte do site em que se está e se o que foi marcado
          chegou. Rola na horizontal no celular, como o índice do DocShell. */}
      <nav
        aria-label="Partes do site"
        className="sticky top-0 z-30 mt-8 bg-white/95 backdrop-blur-md border-y border-line"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <ul className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            {DECKS.map((item) => {
              const ativo = item.id === deck?.id
              const { marcados, total } = progresso[item.id]
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => irPara(item.id)}
                    aria-current={ativo ? 'true' : undefined}
                    className={`min-h-11 flex items-center gap-2 px-3 whitespace-nowrap type-label border-b-2 transition-colors cursor-pointer ${
                      ativo
                        ? 'border-brand-accent text-brand-accent'
                        : 'border-transparent text-text-muted hover:text-text-dark'
                    }`}
                  >
                    <span>
                      <span className="type-numeric">{item.numero}</span> · {nomeCurto(item)}
                    </span>
                    <span className={`type-numeric ${ativo ? 'text-brand-accent/70' : 'text-text-muted'}`}>
                      {marcados}/{total}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <AvisoSalvamento estado={estadoExibido} aoTentarDeNovo={tentarDeNovo} className="pb-2.5 lg:pb-0" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-8">
        {deck ? (
          <section id="revisao" aria-labelledby="titulo-parte" className="scroll-mt-24 pt-10 sm:pt-12">
            <header className="mb-8 max-w-2xl">
              <h2 id="titulo-parte" className="type-title text-text-dark">{deck.titulo}</h2>
              <p className="type-meta text-text-muted mt-2 mb-4">
                <span className="type-numeric">{progresso[deck.id].marcados}</span> de{' '}
                <span className="type-numeric">{progresso[deck.id].total}</span> textos marcados ·{' '}
                <span className="type-numeric">{dobras.length}</span> {dobras.length === 1 ? 'parte' : 'partes'}
              </p>
              <Progresso
                marcados={progresso[deck.id].marcados}
                total={progresso[deck.id].total}
                rotulo={`Textos marcados em ${deck.titulo}`}
              />
            </header>

            <div className="space-y-6">
              {dobras.map((dobra, indice) => (
                <Dobra
                  key={dobra.id}
                  dobra={dobra}
                  posicao={indice + 1}
                  total={dobras.length}
                  respostas={respostas.textos}
                  bloco={respostas.dobras[dobra.id]}
                  miniatura={miniaturas[dobra.id]}
                  idPessoa={pessoa.id}
                  liberado={Boolean(nome)}
                  aoDecidir={decidir}
                  aoEscrever={escrever}
                  aoAnotar={anotar}
                  aoAnexar={anexar}
                  aoRemover={removerAnexo}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              {proximo ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => irPara(proximo.id)}
                  className="min-h-11 inline-flex items-center gap-2 px-6 rounded-xl bg-brand-accent hover:bg-brand-glow text-white type-label transition-colors cursor-pointer"
                >
                  Continuar para {nomeCurto(proximo)}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                  </svg>
                </motion.button>
              ) : (
                <a
                  href="#livre"
                  className="min-h-11 inline-flex items-center gap-2 px-6 rounded-xl bg-brand-accent hover:bg-brand-glow text-white type-label transition-colors cursor-pointer"
                >
                  Ir para o espaço livre
                </a>
              )}
              {indiceDeck > 0 && (
                <button
                  type="button"
                  onClick={() => irPara(DECKS[indiceDeck - 1].id)}
                  className="min-h-11 px-4 type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
                >
                  Voltar para {nomeCurto(DECKS[indiceDeck - 1])}
                </button>
              )}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-line bg-surface-light p-8 text-center mt-10">
            <p className="type-subtitle text-text-dark">Os textos ainda estão sendo reunidos</p>
            <p className="type-body text-text-muted mt-2">Volte mais tarde — este link continua valendo.</p>
          </div>
        )}

        {/* ------------------------------------------------ espaço livre -- */}
        <section id="livre" aria-labelledby="titulo-livre" className="scroll-mt-24 mt-16 sm:mt-20">
          <h2 id="titulo-livre" className="type-title text-text-dark">Espaço livre</h2>
          <p className="type-body text-text-muted mt-3 max-w-2xl">
            Para o que não cabe em nenhum campo acima: um texto novo, uma seção
            que está faltando, um tom que não soou certo. Escreva do jeito que
            for mais fácil — chega junto com o resto.
          </p>
          <div className="rounded-2xl border border-line bg-surface-light p-5 sm:p-6 mt-6">
            <label htmlFor="copy-livre" className="sr-only">Espaço livre</label>
            <textarea
              id="copy-livre"
              value={livre.nota ?? ''}
              onChange={(evento) => anotar('livre', evento.target.value)}
              rows={8}
              maxLength={LIMITE_LIVRE}
              placeholder="Escreva aqui o que quiser pedir."
              className={classeCampo('bg-white')}
            />
            {(livre.nota ?? '').length > LIMITE_LIVRE * 0.8 && (
              <p className="type-meta text-text-muted mt-1.5">
                <span className="type-numeric">{(livre.nota ?? '').length}</span> de{' '}
                <span className="type-numeric">{LIMITE_LIVRE}</span> caracteres
              </p>
            )}
            <div className="mt-4">
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
          </div>
        </section>

        {/* ------------------------------------------------ powerpoint -- */}
        <section
          id="powerpoint"
          aria-labelledby="titulo-powerpoint"
          className="scroll-mt-24 mt-16 sm:mt-20 rounded-2xl border border-line bg-surface-light p-5 sm:p-8"
        >
          <h2 id="titulo-powerpoint" className="type-subtitle text-text-dark">
            Prefere editar no PowerPoint ou no Canva?
          </h2>
          <p className="type-body text-text-muted mt-2 max-w-2xl">
            Não precisa: o que você marca nesta página já chega sozinho para a
            equipe. Os arquivos abaixo são uma alternativa, com os mesmos textos
            em slides, para quem prefere mexer direto neles.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {DECKS.map((item) => {
              const endereco = enderecoPptx(item.pptx)
              const disponivel = Boolean(endereco) && pptx[item.id] !== false
              return (
                <li key={item.id}>
                  {disponivel ? (
                    <a
                      href={endereco}
                      download
                      className="min-h-11 h-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-line bg-white hover:border-brand-accent transition-colors cursor-pointer"
                    >
                      <span>
                        <span className="type-body text-text-dark block">
                          <span className="type-numeric">{item.numero}</span> · {nomeCurto(item)}
                        </span>
                        <span className="type-meta text-text-muted">Apresentação .pptx</span>
                      </span>
                      <svg className="w-5 h-5 shrink-0 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="min-h-11 h-full flex flex-col justify-center px-4 py-3 rounded-xl border border-dashed border-line">
                      <span className="type-body text-text-muted">
                        <span className="type-numeric">{item.numero}</span> · {nomeCurto(item)}
                      </span>
                      <span className="type-meta text-text-muted">Arquivo em preparação</span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          <dl className="mt-6 space-y-3 max-w-2xl">
            <div>
              <dt className="type-label text-text-dark">No PowerPoint</dt>
              <dd className="type-body text-text-muted mt-1">
                Abra o arquivo e digite por cima, nas próprias caixas de texto.
              </dd>
            </div>
            <div>
              <dt className="type-label text-text-dark">No Canva</dt>
              <dd className="type-body text-text-muted mt-1">
                Criar design → Importar arquivo → escolha o .pptx. Ao terminar,
                baixe como PPTX e mande para nós.
              </dd>
            </div>
          </dl>
        </section>

        {/* -------------------------------------------------- terminei -- */}
        <section aria-labelledby="titulo-fim" className="mt-16 sm:mt-20 rounded-2xl border border-line bg-white p-5 sm:p-8">
          <h2 id="titulo-fim" className="type-subtitle text-text-dark">Terminou?</h2>
          <p className="type-body text-text-muted mt-2 max-w-2xl">
            Você marcou <span className="type-numeric">{marcadosNoTotal}</span> de{' '}
            <span className="type-numeric">{TOTAL_TEXTOS}</span> textos:{' '}
            <span className="type-numeric">{contagem.manter}</span> para manter,{' '}
            <span className="type-numeric">{contagem.trocar}</span> para trocar e{' '}
            <span className="type-numeric">{contagem.tirar}</span> para tirar. Não
            precisa apertar nada para as respostas chegarem — este botão só avisa
            a equipe que a revisão acabou.
          </p>
          <motion.button
            type="button"
            whileHover={nome ? { scale: 1.02 } : undefined}
            whileTap={nome ? { scale: 0.97 } : undefined}
            disabled={!nome}
            onClick={() => setConcluidaEm(new Date().toISOString())}
            className="mt-5 min-h-11 px-6 rounded-xl bg-brand-accent hover:bg-brand-glow disabled:opacity-60 disabled:cursor-not-allowed text-white type-label transition-colors cursor-pointer"
          >
            {concluidaEm ? 'Avisar de novo que terminei' : 'Avisar que terminei a revisão'}
          </motion.button>
          <p className="type-meta text-text-muted mt-3" aria-live="polite">
            {!nome
              ? 'Escreva seu nome no topo da página para avisar.'
              : concluidaEm
                ? `Aviso registrado em ${quando(concluidaEm)}. Se lembrar de mais alguma coisa, é só voltar e mexer: salva de novo.`
                : `O prazo é ${PRAZO}.`}
          </p>
        </section>
      </main>

      <footer className="border-t border-line mt-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <p className="type-meta text-text-muted max-w-md">
            Página interna, fora do menu do site e fora das buscas. O link é o
            acesso — mande só para quem precisa.
          </p>
        </div>
      </footer>
    </div>
  )
}
