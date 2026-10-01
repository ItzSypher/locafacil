/**
 * Espaços de imagem do site, para a entrega do design em /doc/marketing.
 *
 *   npm run dev                              (noutro terminal)
 *   node scripts/capturar-espacos.mjs        (todos os espaços)
 *   node scripts/capturar-espacos.mjs home   (só os que começam assim)
 *
 * Para cada espaço de `ESPACOS` abaixo, abre a página em 1440 e em 390 (e em
 * 768, onde a grade de duas colunas começa e a caixa da foto muda de forma),
 * mede cada imagem como o navegador a desenha e grava:
 *
 *   public/doc/marketing/espacos/<id>.jpg          recorte da seção, 1440
 *   public/doc/marketing/espacos/<id>-celular.jpg  recorte da seção, 390
 *   src/content/marketing-imagens-medidas.json     medidas de cada espaço
 *
 * No recorte, o espaço da imagem fica contornado e o resto da seção atenuado:
 * o designer vê exatamente o que vai trocar. O destaque é uma camada posta
 * por cima na hora da foto; o site não é tocado.
 *
 * As medidas alimentam `src/content/marketing-imagens.js`, que transforma
 * caixa desenhada em tamanho de exportação, proporção e área segura.
 *
 * ATENÇÃO — em dev o site fala com a API REAL da locadora. A foto da frota
 * precisa da lista de veículos, que este script prepara pelo botão "Dados
 * falsos" (DevSeed): ele só consulta disponibilidade. Nada aqui clica em
 * "Confirmar pré-reserva" nem envia formulário, e a confirmação, o
 * cancelamento e o WhatsApp ficam bloqueados na rede, por garantia.
 */

import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Buffer } from 'node:buffer'
import process from 'node:process'

const RAIZ = process.cwd()
const BASE = process.env.PRINT_BASE ?? 'http://localhost:5173'
const PORTA = Number(process.env.CAPTURA_PORTA ?? 9352)
const SAIDA = join(RAIZ, 'public/doc/marketing/espacos')
const MEDIDAS = join(RAIZ, 'src/content/marketing-imagens-medidas.json')
const PERFIL = join(tmpdir(), `locafacil-capturar-espacos-${PORTA}`)

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

const UA_CELULAR =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'

/* `foto` diz se a largura entra no recorte com o nome do formato. 768 só mede:
   é ali que a caixa da foto fica mais alta que larga em duas seções, e a área
   segura precisa saber disso. */
const FORMATOS = [
  { nome: 'desktop', width: 1440, height: 900, escala: 1, mobile: false, foto: true },
  { nome: 'tablet', width: 768, height: 1024, escala: 1, mobile: false, foto: false },
  { nome: 'celular', width: 390, height: 844, escala: 2, mobile: true, foto: true },
]

/**
 * Os espaços. `secao` é o que sai no recorte; `imagem` é o que se mede e se
 * contorna (o primeiro visível, ou todos com `todas`). `contorno` troca o
 * que se contorna quando são várias imagens (as logos: a faixa inteira).
 */
const ESPACOS = [
  {
    id: 'home-04-montadoras',
    rota: '/',
    secao: 'main > section:nth-of-type(2)',
    imagem: 'main > section:nth-of-type(2) .marquee ul:first-child img',
    todas: true,
    contorno: 'main > section:nth-of-type(2) .marquee',
  },
  {
    id: 'home-05-solucoes-assinatura',
    rota: '/',
    secao: 'main > section:nth-of-type(3)',
    imagem: 'main > section:nth-of-type(3) article:nth-of-type(1) img',
  },
  {
    id: 'home-05-solucoes-empresas',
    rota: '/',
    secao: 'main > section:nth-of-type(3)',
    imagem: 'main > section:nth-of-type(3) article:nth-of-type(2) img',
  },
  {
    id: 'home-06-por-que',
    rota: '/',
    secao: 'main > section:nth-of-type(4)',
    imagem: 'main > section:nth-of-type(4) img',
  },
  {
    id: 'empresas-contato-01-empresas-topo',
    rota: '/para-empresas',
    secao: 'header + div',
    imagem: 'header + div img',
  },
  {
    id: 'empresas-contato-02-empresas-crescer',
    rota: '/para-empresas',
    secao: 'main > section:nth-of-type(1)',
    imagem: 'main > section:nth-of-type(1) img',
  },
  {
    id: 'empresas-contato-03-empresas-motivos',
    rota: '/para-empresas',
    secao: 'main > section:nth-of-type(2)',
    imagem: 'main > section:nth-of-type(2) img',
  },
  {
    id: 'empresas-contato-05-contato-topo',
    rota: '/contato',
    secao: 'header + div',
    imagem: 'header + div img',
  },
  {
    id: 'empresas-contato-06-contato-equipe',
    rota: '/contato',
    secao: 'main > div > div:nth-of-type(1)',
    imagem: 'main > div > div:nth-of-type(1) img',
  },
  {
    id: 'frota',
    rota: '/reservar/veiculos',
    checkout: true,
    // A grade de cartões; a foto contornada é a do primeiro.
    secao: 'main div.grid:has(> article figure)',
    // Só a primeira fileira de cartões: o resto repete o desenho.
    limite: 0.85,
    imagem: 'main article figure img',
  },
]

const CSS_PRELOADER = '.fixed.inset-0[role="status"][aria-label="Carregando"] { display: none !important; }'
const CSS_ANDAIME = 'div.fixed.bottom-4.left-4 { display: none !important; }'
const CSS_POPUP = 'div.fixed.inset-0:has(> [aria-labelledby="desconto-titulo"]) { display: none !important; }'

const URLS_BLOQUEADAS = ['*reservation-confirm*', '*reservation-cancel*', '*api.whatsapp.com*', '*wa.me*']

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

const achar = (seletor) =>
  `[...document.querySelectorAll(${JSON.stringify(seletor)})].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })`

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

/* Percorre a página para disparar os `whileInView` e as imagens preguiçosas,
   espera tudo baixar e as entradas assentarem. */
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
      const imagens = [...document.images]
      await Promise.race([
        Promise.all(imagens.map((img) => img.complete ? null : new Promise((r) => {
          img.addEventListener('load', r, { once: true })
          img.addEventListener('error', r, { once: true })
        }))),
        pausa(10000),
      ])
      await pausa(1500)
      return true
    })()`,
  )
  // Quadros forçados: sem eles o requestAnimationFrame para e o
  // framer-motion fica no meio da entrada.
  for (let i = 0; i < 6; i += 1) {
    await sessao.enviar('Page.captureScreenshot', { format: 'jpeg', quality: 10, clip: { x: 0, y: 0, width: 8, height: 8, scale: 1 } })
    await espera(150)
  }
}

/** Medidas de cada imagem do espaço, como o navegador desenha. */
async function medir(sessao, espaco) {
  return avaliar(
    sessao,
    `(() => {
      const todas = [...document.querySelectorAll(${JSON.stringify(espaco.imagem)})]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      const lista = ${espaco.todas ? 'todas' : 'todas.slice(0, 1)'}
      return lista.map((img) => {
        const r = img.getBoundingClientRect()
        const s = getComputedStyle(img)
        return {
          alt: img.alt || null,
          arquivo: (img.currentSrc || img.src).split('/').pop().split('?')[0],
          largura: Math.round(r.width * 10) / 10,
          altura: Math.round(r.height * 10) / 10,
          naturalLargura: img.naturalWidth,
          naturalAltura: img.naturalHeight,
          objectFit: s.objectFit,
          objectPosition: s.objectPosition,
          filtro: s.filter === 'none' ? null : s.filter,
          opacidade: Number(s.opacity),
        }
      })
    })()`,
  )
}

/* Camada de destaque: contorno no espaço, véu escuro no resto. Fica em
   coordenadas do documento, acima de tudo, sem receber clique. */
async function destacar(sessao, espaco, rotulo) {
  const alvo = espaco.contorno ?? espaco.imagem
  return avaliar(
    sessao,
    `(() => {
      document.querySelectorAll('[data-espaco-destaque]').forEach((el) => el.remove())
      const alvos = [${achar(alvo)}].filter(Boolean)
      for (const el of alvos) {
        const r = el.getBoundingClientRect()
        const caixa = document.createElement('div')
        caixa.setAttribute('data-espaco-destaque', '')
        Object.assign(caixa.style, {
          position: 'absolute',
          left: (r.left + scrollX) + 'px',
          top: (r.top + scrollY) + 'px',
          width: r.width + 'px',
          height: r.height + 'px',
          outline: '4px solid #2563EB',
          outlineOffset: '2px',
          borderRadius: '12px',
          boxShadow: '0 0 0 100vmax rgba(8, 17, 33, 0.62)',
          zIndex: 2147483000,
          pointerEvents: 'none',
        })
        const etiqueta = document.createElement('span')
        etiqueta.textContent = ${JSON.stringify(rotulo)}
        // Acima do contorno quando cabe: dentro, ela cobre justamente o que
        // o designer precisa ver (na faixa de logos, a primeira marca).
        const fora = r.top + scrollY > 48
        Object.assign(etiqueta.style, {
          position: 'absolute',
          left: fora ? '-4px' : '8px',
          top: fora ? '-42px' : '8px',
          background: '#2563EB',
          color: '#fff',
          font: '600 13px/1.2 Archivo, system-ui, sans-serif',
          padding: '6px 10px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
        })
        caixa.appendChild(etiqueta)
        document.body.appendChild(caixa)
      }
      return alvos.length
    })()`,
  )
}

/* Recorte: a seção inteira, com uma margem, até 1.8× a altura da janela —
   o suficiente para o contexto, sem virar a página inteira. */
async function fotografar(sessao, espaco, formato, arquivo) {
  const caixa = await avaliar(
    sessao,
    `(() => {
      const secao = ${achar(espaco.secao)}
      const alvo = ${achar(espaco.contorno ?? espaco.imagem)}
      if (!secao || !alvo) return null
      const s = secao.getBoundingClientRect()
      const a = alvo.getBoundingClientRect()
      const topo = s.top + scrollY
      const altura = s.height
      const limite = innerHeight * ${espaco.limite ?? 1.8}
      let y = topo
      let h = altura
      if (altura > limite) {
        // Seção alta (celular): centra o recorte no espaço da imagem.
        const centro = a.top + scrollY + a.height / 2
        y = Math.max(topo, Math.min(centro - limite / 2, topo + altura - limite))
        h = limite
      }
      return { x: 0, y: Math.max(0, Math.floor(y)), width: document.documentElement.clientWidth, height: Math.ceil(h) }
    })()`,
  )
  if (!caixa) throw new Error(`seção ou imagem de ${espaco.id} não está na página`)
  const { data } = await sessao.enviar('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 78,
    clip: { ...caixa, scale: 1 },
    captureBeyondViewport: true,
    fromSurface: true,
  })
  writeFileSync(arquivo, Buffer.from(data, 'base64'))
  // Medida do arquivo, para a página reservar o espaço antes de baixar.
  return { largura: Math.round(caixa.width * formato.escala), altura: Math.round(caixa.height * formato.escala) }
}

async function semearCheckout(sessao) {
  await navegar(sessao, `${BASE}/reservar`)
  await esperarAte(sessao, `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Dados falsos')`, 45000)
  await avaliar(sessao, `(() => { [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Dados falsos').click(); return true })()`)
  const limite = Date.now() + 90000
  while (Date.now() < limite) {
    const rota = await avaliar(sessao, 'location.pathname').catch(() => '')
    if (rota === '/reservar/revisao') return
    await espera(300)
  }
  throw new Error('"Dados falsos" não chegou à revisão em 90 s')
}

const nomeDoFormato = (formato) => (formato.nome === 'desktop' ? '' : `-${formato.nome}`)

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
  const escolhidos = filtros.length ? ESPACOS.filter((e) => filtros.some((f) => e.id.startsWith(f))) : ESPACOS
  if (!escolhidos.length) throw new Error(`nenhum espaço começa com ${filtros.join(', ')}`)

  mkdirSync(SAIDA, { recursive: true })
  const medidas = existsSync(MEDIDAS) ? JSON.parse(readFileSync(MEDIDAS, 'utf8')) : {}

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
    // O headless se anuncia como HeadlessChrome; o site não liga, mas a
    // volta do celular para o computador precisa de um valor para repor.
    UA_PADRAO = versao['User-Agent'].replace('HeadlessChrome', 'Chrome')
    const alvo = await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json())
    const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
    await sessao.enviar('Page.enable')
    await sessao.enviar('Runtime.enable')
    await sessao.enviar('Network.enable')
    await sessao.enviar('Network.setBlockedURLs', { urls: URLS_BLOQUEADAS })
    await sessao.enviar('Emulation.setFocusEmulationEnabled', { enabled: true })
    // Movimento reduzido: o carro do topo para de flutuar e a faixa de logos
    // para na posição inicial — a medida não muda, a foto sai parada.
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

    let semeado = false
    for (const espaco of escolhidos) {
      const registro = { rota: espaco.rota, formatos: {} }
      for (const formato of FORMATOS) {
        try {
          await aplicarFormato(sessao, formato)
          if (espaco.checkout && !semeado) {
            console.log('   preparando o checkout com "Dados falsos"...')
            await semearCheckout(sessao)
            semeado = true
          }
          await navegar(sessao, `${BASE}${espaco.rota}?print=1`)
          try {
            await esperarAte(sessao, achar(espaco.imagem), 45000)
          } catch {
            const onde = await avaliar(sessao, `location.pathname + ' · ' + document.querySelectorAll('figure').length + ' figura(s)'`).catch(() => '?')
            throw new Error(`a imagem não apareceu (página: ${onde})`)
          }
          await prepararPagina(sessao)
          const imagens = await medir(sessao, espaco)
          registro.formatos[formato.nome] = { janela: formato.width, imagens }
          const maior = imagens.reduce((m, i) => (i.largura * i.altura > m.largura * m.altura ? i : m), imagens[0])
          console.log(`   ${espaco.id} @${formato.width}: ${imagens.map((i) => `${i.largura}×${i.altura}`).join(', ')}`)

          if (formato.foto) {
            const rotulo = espaco.todas
              ? 'Logos das montadoras'
              : `Espaço da imagem · ${Math.round(maior.largura)}×${Math.round(maior.altura)} px na tela`
            await destacar(sessao, espaco, rotulo)
            await espera(200)
            const arquivo = join(SAIDA, `${espaco.id}${nomeDoFormato(formato)}.jpg`)
            const foto = await fotografar(sessao, espaco, formato, arquivo)
            registro.formatos[formato.nome].recorte = {
              caminho: `/doc/marketing/espacos/${espaco.id}${nomeDoFormato(formato)}.jpg`,
              ...foto,
            }
          }
        } catch (erro) {
          console.error(`   FALHOU ${espaco.id} @${formato.width}: ${erro.message}`)
          falhas.push(`${espaco.id} @${formato.width}: ${erro.message}`)
        }
      }
      medidas[espaco.id] = registro
    }

    const ordenado = { medidoEm: new Date().toISOString().slice(0, 10) }
    for (const espaco of ESPACOS) if (medidas[espaco.id]) ordenado[espaco.id] = medidas[espaco.id]
    writeFileSync(MEDIDAS, `${JSON.stringify(ordenado, null, 2)}\n`)
    console.log(`\nPronto: ${escolhidos.length} espaço(s), medidas em src/content/marketing-imagens-medidas.json`)

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
