/**
 * Quebras de linha dos textos do site, para /doc/marketing ("Textos: quebras
 * de linha e leitura").
 *
 *   npm run dev                                (noutro terminal)
 *   node scripts/capturar-textos.mjs           (todos os blocos)
 *   node scripts/capturar-textos.mjs home      (só os que começam assim)
 *
 * Lê os blocos de `src/content/marketing-quebras.js` e, em 1440 e em 390:
 *
 *   - lê cada texto como está no ar (o `<br>` vira quebra; o resto é o texto
 *     corrido, sem o caixa-alta que o CSS põe nos rótulos);
 *   - mede como ele quebra hoje: a palavra de cada linha, pela posição de
 *     cada letra na tela (Range.getClientRects), e quantos caracteres cabem;
 *   - contorna cada texto, numerado na ordem da ficha, apaga o resto, e
 *     grava o recorte em `public/doc/marketing/textos/<id>-desktop.jpg` e
 *     `<id>-celular.jpg`.
 *
 * Tudo vai para `src/content/marketing-quebras-medidas.json`.
 *
 * ATENÇÃO — em dev o site fala com a API REAL da locadora. Os dois blocos da
 * pré-reserva precisam do checkout preenchido: o botão "Dados falsos"
 * (DevSeed) só consulta disponibilidade, e a tela de confirmação recebe um
 * localizador inventado direto na sessionStorage. Nada aqui clica em
 * "Confirmar pré-reserva" nem envia formulário, e a confirmação, o
 * cancelamento e o WhatsApp ficam bloqueados na rede, por garantia.
 */

import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { Buffer } from 'node:buffer'
import process from 'node:process'

const RAIZ = process.cwd()
const BASE = process.env.PRINT_BASE ?? 'http://localhost:5173'
const PORTA = Number(process.env.CAPTURA_PORTA ?? 9353)
const SAIDA = join(RAIZ, 'public/doc/marketing/textos')
const MEDIDAS = join(RAIZ, 'src/content/marketing-quebras-medidas.json')
const PERFIL = join(tmpdir(), `locafacil-capturar-textos-${PORTA}`)

const { BLOCOS_TEXTO } = await import(pathToFileURL(join(RAIZ, 'src/content/marketing-quebras.js')).href)

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

const UA_CELULAR =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'

const FORMATOS = [
  { nome: 'desktop', width: 1440, height: 900, escala: 1, mobile: false },
  { nome: 'celular', width: 390, height: 844, escala: 2, mobile: true },
]

const CSS_PRELOADER = '.fixed.inset-0[role="status"][aria-label="Carregando"] { display: none !important; }'
const CSS_ANDAIME = 'div.fixed.bottom-4.left-4 { display: none !important; }'
const CSS_POPUP = 'div.fixed.inset-0:has(> [aria-labelledby="desconto-titulo"]) { display: none !important; }'

const URLS_BLOQUEADAS = ['*reservation-confirm*', '*reservation-cancel*', '*api.whatsapp.com*', '*wa.me*']

const CHAVE_RESERVA = 'locafacil_reservation'
// Localizador de mentira para a tela de confirmação (mesmo formato do ConfID).
const CONF_ID_FALSO = '482913'

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

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
      if (msg.method) for (const cb of ouvintes.get(msg.method) ?? []) cb(msg.params)
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
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORTA}/json/version`)
      if (res.ok) return await res.json()
    } catch {
      /* subindo */
    }
    await espera(250)
  }
  throw new Error('o Chrome não abriu a porta de depuração')
}

async function avaliar(sessao, expressao) {
  const { result, exceptionDetails } = await sessao.enviar('Runtime.evaluate', {
    expression: expressao,
    awaitPromise: true,
    returnByValue: true,
  })
  if (exceptionDetails) throw new Error(`erro na página: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`)
  return result.value
}

async function esperarAte(sessao, expressao, tempo = 30000) {
  const limite = Date.now() + tempo
  while (Date.now() < limite) {
    try {
      if (await avaliar(sessao, `Boolean(${expressao})`)) return
    } catch {
      /* trocando de página */
    }
    await espera(200)
  }
  throw new Error(`tempo esgotado esperando ${expressao}`)
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

let UA_PADRAO = ''

async function aplicarFormato(sessao, formato) {
  await sessao.enviar('Emulation.setDeviceMetricsOverride', {
    width: formato.width,
    height: formato.height,
    deviceScaleFactor: formato.escala,
    mobile: formato.mobile,
    screenWidth: formato.width,
    screenHeight: formato.height,
  })
  await sessao.enviar('Emulation.setUserAgentOverride', formato.mobile
    ? { userAgent: UA_CELULAR, platform: 'Android' }
    : { userAgent: UA_PADRAO })
  await sessao.enviar('Emulation.setTouchEmulationEnabled', { enabled: formato.mobile, maxTouchPoints: formato.mobile ? 5 : 1 })
}

/* Percorre a página para disparar os `whileInView`, espera as imagens e as
   entradas assentarem (com quadros forçados, senão o framer-motion para). */
async function prepararPagina(sessao) {
  await avaliar(
    sessao,
    `(async () => {
      const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
      await document.fonts.ready
      const passo = Math.max(200, Math.floor(innerHeight * 0.5))
      for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
        scrollTo({ top: y, behavior: 'instant' })
        await pausa(100)
      }
      scrollTo({ top: 0, behavior: 'instant' })
      await pausa(1500)
      return true
    })()`,
  )
  for (let i = 0; i < 6; i += 1) {
    await sessao.enviar('Page.captureScreenshot', { format: 'jpeg', quality: 10, clip: { x: 0, y: 0, width: 8, height: 8, scale: 1 } })
    await espera(150)
  }
}

/* Texto de um elemento como a copy é escrita: `<br>` vira quebra, o resto é
   texto corrido. `textContent` e não `innerText`: este último devolve o
   caixa-alta do CSS e as quebras de bloco. */
const FUNCOES_DA_PAGINA = `
  window.__textoDe = (el) => {
    let saida = ''
    const andar = (no) => {
      for (const filho of no.childNodes) {
        if (filho.nodeType === 3) saida += filho.data
        else if (filho.nodeName === 'BR') saida += '\\n'
        else if (filho.nodeType === 1 && getComputedStyle(filho).display !== 'none') andar(filho)
      }
    }
    andar(el)
    return saida.split('\\n').map((linha) => linha.replace(/\\s+/g, ' ').trim()).join('\\n').trim()
  }
  /* Linhas como o navegador as desenha: cada letra tem um retângulo, e letra
     com o topo mais abaixo que meia linha começa linha nova. */
  window.__linhasDe = (el) => {
    const percurso = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const faixa = document.createRange()
    const linhas = []
    let topo = null
    let no
    while ((no = percurso.nextNode())) {
      for (let i = 0; i < no.data.length; i += 1) {
        faixa.setStart(no, i)
        faixa.setEnd(no, i + 1)
        const r = faixa.getClientRects()[0]
        if (!r || (r.width === 0 && /\\s/.test(no.data[i]))) {
          if (linhas.length) linhas[linhas.length - 1] += ' '
          continue
        }
        if (topo === null || r.top - topo > r.height * 0.5) {
          linhas.push('')
          topo = r.top
        }
        linhas[linhas.length - 1] += no.data[i]
      }
    }
    return linhas.map((linha) => linha.replace(/\\s+/g, ' ').trim()).filter(Boolean)
  }
  window.__achar = (seletor) =>
    [...document.querySelectorAll(seletor)].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
`

async function medirBloco(sessao, bloco) {
  return avaliar(
    sessao,
    `(() => {
      ${FUNCOES_DA_PAGINA}
      const textos = ${JSON.stringify(bloco.textos)}
      return textos.map((t) => {
        const el = window.__achar(t.seletor)
        if (!el) return { id: t.id, ausente: true }
        const r = el.getBoundingClientRect()
        const linhas = window.__linhasDe(el)
        return {
          id: t.id,
          texto: window.__textoDe(el),
          linhas,
          caracteresPorLinha: Math.max(0, ...linhas.map((linha) => linha.length)),
          largura: Math.round(r.width),
        }
      })
    })()`,
  )
}

/* Contorno numerado em cada texto e véu sobre o resto: um SVG do tamanho do
   documento com os retângulos vazados (regra evenodd). Devolve a caixa do
   recorte: a união dos textos com uma margem, na largura da janela. */
async function destacar(sessao, bloco) {
  return avaliar(
    sessao,
    `(() => {
      ${FUNCOES_DA_PAGINA}
      document.querySelectorAll('[data-texto-destaque]').forEach((el) => el.remove())
      const textos = ${JSON.stringify(bloco.textos)}
      const largura = document.documentElement.scrollWidth
      const altura = document.documentElement.scrollHeight
      const caixas = textos
        .map((t, i) => {
          const el = window.__achar(t.seletor)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { n: i + 1, x: r.left + scrollX - 6, y: r.top + scrollY - 4, w: r.width + 12, h: r.height + 8 }
        })
        .filter(Boolean)
      if (!caixas.length) return null

      const ns = 'http://www.w3.org/2000/svg'
      const svg = document.createElementNS(ns, 'svg')
      svg.setAttribute('data-texto-destaque', '')
      svg.setAttribute('width', largura)
      svg.setAttribute('height', altura)
      Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', zIndex: 2147483000, pointerEvents: 'none' })
      const caminho = document.createElementNS(ns, 'path')
      caminho.setAttribute('fill', 'rgba(8, 17, 33, 0.55)')
      caminho.setAttribute('fill-rule', 'evenodd')
      caminho.setAttribute('d', 'M0 0H' + largura + 'V' + altura + 'H0Z ' + caixas.map((c) => 'M' + c.x + ' ' + c.y + 'h' + c.w + 'v' + c.h + 'h' + (-c.w) + 'Z').join(' '))
      svg.appendChild(caminho)
      for (const c of caixas) {
        const borda = document.createElementNS(ns, 'rect')
        Object.entries({ x: c.x, y: c.y, width: c.w, height: c.h, rx: 6, fill: 'none', stroke: '#2563EB', 'stroke-width': 3 })
          .forEach(([k, v]) => borda.setAttribute(k, v))
        svg.appendChild(borda)
      }
      document.body.appendChild(svg)

      // Número de cada texto, na ordem da ficha, no canto do contorno: ao
      // lado dele invadia o selo vizinho, que fica a 16 px.
      for (const c of caixas) {
        const selo = document.createElement('span')
        selo.setAttribute('data-texto-destaque', '')
        selo.textContent = c.n
        Object.assign(selo.style, {
          position: 'absolute', left: Math.max(0, c.x - 9) + 'px', top: Math.max(0, c.y - 9) + 'px', zIndex: 2147483001,
          width: '20px', height: '20px', borderRadius: '10px', background: '#2563EB', color: '#fff',
          font: '700 11px/20px Archivo, system-ui, sans-serif', textAlign: 'center', pointerEvents: 'none',
        })
        document.body.appendChild(selo)
      }

      const topo = Math.min(...caixas.map((c) => c.y)) - 48
      const base = Math.max(...caixas.map((c) => c.y + c.h)) + 48
      const y = Math.max(0, Math.floor(topo))
      return { x: 0, y, width: document.documentElement.clientWidth, height: Math.min(Math.ceil(base) - y, 4000) }
    })()`,
  )
}

async function fotografar(sessao, caixa, formato, arquivo) {
  const { data } = await sessao.enviar('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 78,
    clip: { ...caixa, scale: 1 },
    captureBeyondViewport: true,
    fromSurface: true,
  })
  writeFileSync(arquivo, Buffer.from(data, 'base64'))
  return { largura: Math.round(caixa.width * formato.escala), altura: Math.round(caixa.height * formato.escala) }
}

/** Prepara o checkout pelo andaime e devolve o estado gravado. */
async function semearCheckout(sessao) {
  await navegar(sessao, `${BASE}/reservar`)
  const botao = `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Dados falsos')`
  await esperarAte(sessao, botao, 45000)
  await avaliar(sessao, `(() => { ${botao}.click(); return true })()`)
  const limite = Date.now() + 90000
  while (Date.now() < limite) {
    const rota = await avaliar(sessao, 'location.pathname').catch(() => '')
    if (rota === '/reservar/revisao') {
      const bruto = await avaliar(sessao, `sessionStorage.getItem(${JSON.stringify(CHAVE_RESERVA)})`)
      const estado = JSON.parse(bruto ?? '{}')
      if (estado.selectedVehicle && estado.driver) return estado
    }
    await espera(300)
  }
  throw new Error('"Dados falsos" não chegou à revisão em 90 s')
}

/* Estado da tela de confirmação, com o localizador falso. Mesma conta da
   `reserva-08-confirmacao` de `capturar-copy.mjs`. */
function comConfirmacao(estado) {
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
    confirmation: { confId: CONF_ID_FALSO, vehicle: { groupName: offer.groupName }, days: offer.days || 1 },
    confirmationTotals: { total: (offer.totals?.estimated ?? 0) + protecao + opcionais, coverageItem },
    demo: false,
  }
}

/* Grava o checkout pela /robots.txt (mesma origem, sem React por cima). */
async function gravarReserva(sessao, estado) {
  await navegar(sessao, `${BASE}/robots.txt`)
  await avaliar(sessao, `(() => { sessionStorage.setItem(${JSON.stringify(CHAVE_RESERVA)}, ${JSON.stringify(JSON.stringify(estado))}); return true })()`)
}

async function principal() {
  const chrome = CHROMES.find((caminho) => existsSync(caminho))
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge instalados')
  try {
    await fetch(BASE)
  } catch {
    throw new Error(`${BASE} não respondeu. Rode \`npm run dev\` antes (ou defina PRINT_BASE).`)
  }
  const ocupada = await fetch(`http://127.0.0.1:${PORTA}/json/version`).then(() => true, () => false)
  if (ocupada) throw new Error(`a porta ${PORTA} já tem um Chrome. Use CAPTURA_PORTA=<outra>.`)

  const filtros = process.argv.slice(2)
  const escolhidos = filtros.length ? BLOCOS_TEXTO.filter((b) => filtros.some((f) => b.id.startsWith(f))) : BLOCOS_TEXTO
  if (!escolhidos.length) throw new Error(`nenhum bloco começa com ${filtros.join(', ')}`)

  mkdirSync(SAIDA, { recursive: true })
  const medidas = existsSync(MEDIDAS) ? JSON.parse(readFileSync(MEDIDAS, 'utf8')) : {}
  medidas.blocos ??= {}

  rmSync(PERFIL, { recursive: true, force: true })
  const processo = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding', '--force-color-profile=srgb', '--lang=pt-BR',
    `--remote-debugging-port=${PORTA}`, `--user-data-dir=${PERFIL}`, 'about:blank',
  ], { stdio: 'ignore' })

  const falhas = []
  try {
    const versao = await esperarChrome()
    UA_PADRAO = versao['User-Agent'].replace('HeadlessChrome', 'Chrome')
    const alvo = await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json())
    const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
    await sessao.enviar('Page.enable')
    await sessao.enviar('Runtime.enable')
    await sessao.enviar('Network.enable')
    await sessao.enviar('Network.setBlockedURLs', { urls: URLS_BLOQUEADAS })
    await sessao.enviar('Emulation.setFocusEmulationEnabled', { enabled: true })
    await sessao.enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    await sessao.enviar('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const pendurar = () => {
          const estilo = document.createElement('style')
          estilo.textContent = ${JSON.stringify([CSS_PRELOADER, CSS_ANDAIME, CSS_POPUP].join('\n'))}
          document.documentElement.appendChild(estilo)
        }
        if (document.documentElement) pendurar()
        else document.addEventListener('readystatechange', pendurar, { once: true })
      })()`,
    })

    let reserva = null
    for (const formato of FORMATOS) {
      await aplicarFormato(sessao, formato)
      for (const bloco of escolhidos) {
        try {
          if (bloco.checkout) {
            if (!reserva) {
              console.log('   preparando o checkout com "Dados falsos"...')
              reserva = await semearCheckout(sessao)
            }
            await gravarReserva(sessao, bloco.checkout === 'confirmacao' ? comConfirmacao(reserva) : reserva)
          }
          await navegar(sessao, `${BASE}${bloco.rota}?print=1`)
          const primeiro = `[...document.querySelectorAll(${JSON.stringify(bloco.textos[0].seletor)})].find((el) => el.getBoundingClientRect().width > 0)`
          await esperarAte(sessao, primeiro, 45000)
          await prepararPagina(sessao)

          const textos = await medirBloco(sessao, bloco)
          const ausentes = textos.filter((t) => t.ausente).map((t) => t.id)
          if (ausentes.length) console.warn(`     aviso: ${bloco.id} sem ${ausentes.join(', ')}`)

          const caixa = await destacar(sessao, bloco)
          if (!caixa) throw new Error('nenhum texto do bloco na página')
          await espera(200)
          const arquivo = `${bloco.id}-${formato.nome}.jpg`
          const foto = await fotografar(sessao, caixa, formato, join(SAIDA, arquivo))

          const registro = (medidas.blocos[bloco.id] ??= { rota: bloco.rota, textos: {}, formatos: {} })
          // O texto é o mesmo nos dois formatos; o do computador manda.
          for (const t of textos) if (!t.ausente && (formato.nome === 'desktop' || !registro.textos[t.id])) registro.textos[t.id] = t.texto
          registro.formatos[formato.nome] = {
            recorte: { caminho: `/doc/marketing/textos/${arquivo}`, ...foto },
            textos: Object.fromEntries(
              textos.filter((t) => !t.ausente).map((t) => [t.id, { linhas: t.linhas, caracteresPorLinha: t.caracteresPorLinha, largura: t.largura }]),
            ),
          }
          console.log(`   ${arquivo}  ${foto.largura}×${foto.altura}  ${textos.map((t) => (t.ausente ? `${t.id}:?` : `${t.id}:${t.linhas.length}`)).join(' ')}`)
        } catch (erro) {
          console.error(`   FALHOU ${bloco.id} (${formato.nome}): ${erro.message}`)
          falhas.push(`${bloco.id} (${formato.nome}): ${erro.message}`)
        }
      }
    }

    const ordenado = { medidoEm: new Date().toISOString().slice(0, 10), blocos: {} }
    for (const bloco of BLOCOS_TEXTO) if (medidas.blocos[bloco.id]) ordenado.blocos[bloco.id] = medidas.blocos[bloco.id]
    writeFileSync(MEDIDAS, `${JSON.stringify(ordenado, null, 2)}\n`)
    console.log(`\nPronto: ${escolhidos.length} bloco(s), medidas em src/content/marketing-quebras-medidas.json`)

    sessao.fechar()
    const navegador = await abrirSessao(versao.webSocketDebuggerUrl).catch(() => null)
    await navegador?.enviar('Browser.close').catch(() => {})
  } finally {
    processo.kill()
    await espera(800)
    rmSync(PERFIL, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  }

  if (falhas.length) {
    console.error(`\n${falhas.length} falha(s):\n  ${falhas.join('\n  ')}`)
    process.exit(1)
  }
}

principal().catch((erro) => {
  console.error('Falhou:', erro.message)
  process.exit(1)
})
