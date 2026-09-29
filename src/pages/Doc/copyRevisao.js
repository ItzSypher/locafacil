import inventario from '../../content/copy/inventario.json'

/* A revisão de copy lida pelos dois lados: a página que o cliente preenche
 * (`/doc/copy`) e a que a equipe lê (`/doc/retornos`). As duas partem do
 * mesmo inventário, gerado a partir do código — é ele que diz qual texto é
 * qual, em que ordem aparece e em que arquivo mora. O retorno guarda só o id
 * de cada texto e o que a pessoa decidiu; o "antes" vem sempre daqui.
 */

export const INVENTARIO = inventario
export const DECKS = Array.isArray(inventario?.decks) ? inventario.decks : []

const dobrasDe = (deck) => (Array.isArray(deck?.dobras) ? deck.dobras : [])
const textosDe = (dobra) => (Array.isArray(dobra?.textos) ? dobra.textos : [])

export const textosDoDeck = (deck) => dobrasDe(deck).flatMap(textosDe)

/* O título do deck descreve o conteúdo ("Home, menu e rodapé"); na aba e nos
   botões cabe só o nome da parte. Deck novo sem nome curto usa o começo do
   título, até a primeira vírgula ou dois-pontos. */
const NOME_CURTO = { home: 'Home', reserva: 'Reserva', 'empresas-contato': 'Empresas e Contato' }
export const nomeCurto = (deck) =>
  NOME_CURTO[deck?.id] ?? String(deck?.titulo ?? '').split(/[,:]/)[0].trim()

export const TOTAL_TEXTOS = DECKS.reduce((soma, deck) => soma + textosDoDeck(deck).length, 0)

/** Onde cada texto mora: o próprio texto, a dobra e o deck, pelo id. */
export const TEXTO_POR_ID = new Map(
  DECKS.flatMap((deck) =>
    dobrasDe(deck).flatMap((dobra) => textosDe(dobra).map((texto) => [texto.id, { texto, dobra, deck }])),
  ),
)

/* O nome que aparece em cima de cada texto. É o que diz ao cliente onde
   aquilo está na tela — "botão" se acha mais rápido que "texto 14". */
export const ROTULO_TIPO = {
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  paragrafo: 'Parágrafo',
  botao: 'Botão',
  selo: 'Selo',
  item: 'Item de lista',
  rotulo: 'Rótulo',
  campo: 'Campo de formulário',
  opcao: 'Opção',
  aviso: 'Aviso',
  legenda: 'Legenda',
  link: 'Link',
  'mensagem-whatsapp': 'Mensagem do WhatsApp',
  seo: 'Google (título e descrição)',
}

export const DECISOES = ['manter', 'trocar', 'tirar']

export const LIMITE_TEXTO_NOVO = 2000
export const LIMITE_NOTA = 2000
export const LIMITE_LIVRE = 8000

/* Mesmo formato que `/api/retornos` aceita. Um id fora dele derrubaria o
   salvamento inteiro, então fica fora do corpo e a revisão segue salvando. */
export const CHAVE_VALIDA = /^[a-z0-9-]{1,80}$/

/* Campo de texto sobre fundo claro, o mesmo em toda a revisão. O fundo muda
   conforme a superfície: cinza sobre cartão branco, branco sobre faixa cinza. */
export const classeCampo = (fundo = 'bg-surface-light') =>
  `w-full rounded-xl border border-line ${fundo} px-4 py-3 type-body text-text-dark placeholder:text-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors resize-y`

/** Capturas gravadas por quem gerou o inventário, uma por dobra e formato. */
export const enderecoCaptura = (idDobra, formato) => `/doc/copy/${idDobra}-${formato}.jpg`

export function enderecoPptx(pptx) {
  if (!pptx) return null
  return /^(\/|https?:)/.test(pptx) ? pptx : `/doc/copy/${pptx}`
}

/** Quantos textos já têm decisão, num conjunto de textos. */
export const contarMarcados = (textos, respostas) =>
  textos.reduce((soma, texto) => soma + (respostas?.[texto.id]?.decisao ? 1 : 0), 0)

/* ------------------------------------------------ leitura dos retornos --- */

const umaLinha = (valor) => String(valor ?? '').replace(/\s*\n\s*/g, ' ↵ ').trim()

/**
 * O que mudou num retorno, agrupado por deck e dobra na ordem do inventário.
 *
 * "Manter" não entra: é o que não pede trabalho. Textos que o retorno cita e
 * o inventário atual não tem mais (o site mudou depois da resposta) vão para
 * `soltos`, para que nenhum pedido suma da tela por causa de um id velho.
 */
export function mudancasDe(retorno) {
  const textos = retorno?.textos ?? {}
  const dobras = retorno?.dobras ?? {}

  const grupos = DECKS.map((deck) => ({
    deck,
    dobras: dobrasDe(deck)
      .map((dobra) => ({
        dobra,
        textos: textosDe(dobra)
          .filter((texto) => ['trocar', 'tirar'].includes(textos[texto.id]?.decisao))
          .map((texto) => ({ texto, resposta: textos[texto.id] })),
        nota: dobras[dobra.id]?.nota ?? '',
        anexo: dobras[dobra.id]?.anexo ?? '',
      }))
      .filter((grupo) => grupo.textos.length || grupo.nota || grupo.anexo),
  })).filter((grupo) => grupo.dobras.length)

  const idsDasDobras = new Set(DECKS.flatMap((deck) => dobrasDe(deck).map((dobra) => dobra.id)))

  const soltos = Object.entries(textos)
    .filter(([id, resposta]) => !TEXTO_POR_ID.has(id) && resposta?.decisao !== 'manter')
    .map(([id, resposta]) => ({ id, resposta }))

  const dobrasSoltas = Object.entries(dobras)
    .filter(([id]) => !idsDasDobras.has(id))
    .map(([id, bloco]) => ({ id, nota: bloco?.nota ?? '', anexo: bloco?.anexo ?? '' }))

  const contagem = { manter: 0, trocar: 0, tirar: 0 }
  Object.values(textos).forEach((resposta) => {
    if (resposta?.decisao in contagem) contagem[resposta.decisao] += 1
  })

  return { grupos, soltos, dobrasSoltas, contagem, livre: retorno?.livre ?? {} }
}

/**
 * O retorno em texto simples, uma linha por pedido: `[id] antes → depois`.
 * Quebra de linha dentro de um texto vira "↵", para cada pedido continuar
 * numa linha só.
 */
export function comoLista(retorno, { quando = (iso) => iso } = {}) {
  const { grupos, soltos, dobrasSoltas, livre } = mudancasDe(retorno)
  const linhas = [
    `Revisão de copy — ${retorno?.nome || 'Sem nome'} — atualizado em ${quando(retorno?.atualizadoEm)}`,
  ]

  grupos.forEach(({ deck, dobras }) => {
    dobras.forEach(({ dobra, textos, nota, anexo }) => {
      linhas.push('', `# ${deck.numero} · ${deck.titulo} › ${dobra.titulo} (${dobra.id})`)
      textos.forEach(({ texto, resposta }) => {
        linhas.push(
          resposta.decisao === 'tirar'
            ? `[${texto.id}] TIRAR: ${umaLinha(texto.texto)}`
            : `[${texto.id}] ${umaLinha(texto.texto)} → ${umaLinha(resposta.novo)}`,
        )
      })
      if (nota) linhas.push(`[${dobra.id}] OBSERVAÇÃO: ${umaLinha(nota)}`)
      if (anexo) linhas.push(`[${dobra.id}] ANEXO: ${anexo}`)
    })
  })

  if (soltos.length || dobrasSoltas.length) {
    linhas.push('', '# Fora do inventário atual')
    soltos.forEach(({ id, resposta }) => {
      linhas.push(
        resposta.decisao === 'tirar'
          ? `[${id}] TIRAR`
          : `[${id}] → ${umaLinha(resposta.novo)}`,
      )
    })
    dobrasSoltas.forEach(({ id, nota, anexo }) => {
      if (nota) linhas.push(`[${id}] OBSERVAÇÃO: ${umaLinha(nota)}`)
      if (anexo) linhas.push(`[${id}] ANEXO: ${anexo}`)
    })
  }

  if (livre.nota || livre.anexo) {
    linhas.push('', '# Espaço livre')
    if (livre.nota) linhas.push(`[livre] ${umaLinha(livre.nota)}`)
    if (livre.anexo) linhas.push(`[livre] ANEXO: ${livre.anexo}`)
  }

  return linhas.join('\n')
}
