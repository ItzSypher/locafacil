/**
 * Capturas das "dobras" do inventário de copy, para os três PPTX de revisão e
 * para a página /doc/copy.
 *
 *   npm run dev                                        (noutro terminal)
 *   node scripts/capturar-copy.mjs                     (todas as dobras)
 *   node scripts/capturar-copy.mjs home-02 reserva-07  (só as que começam assim)
 *
 * Lê `src/content/copy/inventario.json` e, para cada dobra com `seletor`,
 * grava em `public/doc/copy/`:
 *
 *   <id>-desktop.jpg   1440×900, escala 1
 *   <id>-celular.jpg   390×844, escala 2, com emulação de celular
 *   capturas.json      caminho e medida (em pixels do arquivo) de cada imagem
 *
 * O recorte é exatamente o retângulo do elemento do seletor, sem limite de
 * altura: a tela de veículos sai inteira, e quem monta o PPTX decide como
 * encaixar. Dobra sem seletor (título no Google, mensagens do WhatsApp) entra
 * no JSON com `null`.
 *
 * Fala direto com o Chrome pelo DevTools Protocol, como `print-telas.mjs`:
 * o Node 22 já traz WebSocket e fetch. Porta e perfil são próprios deste
 * script, para não esbarrar num Chrome que outro processo tenha aberto.
 *
 * ATENÇÃO — em dev o site fala com a API REAL da locadora. Este script nunca
 * clica em "Confirmar pré-reserva" nem envia formulário, e ainda bloqueia na
 * rede a confirmação e o cancelamento de reserva e o WhatsApp, por garantia.
 * O checkout é preparado pelo botão "Dados falsos" (DevSeed), que só consulta
 * disponibilidade; a tela de confirmação recebe um localizador inventado
 * direto na sessionStorage, sem passar pela API.
 */

import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const RAIZ = process.cwd()
const BASE = process.env.PRINT_BASE ?? 'http://localhost:5173'
const PORTA = Number(process.env.CAPTURA_PORTA ?? 9351)
const INVENTARIO = join(RAIZ, 'src/content/copy/inventario.json')
const SAIDA = join(RAIZ, 'public/doc/copy')
const URL_PUBLICA = '/doc/copy'
// Perfil fora de `public/`: o que estiver lá dentro a Vercel publica.
const PERFIL = join(tmpdir(), `locafacil-capturar-copy-${PORTA}`)
const QUALIDADE_JPEG = 80

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

const FORMATOS = [
  { nome: 'desktop', width: 1440, height: 900, escala: 1, mobile: false },
  {
    nome: 'celular',
    width: 390,
    height: 844,
    escala: 2,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  },
]

/* O que nunca pode sair na foto. O preloader e o andaime (botão amarelo
   "Dados falsos"/"Limpar") somem em todas; o popup de desconto some em todas
   menos na dele. Vai por CSS injetado: o site não é tocado. */
const CSS_PRELOADER = '.fixed.inset-0[role="status"][aria-label="Carregando"] { display: none !important; }'
const CSS_ANDAIME = 'div.fixed.bottom-4.left-4 { display: none !important; }'
const CSS_POPUP = 'div.fixed.inset-0:has(> [aria-labelledby="desconto-titulo"]) { display: none !important; }'

/* Rede barrada durante a captura inteira: nada aqui pode criar ou cancelar
   reserva, nem abrir conversa de WhatsApp. */
const URLS_BLOQUEADAS = [
  '*reservation-confirm*',
  '*reservation-cancel*',
  '*api.whatsapp.com*',
  '*wa.me*',
]

const CHAVE_RESERVA = 'locafacil_reservation'
const CHAVE_POPUP_DISPENSADO = 'locafacil_desconto_dispensado'

/* Localizador de mentira para a tela de confirmação. Seis dígitos, no mesmo
   formato do ConfID que a API devolve. */
const CONF_ID_FALSO = '482913'

/**
 * Preparo de cada dobra que não é "abrir a rota com ?print=1 e fotografar".
 *
 * Uma dobra pode ter vários estados (lista): o primeiro é a captura
 * principal (<id>-<formato>.jpg); os outros levam `sufixo` e saem como
 * <id>-<sufixo>-<formato>.jpg, listados em `extras` no capturas.json.
 * Dentro de um estado, uma chave `desktop` ou `celular` sobrepõe o resto só
 * naquele formato.
 *
 * Campos:
 *   semPrint        abre sem ?print=1 (popup e atendimento só existem assim)
 *   manterPopup     não esconde o popup de desconto
 *   dispensarPopup  marca o popup como dispensado antes de abrir a página
 *   semRolagem      não percorre a página (camadas fixas, rolagem travada)
 *   seletor         troca o seletor do inventário naquele estado
 *   clicar          seletor CSS do elemento a clicar antes da foto
 *   clicarTexto     texto exato do botão a clicar antes da foto
 *   esperar         expressão JS que tem de ficar verdadeira antes da foto
 *   camada          o alvo pode ter rolagem interna (max-h): a janela cresce
 *                   até caber tudo, só para a foto
 *   reserva         função que ajusta o estado do checkout antes de abrir
 *   disponibilidade reescreve a resposta de /api/availability (ver VARIANTES)
 */
const PREPAROS = {
  'home-01-menu': {
    // No celular os links moram na camada aberta pelo botão de menu.
    celular: { seletor: '#menu-principal', clicar: 'button[aria-label="Abrir menu"]', semRolagem: true, camada: true },
  },
  'home-09-popup-desconto': {
    // Abre sozinho 1,5 s depois de carregar; o seletor só existe a partir daí.
    semPrint: true,
    manterPopup: true,
    semRolagem: true,
  },
  'home-10-atendimento': [
    {
      // Principal: o painel de assuntos aberto.
      semPrint: true,
      dispensarPopup: true,
      semRolagem: true,
      clicar: 'button[aria-label="Falar com a Locafacil"]',
      camada: true,
    },
    {
      // O balão que aparece sozinho depois de 4 s, com o botão redondo.
      sufixo: 'balao',
      semPrint: true,
      dispensarPopup: true,
      semRolagem: true,
      esperar: '!!document.querySelector(\'[aria-label="Dispensar mensagem"]\')',
    },
  ],
  'reserva-03-veiculos-detalhes': {
    semRolagem: true,
    clicarTexto: 'Ver detalhes e composição do valor',
    camada: true,
  },
  'reserva-04-veiculos-avisos': [
    { disponibilidade: 'erro' },
    { sufixo: 'expirado', disponibilidade: 'expirado' },
    { sufixo: 'vazio', disponibilidade: 'vazio' },
    { sufixo: 'filtros', disponibilidade: 'manual', clicarTexto: 'Automático' },
  ],
  'reserva-06-dados': {
    // Sem o condutor, os campos mostram os exemplos de dentro.
    reserva: (estado) => {
      const { driver: _driver, ...resto } = estado
      return resto
    },
  },
  'reserva-08-confirmacao': {
    reserva: (estado) => {
      const offer = estado.selectedVehicle ?? {}
      const coverageItem = estado.extras?.coverageType
        ? (offer.coverages ?? []).find((c) => c.type === estado.extras.coverageType) ?? null
        : null
      const protecao = coverageItem && !coverageItem.includedInRate ? coverageItem.amountTotal ?? 0 : 0
      const opcionais = (offer.equipments ?? [])
        .filter((e) => estado.extras?.equipTypes?.includes(e.type))
        .reduce((soma, e) => soma + (e.amountTotal ?? 0), 0)
      return {
        ...estado,
        confirmation: {
          confId: CONF_ID_FALSO,
          vehicle: { groupName: offer.groupName },
          days: offer.days || 1,
        },
        confirmationTotals: {
          total: (offer.totals?.estimated ?? 0) + protecao + opcionais,
          coverageItem,
        },
        demo: false,
      }
    },
  },
}

/* Estados alternativos da lista de veículos. A API real não tem cenário de
   teste, então a resposta de /api/availability é reescrita no navegador de
   captura — o servidor e o site não mudam. */
const VARIANTES = {
  erro: () => ({
    status: 422,
    json: { success: false, data: null, errors: ['Não há veículos disponíveis para o período solicitado.'], demo: false },
  }),
  expirado: (json) => {
    json.data.expiresAt = new Date(Date.now() - 60 * 1000).toISOString()
    return { status: 200, json }
  },
  vazio: (json) => {
    json.data.offers = []
    return { status: 200, json }
  },
  // Todos os grupos viram manuais: o filtro "Automático" deixa a lista vazia.
  manual: (json) => {
    json.data.offers = (json.data.offers ?? []).map((o) => ({ ...o, transmission: 'Manual' }))
    return { status: 200, json }
  },
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

function acharChrome() {
  for (const caminho of CHROMES) {
    if (existsSync(caminho)) return caminho
  }
  return null
}

/** Sessão CDP mínima: comando com resposta pelo id, e ouvintes de evento. */
function abrirSessao(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const pendentes = new Map()
    const ouvintes = new Map()
    let proximoId = 0

    ws.onmessage = (evento) => {
      const msg = JSON.parse(evento.data)
      if (msg.id != null && pendentes.has(msg.id)) {
        const { resolver, rejeitar, method } = pendentes.get(msg.id)
        pendentes.delete(msg.id)
        msg.error ? rejeitar(new Error(`${method}: ${msg.error.message}`)) : resolver(msg.result)
        return
      }
      if (msg.method) {
        for (const cb of ouvintes.get(msg.method) ?? []) cb(msg.params)
      }
    }
    ws.onerror = () => reject(new Error('não consegui falar com o Chrome'))
    ws.onopen = () =>
      resolve({
        enviar: (method, params = {}) =>
          new Promise((resolver, rejeitar) => {
            const id = ++proximoId
            pendentes.set(id, { resolver, rejeitar, method })
            ws.send(JSON.stringify({ id, method, params }))
          }),
        /** Devolve a função que desliga o ouvinte. */
        ouvir: (method, cb) => {
          if (!ouvintes.has(method)) ouvintes.set(method, new Set())
          ouvintes.get(method).add(cb)
          return () => ouvintes.get(method).delete(cb)
        },
        fechar: () => ws.close(),
      })
  })
}

async function esperarChrome() {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORTA}/json/version`)
      if (res.ok) return await res.json()
    } catch {
      /* ainda subindo */
    }
    await espera(250)
  }
  throw new Error('o Chrome não abriu a porta de depuração')
}

/** Roda uma expressão na página e devolve o valor (promessas são esperadas). */
async function avaliar(sessao, expressao) {
  const { result, exceptionDetails } = await sessao.enviar('Runtime.evaluate', {
    expression: expressao,
    awaitPromise: true,
    returnByValue: true,
  })
  if (exceptionDetails) {
    const texto = exceptionDetails.exception?.description ?? exceptionDetails.text
    throw new Error(`erro na página: ${texto}`)
  }
  return result.value
}

/** Espera uma expressão JS ficar verdadeira. */
async function esperarAte(sessao, expressao, { tempo = 20000, oque = expressao } = {}) {
  const limite = Date.now() + tempo
  while (Date.now() < limite) {
    try {
      if (await avaliar(sessao, `Boolean(${expressao})`)) return
    } catch {
      /* página ainda trocando */
    }
    await espera(200)
  }
  throw new Error(`tempo esgotado esperando ${oque}`)
}

async function navegar(sessao, url) {
  let desligar
  const carregou = new Promise((resolve) => {
    desligar = sessao.ouvir('Page.loadEventFired', resolve)
  })
  await sessao.enviar('Page.navigate', { url })
  await Promise.race([carregou, espera(30000)])
  desligar()
}

/** Expressão que acha o primeiro elemento visível do seletor. */
const achar = (seletor) =>
  `[...document.querySelectorAll(${JSON.stringify(seletor)})].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })`

/** Fontes carregadas e imagens baixadas e decodificadas (com teto de tempo). */
async function esperarFontesEImagens(sessao) {
  await avaliar(
    sessao,
    `(async () => {
      await document.fonts.ready
      const teto = (ms) => new Promise((r) => setTimeout(r, ms))
      const imagens = [...document.images]
      await Promise.race([
        Promise.all(imagens.map((img) => img.complete ? null : new Promise((r) => {
          img.addEventListener('load', r, { once: true })
          img.addEventListener('error', r, { once: true })
        }))),
        teto(10000),
      ])
      await Promise.race([
        Promise.all(imagens.filter((img) => img.complete && img.naturalWidth).map((img) => img.decode().catch(() => null))),
        teto(5000),
      ])
      return true
    })()`,
  )
}

/**
 * Percorre a página até o fim e volta ao topo: dispara os `whileInView` (todos
 * com `once: true`, então ficam visíveis) e as imagens com `loading="lazy"`.
 */
async function rolarPagina(sessao) {
  await avaliar(
    sessao,
    `(async () => {
      const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
      const passo = Math.max(200, Math.floor(innerHeight * 0.5))
      for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
        scrollTo({ top: y, behavior: 'instant' })
        await pausa(120)
      }
      scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      await pausa(400)
      scrollTo({ top: 0, behavior: 'instant' })
      await pausa(300)
      return true
    })()`,
  )
}

/**
 * Força o Chrome a desenhar alguns quadros. Sem quadro novo o
 * requestAnimationFrame não anda, e o framer-motion fica parado no meio da
 * entrada (visto no celular: popup em 97 %, painel 10 px abaixo do lugar).
 * Cada captura minúscula e descartada gera um quadro no tempo atual.
 */
async function bombearQuadros(sessao, vezes = 3) {
  for (let i = 0; i < vezes; i += 1) {
    await sessao.enviar('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 10,
      clip: { x: 0, y: 0, width: 8, height: 8, scale: 1 },
    })
    await espera(120)
  }
}

/**
 * Espera as entradas do framer-motion terminarem dentro do alvo: nenhum
 * elemento com `opacity` inline abaixo de 1. Devolve quantos sobraram.
 */
async function esperarAnimacoes(sessao, seletor) {
  const limite = Date.now() + 6000
  let restantes = 0
  while (Date.now() < limite) {
    await bombearQuadros(sessao, 2)
    restantes = await avaliar(
      sessao,
      `(() => {
        const alvo = ${achar(seletor)}
        if (!alvo) return 0
        return [alvo, ...alvo.querySelectorAll('*')].filter((el) => {
          const o = el.style.opacity
          return o !== '' && parseFloat(o) < 1 && parseFloat(o) > 0 || o === '0'
        }).length
      })()`,
    )
    if (restantes === 0) return 0
    await espera(250)
  }
  return restantes
}

/** Clique pelo JS (o React escuta o `click`); tira o foco depois. */
async function clicar(sessao, { seletor, texto }) {
  const expr = texto
    ? `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(texto)})`
    : `document.querySelector(${JSON.stringify(seletor)})`
  await esperarAte(sessao, expr, { oque: texto ? `o botão "${texto}"` : seletor })
  await avaliar(sessao, `(() => { const el = ${expr}; el.scrollIntoView({ block: 'center' }); el.click(); return true })()`)
}

/** Sem anel de foco na foto: o diálogo foca o primeiro botão ao abrir. */
async function tirarFoco(sessao) {
  await avaliar(sessao, `(() => { document.activeElement?.blur?.(); return true })()`)
}

/** Retângulo do alvo em coordenadas do documento. */
async function medirAlvo(sessao, seletor) {
  return avaliar(
    sessao,
    `(() => {
      const el = ${achar(seletor)}
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: r.left + scrollX,
        y: r.top + scrollY,
        w: r.width,
        h: r.height,
        larguraDoc: document.documentElement.scrollWidth,
        naJanela: r.top >= 0 && r.bottom <= innerHeight + 1,
      }
    })()`,
  )
}

/** Quanto falta para a rolagem interna do alvo caber inteira (0 = cabe). */
async function sobraDeRolagem(sessao, seletor) {
  return avaliar(
    sessao,
    `(() => {
      const alvo = ${achar(seletor)}
      if (!alvo) return 0
      let sobra = 0
      for (const el of [alvo, ...alvo.querySelectorAll('*')]) {
        const s = getComputedStyle(el)
        if (/(auto|scroll)/.test(s.overflowY)) sobra = Math.max(sobra, el.scrollHeight - el.clientHeight)
      }
      return sobra
    })()`,
  )
}

async function aplicarFormato(sessao, formato, altura = formato.height) {
  await sessao.enviar('Emulation.setDeviceMetricsOverride', {
    width: formato.width,
    height: altura,
    deviceScaleFactor: formato.escala,
    mobile: formato.mobile,
    screenWidth: formato.width,
    screenHeight: altura,
  })
}

/** Largura e altura gravadas no cabeçalho do JPEG (marcador SOF). */
function medidasJpeg(buffer) {
  let i = 2
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) {
      i += 1
      continue
    }
    const marcador = buffer[i + 1]
    const tamanho = buffer.readUInt16BE(i + 2)
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return { altura: buffer.readUInt16BE(i + 5), largura: buffer.readUInt16BE(i + 7) }
    }
    i += 2 + tamanho
  }
  return { largura: null, altura: null }
}

/** Recorta o retângulo do alvo e grava o JPEG. */
async function fotografar(sessao, seletor, arquivo) {
  const alvo = await medirAlvo(sessao, seletor)
  if (!alvo) throw new Error(`"${seletor}" não está na página`)

  const x = Math.max(0, Math.floor(alvo.x))
  const y = Math.max(0, Math.floor(alvo.y))
  const width = Math.min(Math.ceil(alvo.x + alvo.w), alvo.larguraDoc) - x
  const height = Math.ceil(alvo.y + alvo.h) - y

  const { data } = await sessao.enviar('Page.captureScreenshot', {
    format: 'jpeg',
    quality: QUALIDADE_JPEG,
    clip: { x, y, width, height, scale: 1 },
    // O que cabe na janela sai da janela como está. Capturar além dela
    // redesenha a página com outra altura, e as camadas fixas (diálogo,
    // menu, atendimento) saem deslocadas se a página estiver rolada.
    captureBeyondViewport: !alvo.naJanela,
    fromSurface: true,
  })
  const buffer = Buffer.from(data, 'base64')
  writeFileSync(arquivo, buffer)
  return medidasJpeg(buffer)
}

/**
 * Prepara o checkout pelo andaime: /reservar sem ?print=1, "Dados falsos",
 * espera cair na revisão. O botão só consulta disponibilidade — a pré-reserva
 * nasce em outro botão, que este script não toca. Devolve o estado gravado.
 */
async function semearCheckout(sessao) {
  await navegar(sessao, `${BASE}/reservar`)
  await clicar(sessao, { texto: 'Dados falsos' })
  const limite = Date.now() + 90000
  while (Date.now() < limite) {
    const situacao = await avaliar(
      sessao,
      `(() => ({
        rota: location.pathname,
        erro: document.querySelector('div.fixed.bottom-4.left-4 [role="alert"]')?.textContent ?? null,
      }))()`,
    ).catch(() => ({}))
    if (situacao.erro) throw new Error(`"Dados falsos" falhou: ${situacao.erro}`)
    if (situacao.rota === '/reservar/revisao') {
      const bruto = await avaliar(sessao, `sessionStorage.getItem(${JSON.stringify(CHAVE_RESERVA)})`)
      const estado = JSON.parse(bruto ?? '{}')
      if (estado.selectedVehicle && estado.driver) return estado
    }
    await espera(300)
  }
  throw new Error('"Dados falsos" não chegou à revisão em 90 s')
}

/**
 * Grava o estado do checkout na sessionStorage da aba antes de abrir a etapa.
 * Passa por /robots.txt (mesma origem, sem React): numa página do app, o
 * provider regravaria o estado dele por cima do nosso.
 */
async function gravarReserva(sessao, estado) {
  await navegar(sessao, `${BASE}/robots.txt`)
  await avaliar(
    sessao,
    `(() => { sessionStorage.setItem(${JSON.stringify(CHAVE_RESERVA)}, ${JSON.stringify(JSON.stringify(estado))}); return true })()`,
  )
}

/** Reescreve a resposta de /api/availability conforme a variante. */
function interceptarDisponibilidade(sessao, variante) {
  const reescrever = VARIANTES[variante]
  const desligar = sessao.ouvir('Fetch.requestPaused', async (p) => {
    try {
      let json = null
      try {
        const { body, base64Encoded } = await sessao.enviar('Fetch.getResponseBody', { requestId: p.requestId })
        json = JSON.parse(base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body)
      } catch {
        /* resposta sem corpo legível */
      }
      if (variante !== 'erro' && !json?.success) {
        console.warn(`     aviso: a disponibilidade real falhou; a variante "${variante}" não se aplica`)
        await sessao.enviar('Fetch.continueResponse', { requestId: p.requestId })
        return
      }
      const { status, json: novo } = reescrever(json)
      await sessao.enviar('Fetch.fulfillRequest', {
        requestId: p.requestId,
        responseCode: status,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
        body: Buffer.from(JSON.stringify(novo), 'utf8').toString('base64'),
      })
    } catch (erro) {
      console.warn(`     aviso: interceptação falhou (${erro.message})`)
    }
  })
  return sessao
    .enviar('Fetch.enable', { patterns: [{ urlPattern: '*/api/availability*', requestStage: 'Response' }] })
    .then(() => async () => {
      desligar()
      await sessao.enviar('Fetch.disable')
    })
}

/** Os estados de uma dobra, já com o recorte do formato aplicado. */
function estadosDa(dobra, formato) {
  const bruto = PREPAROS[dobra.id] ?? {}
  const lista = Array.isArray(bruto) ? bruto : [bruto]
  return lista.map((estado) => {
    const { desktop, celular, ...base } = estado
    const doFormato = formato.nome === 'desktop' ? desktop : celular
    return { ...base, ...(doFormato ?? {}) }
  })
}

/** Uma captura: prepara o estado, abre a rota, espera, fotografa. */
async function capturarEstado(sessao, formato, dobra, prep, reserva) {
  const seletor = prep.seletor ?? dobra.seletor
  const checkout = dobra.rota.startsWith('/reservar/')

  if (checkout) {
    if (!reserva) throw new Error('checkout sem estado preparado')
    await gravarReserva(sessao, prep.reserva ? prep.reserva(structuredClone(reserva)) : reserva)
  }

  // CSS e flags entram antes do primeiro script da página.
  const css = [CSS_PRELOADER, CSS_ANDAIME, prep.manterPopup ? '' : CSS_POPUP].join('\n')
  const { identifier } = await sessao.enviar('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      ${prep.dispensarPopup ? `try { sessionStorage.setItem(${JSON.stringify(CHAVE_POPUP_DISPENSADO)}, 'true') } catch {}` : ''}
      const css = ${JSON.stringify(css)}
      const pendurar = () => {
        const estilo = document.createElement('style')
        estilo.id = 'captura-copy'
        estilo.textContent = css
        document.documentElement.appendChild(estilo)
      }
      if (document.documentElement) pendurar()
      else document.addEventListener('readystatechange', pendurar, { once: true })
    })()`,
  })

  const desligarInterceptacao = prep.disponibilidade
    ? await interceptarDisponibilidade(sessao, prep.disponibilidade)
    : null

  try {
    const url = `${BASE}${dobra.rota}${prep.semPrint ? '' : '?print=1'}`
    await navegar(sessao, url)

    // O que precisa existir antes: o alvo, ou o que se clica para abri-lo.
    const gatilho = prep.clicar
      ? `document.querySelector(${JSON.stringify(prep.clicar)})`
      : prep.clicarTexto
        ? `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(prep.clicarTexto)})`
        : achar(seletor)
    await esperarAte(sessao, gatilho, { tempo: 45000, oque: prep.clicar ?? prep.clicarTexto ?? seletor })

    await esperarFontesEImagens(sessao)
    if (!prep.semRolagem) {
      await rolarPagina(sessao)
      await esperarFontesEImagens(sessao)
    }
    await espera(1200)

    if (prep.clicar || prep.clicarTexto) {
      await clicar(sessao, { seletor: prep.clicar, texto: prep.clicarTexto })
      await esperarAte(sessao, achar(seletor), { tempo: 15000, oque: seletor })
      // O clique rolou a página até o botão; de volta ao topo, senão o menu
      // fixo (já no estilo "rolado") cobre o começo da dobra.
      await avaliar(sessao, `(() => { scrollTo({ top: 0, behavior: 'instant' }); return true })()`)
      await espera(900)
      await esperarFontesEImagens(sessao)
    }
    if (prep.esperar) await esperarAte(sessao, prep.esperar, { tempo: 15000 })

    await tirarFoco(sessao)
    const sobras = await esperarAnimacoes(sessao, seletor)
    if (sobras) console.warn(`     aviso: ${sobras} elemento(s) ainda em transparência`)

    // Camada com rolagem interna: a janela cresce só para esta foto.
    let cresceu = false
    if (prep.camada) {
      const sobra = await sobraDeRolagem(sessao, seletor)
      if (sobra > 0) {
        await aplicarFormato(sessao, formato, formato.height + sobra + 48)
        cresceu = true
        await espera(600)
      }
    }
    await bombearQuadros(sessao)

    const nome = `${dobra.id}${prep.sufixo ? `-${prep.sufixo}` : ''}-${formato.nome}.jpg`
    const medidas = await fotografar(sessao, seletor, join(SAIDA, nome))
    if (cresceu) await aplicarFormato(sessao, formato)

    console.log(`   ${nome}  ${medidas.largura}×${medidas.altura}`)
    return { caminho: `${URL_PUBLICA}/${nome}`, ...medidas }
  } finally {
    await sessao.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier })
    if (desligarInterceptacao) await desligarInterceptacao()
    // Esvazia a página antes da próxima: o popup e o balão têm temporizador.
    await sessao.enviar('Page.navigate', { url: 'about:blank' }).catch(() => {})
    await espera(200)
  }
}

async function principal() {
  const chrome = acharChrome()
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge instalados')

  // Confere que o dev server responde antes de subir o navegador.
  try {
    await fetch(BASE)
  } catch {
    throw new Error(`${BASE} não respondeu. Rode \`npm run dev\` antes (ou defina PRINT_BASE).`)
  }

  // Porta ocupada é Chrome de outra pessoa: não mexer.
  const ocupada = await fetch(`http://127.0.0.1:${PORTA}/json/version`).then(() => true, () => false)
  if (ocupada) throw new Error(`a porta ${PORTA} já tem um Chrome. Use CAPTURA_PORTA=<outra>.`)

  const inventario = JSON.parse(readFileSync(INVENTARIO, 'utf8'))
  const todas = inventario.decks.flatMap((deck) => deck.dobras.map((dobra) => ({ ...dobra, deck: deck.id })))
  const filtros = process.argv.slice(2)
  const escolhidas = filtros.length
    ? todas.filter((d) => filtros.some((f) => d.id.startsWith(f)))
    : todas
  if (!escolhidas.length) throw new Error(`nenhuma dobra começa com ${filtros.join(', ')}`)

  mkdirSync(SAIDA, { recursive: true })
  const arquivoJson = join(SAIDA, 'capturas.json')
  // Rodada parcial atualiza só as dobras pedidas; a completa refaz tudo.
  const capturas = filtros.length && existsSync(arquivoJson) ? JSON.parse(readFileSync(arquivoJson, 'utf8')) : {}
  if (!filtros.length) {
    for (const arquivo of readdirSync(SAIDA)) {
      if (arquivo.endsWith('.jpg')) rmSync(join(SAIDA, arquivo))
    }
  }

  rmSync(PERFIL, { recursive: true, force: true })
  const processo = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    // Aba em segundo plano não pode ter o relógio freado: o popup e o
    // balão dependem de setTimeout, as entradas de requestAnimationFrame.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--force-color-profile=srgb',
    '--lang=pt-BR',
    `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${PERFIL}`,
    'about:blank',
  ], { stdio: 'ignore' })

  const falhas = []
  try {
    const versao = await esperarChrome()

    for (const formato of FORMATOS) {
      console.log(`\n${formato.nome} (${formato.width}×${formato.height})`)

      const alvo = await fetch(
        `http://127.0.0.1:${PORTA}/json/new?${encodeURIComponent('about:blank')}`,
        { method: 'PUT' },
      ).then((r) => r.json())
      const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)

      await sessao.enviar('Page.enable')
      await sessao.enviar('Runtime.enable')
      await sessao.enviar('Network.enable')
      await sessao.enviar('Network.setBlockedURLs', { urls: URLS_BLOQUEADAS })
      await sessao.enviar('Page.bringToFront')
      await sessao.enviar('Emulation.setFocusEmulationEnabled', { enabled: true })
      await aplicarFormato(sessao, formato)
      if (formato.mobile) {
        await sessao.enviar('Emulation.setUserAgentOverride', { userAgent: formato.userAgent, platform: 'Android' })
        await sessao.enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
      }
      // Movimento reduzido para a foto: a flutuação do carro do topo e o
      // trilho de montadoras param na posição de repouso. As entradas das
      // seções continuam (o framer-motion só as desliga se o site pedir).
      await sessao.enviar('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      })

      let reserva = null

      for (const dobra of escolhidas) {
        const registro = capturas[dobra.id] ?? {
          desktop: null,
          celular: null,
          larguraDesktop: null,
          alturaDesktop: null,
          larguraCelular: null,
          alturaCelular: null,
        }
        capturas[dobra.id] = registro
        const sufixoCampo = formato.nome === 'desktop' ? 'Desktop' : 'Celular'

        if (!dobra.seletor) {
          console.log(`   ${dobra.id}: sem seletor, pulada`)
          continue
        }

        if (dobra.rota.startsWith('/reservar/') && !reserva) {
          console.log('   preparando o checkout com "Dados falsos"...')
          reserva = await semearCheckout(sessao)
        }

        const estados = estadosDa(dobra, formato)
        const extras = []
        for (const prep of estados) {
          try {
            const foto = await capturarEstado(sessao, formato, dobra, prep, reserva)
            if (prep.sufixo) {
              extras.push({ estado: prep.sufixo, ...foto })
            } else {
              registro[formato.nome] = foto.caminho
              registro[`largura${sufixoCampo}`] = foto.largura
              registro[`altura${sufixoCampo}`] = foto.altura
            }
          } catch (erro) {
            const rotulo = `${dobra.id}${prep.sufixo ? `-${prep.sufixo}` : ''} (${formato.nome})`
            console.error(`   FALHOU ${rotulo}: ${erro.message}`)
            falhas.push(`${rotulo}: ${erro.message}`)
          }
        }

        // Estados a mais (balão, avisos da lista) ficam ao lado da principal.
        if (extras.length) {
          const porEstado = new Map((registro.extras ?? []).map((e) => [e.estado, e]))
          for (const extra of extras) {
            const atual = porEstado.get(extra.estado) ?? { estado: extra.estado }
            atual[formato.nome] = extra.caminho
            atual[`largura${sufixoCampo}`] = extra.largura
            atual[`altura${sufixoCampo}`] = extra.altura
            porEstado.set(extra.estado, atual)
          }
          registro.extras = [...porEstado.values()]
        }
      }

      sessao.fechar()
      await fetch(`http://127.0.0.1:${PORTA}/json/close/${alvo.id}`).catch(() => {})
    }

    // Na ordem do inventário, mesmo numa rodada parcial.
    const ordenado = {}
    for (const dobra of todas) {
      if (capturas[dobra.id]) ordenado[dobra.id] = capturas[dobra.id]
    }
    writeFileSync(arquivoJson, `${JSON.stringify(ordenado, null, 2)}\n`)

    const bytes = readdirSync(SAIDA).reduce((soma, f) => soma + statSync(join(SAIDA, f)).size, 0)
    console.log(`\nPronto: public/doc/copy/ com ${(bytes / 1024 / 1024).toFixed(1)} MB`)

    // Fecha o navegador pelo protocolo; o kill abaixo é só a rede de segurança.
    const navegador = await abrirSessao(versao.webSocketDebuggerUrl).catch(() => null)
    await navegador?.enviar('Browser.close').catch(() => {})
  } finally {
    processo.kill()
    await espera(800)
    rmSync(PERFIL, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  }

  if (falhas.length) {
    console.error(`\n${falhas.length} captura(s) falharam:\n  ${falhas.join('\n  ')}`)
    process.exit(1)
  }
}

principal().catch((erro) => {
  console.error('Falhou:', erro.message)
  process.exit(1)
})
