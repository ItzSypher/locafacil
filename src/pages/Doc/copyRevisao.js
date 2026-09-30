import { useEffect, useState } from 'react'
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
const NOME_CURTO = { home: 'Home, menu e rodapé', reserva: 'Reserva', 'empresas-contato': 'Empresas e Contato' }
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

/* Traços dos ícones da revisão (estilo Heroicons, 24×24), desenhados pelo
   `Icone` de `CopyPecas.jsx`. */
export const ICONES = {
  check: 'M5 13l4 4L19 7',
  lapis: 'M15.2 5.2l3.6 3.6M4 20l4.3-1 10.4-10.4a2.5 2.5 0 00-3.6-3.6L4.7 15.4 4 20z',
  x: 'M6 6l12 12M18 6L6 18',
  desfazer: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11',
  grade: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z',
  nuvem: 'M7 18h10a4 4 0 00.6-7.96A6 6 0 006.1 9.1 4.5 4.5 0 007 18zm2.5-4.5l2 2 3.5-3.5',
  seta: 'M5 12h14m-6-6l6 6-6 6',
  voltar: 'M19 12H5m6-6l-6 6 6 6',
  imagem: 'M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  subir: 'M12 16V4m0 0L8 8m4-4l4 4M5 20h14',
  baixar: 'M12 4v11m0 0l-4-4m4 4l4-4M5 19h14',
}

/** Capturas gravadas por quem gerou o inventário, uma por dobra e formato. */
export const enderecoCaptura = (idDobra, formato) => `/doc/copy/${idDobra}-${formato}.jpg`

export function enderecoPptx(pptx) {
  if (!pptx) return null
  return /^(\/|https?:)/.test(pptx) ? pptx : `/doc/copy/${pptx}`
}

/** Quantos textos já têm decisão, num conjunto de textos. */
export const contarMarcados = (textos, respostas) =>
  textos.reduce((soma, texto) => soma + (respostas?.[texto.id]?.decisao ? 1 : 0), 0)

/** Todas as dobras, na ordem do site, com o deck de cada uma. */
export const TODAS_AS_DOBRAS = DECKS.flatMap((deck) =>
  dobrasDe(deck).map((dobra, indice) => ({ dobra, deck, posicao: indice + 1, total: dobrasDe(deck).length })),
)
export const dobrasDoDeck = dobrasDe

/* "Manter" é o padrão: só trocar e tirar contam como mudança. Resposta de
   quem usou a primeira versão da página pode ter "manter" gravado — é o mesmo
   que não ter nada. */
export const mudou = (resposta) => resposta?.decisao === 'trocar' || resposta?.decisao === 'tirar'

/**
 * Situação de uma dobra: textos alterados, observação, anexo e se a pessoa
 * marcou como concluída. É o que o cartão da grade mostra.
 */
export function situacaoDaDobra(dobra, textos = {}, bloco = {}) {
  const alterados = textosDe(dobra).filter((texto) => mudou(textos[texto.id]))
  const extras = (String(bloco?.nota ?? '').trim() ? 1 : 0) + (bloco?.anexo ? 1 : 0)
  const alteracoes = alterados.length + extras
  return {
    alterados: alterados.map((texto) => ({ texto, resposta: textos[texto.id] })),
    alteracoes,
    revisada: bloco?.revisada === true,
    rotulo: alteracoes
      ? `${alteracoes} ${alteracoes === 1 ? 'alteração' : 'alterações'}`
      : bloco?.revisada === true
        ? 'Sem mudanças'
        : 'Não revisada',
    tipo: alteracoes ? 'alterada' : bloco?.revisada === true ? 'revisada' : 'pendente',
  }
}

/** Uma linha curta de resumo: `Trocar: "antes" → "depois"` ou `Tirar: "antes"`. */
export function linhaDeResumo({ texto, resposta }) {
  const curto = (valor, limite = 48) => {
    const limpo = String(valor ?? '').replace(/\s+/g, ' ').trim()
    return limpo.length > limite ? `${limpo.slice(0, limite - 1)}…` : limpo
  }
  return resposta.decisao === 'tirar'
    ? `Tirar: “${curto(texto.texto, 70)}”`
    : `Trocar: “${curto(texto.texto)}” → “${curto(resposta.novo)}”`
}

/* Desenho de reserva para dobra sem captura: o Google e o WhatsApp não são
   uma tela do site, e mostrar um retângulo vazio no lugar parece defeito. */
export function formaDaDobra(dobra) {
  const tipos = textosDe(dobra).map((texto) => texto.tipo)
  if (tipos.length && tipos.every((tipo) => tipo === 'seo')) return 'seo'
  if (tipos.filter((tipo) => tipo === 'mensagem-whatsapp').length > tipos.length / 2) return 'whatsapp'
  return 'pagina'
}

/* Índice das capturas, gravado junto com elas (`public/doc/copy/
   capturas.json`): diz quais existem e o tamanho de cada uma. Lido uma vez por
   visita. Sem o índice, a página tenta o caminho de costume e esconde o que
   não carregar. */
let indiceDeCapturas = null
export function useCapturas() {
  const [capturas, setCapturas] = useState(indiceDeCapturas)
  useEffect(() => {
    if (indiceDeCapturas) return undefined
    let ativo = true
    fetch('/doc/copy/capturas.json', { cache: 'no-cache' })
      .then((resposta) => {
        const tipo = resposta.headers.get('content-type') ?? ''
        return resposta.ok && tipo.includes('json') ? resposta.json() : {}
      })
      .catch(() => ({}))
      .then((dados) => {
        indiceDeCapturas = dados && typeof dados === 'object' ? dados : {}
        if (ativo) setCapturas(indiceDeCapturas)
      })
    return () => {
      ativo = false
    }
  }, [])
  return capturas
}

/** Endereço e tamanho da captura de uma dobra num formato, pelo índice. */
export function capturaDe(capturas, idDobra, formato) {
  const entrada = capturas?.[idDobra]
  if (entrada) {
    const endereco = entrada[formato]
    if (!endereco) return null
    const sufixo = formato === 'desktop' ? 'Desktop' : 'Celular'
    return { endereco, largura: entrada[`largura${sufixo}`], altura: entrada[`altura${sufixo}`] }
  }
  // Índice ainda não carregou, ou não cita a dobra: tenta o caminho de costume.
  return { endereco: enderecoCaptura(idDobra, formato), largura: null, altura: null }
}

/* ------------------------------------------------ leitura dos retornos --- */

const umaLinha = (valor) => String(valor ?? '').replace(/\s*\n\s*/g, ' ↵ ').trim()

/**
 * O que mudou num retorno, agrupado por deck e dobra na ordem do inventário.
 *
 * "Manter" não entra: é o que não pede trabalho. Textos que o retorno cita e
 * o inventário atual não tem mais (o site mudou depois da resposta) vão para
 * `soltos`, para que nenhum pedido suma da tela por causa de um id velho.
 */
export function mudancasDe(retorno, { incluirConcluidas = false } = {}) {
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
        revisada: dobras[dobra.id]?.revisada === true,
      }))
      .filter((grupo) => grupo.textos.length || String(grupo.nota).trim() || grupo.anexo || (incluirConcluidas && grupo.revisada)),
  })).filter((grupo) => grupo.dobras.length)

  const idsDasDobras = new Set(DECKS.flatMap((deck) => dobrasDe(deck).map((dobra) => dobra.id)))

  const soltos = Object.entries(textos)
    .filter(([id, resposta]) => !TEXTO_POR_ID.has(id) && resposta?.decisao !== 'manter')
    .map(([id, resposta]) => ({ id, resposta }))

  const dobrasSoltas = Object.entries(dobras)
    .filter(([id, bloco]) => !idsDasDobras.has(id) && (bloco?.nota || bloco?.anexo))
    .map(([id, bloco]) => ({ id, nota: bloco?.nota ?? '', anexo: bloco?.anexo ?? '' }))

  const contagem = { manter: 0, trocar: 0, tirar: 0 }
  Object.values(textos).forEach((resposta) => {
    if (resposta?.decisao in contagem) contagem[resposta.decisao] += 1
  })

  const concluidas = DECKS.flatMap((deck) => dobrasDe(deck)).filter((dobra) => dobras[dobra.id]?.revisada === true)

  return { grupos, soltos, dobrasSoltas, contagem, concluidas, livre: retorno?.livre ?? {} }
}

/**
 * O retorno em texto simples, uma linha por pedido: `[id] antes → depois`.
 * Quebra de linha dentro de um texto vira "↵", para cada pedido continuar
 * numa linha só.
 */
export function comoLista(retorno, { quando = (iso) => iso } = {}) {
  const { grupos, soltos, dobrasSoltas, concluidas, livre } = mudancasDe(retorno)
  const linhas = [
    `Revisão de copy — ${retorno?.nome || 'Sem nome'} — atualizado em ${quando(retorno?.atualizadoEm)}`,
    `Partes concluídas: ${concluidas.length} de ${TODAS_AS_DOBRAS.length}${concluidas.length ? ` (${concluidas.map((dobra) => dobra.id).join(', ')})` : ''}`,
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

/* ------------------------------------------------ diferença de palavras --- */

/**
 * Diferença por palavras entre o texto de hoje e o pedido, para a tela de
 * retornos destacar o que saiu e o que entrou em vez de obrigar a comparar
 * duas frases de olho.
 *
 * Maior subsequência comum sobre as palavras (os espaços viajam junto, como
 * pedaços iguais). O texto de copy é curto — o maior do inventário tem 280
 * caracteres, e o limite de um texto novo é 2000 —, então a tabela quadrática
 * cabe com folga e dispensa biblioteca.
 *
 * Devolve `{ antes, depois }`, cada um uma lista de `{ texto, tipo }` com
 * `tipo` em `igual`, `saiu` (só em `antes`) ou `entrou` (só em `depois`).
 */
export function diferencaDePalavras(antes, depois) {
  const pedacos = (valor) => String(valor ?? '').split(/(\s+)/).filter(Boolean)
  const a = pedacos(antes)
  const b = pedacos(depois)

  // Texto grande demais para a tabela: marca tudo, sem travar a página.
  if (a.length * b.length > 400_000) {
    return {
      antes: [{ texto: String(antes ?? ''), tipo: 'saiu' }],
      depois: [{ texto: String(depois ?? ''), tipo: 'entrou' }],
    }
  }

  const tabela = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      tabela[i][j] = a[i] === b[j] ? tabela[i + 1][j + 1] + 1 : Math.max(tabela[i + 1][j], tabela[i][j + 1])
    }
  }

  const saidaAntes = []
  const saidaDepois = []
  // Pedaços vizinhos do mesmo tipo viram um só: "palavra palavra" riscada
  // numa faixa só lê melhor que duas faixas com um espaço limpo no meio.
  const juntar = (lista, texto, tipo) => {
    const ultimo = lista[lista.length - 1]
    const espaco = /^\s+$/.test(texto)
    if (ultimo && (ultimo.tipo === tipo || (espaco && ultimo.tipo !== 'igual'))) ultimo.texto += texto
    else lista.push({ texto, tipo: espaco ? 'igual' : tipo })
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      juntar(saidaAntes, a[i], 'igual')
      juntar(saidaDepois, b[j], 'igual')
      i += 1
      j += 1
    } else if (tabela[i + 1][j] >= tabela[i][j + 1]) {
      juntar(saidaAntes, a[i], 'saiu')
      i += 1
    } else {
      juntar(saidaDepois, b[j], 'entrou')
      j += 1
    }
  }
  while (i < a.length) juntar(saidaAntes, a[i++], 'saiu')
  while (j < b.length) juntar(saidaDepois, b[j++], 'entrou')

  // O espaço que sobra na ponta de um trecho marcado sai da marcação: a faixa
  // colorida acaba na palavra, não no vão até a próxima.
  const aparar = (lista) =>
    lista.flatMap((pedaco) => {
      const ponta = pedaco.tipo !== 'igual' && /^([\s\S]*?\S)(\s+)$/.exec(pedaco.texto)
      return ponta ? [{ texto: ponta[1], tipo: pedaco.tipo }, { texto: ponta[2], tipo: 'igual' }] : [pedaco]
    })

  return { antes: aparar(saidaAntes), depois: aparar(saidaDepois) }
}
