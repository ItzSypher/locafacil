/**
 * Prints das telas para quem produz banner e material de campanha.
 *
 *   npm run dev          (noutro terminal)
 *   node scripts/print-telas.mjs
 *
 * Fala direto com o Chrome pelo DevTools Protocol, sem dependência nova: o
 * Node 22 já traz um cliente WebSocket embutido.
 *
 * Por que não `chrome --screenshot`: aquele atalho fotografa assim que o
 * `load` dispara, e as seções deste site entram com animação. O resultado
 * saía pela metade — título sem subtítulo, seção sem botão. Com `--virtual-
 * time-budget` fica pior, porque o framer-motion mantém um rAF vivo e o
 * relógio virtual nunca chega ao fim. Aqui a espera é de tempo real, e a
 * captura usa `captureBeyondViewport` para pegar a página inteira de uma vez.
 */

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const BASE = process.env.PRINT_BASE ?? 'http://localhost:5173'
const SAIDA = join(process.cwd(), 'prints')
const PORTA = 9333

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

const TELAS = [
  { rota: '/', nome: '01-home' },
  { rota: '/reservar', nome: '02-reservar-busca' },
  { rota: '/para-empresas', nome: '03-para-empresas' },
  { rota: '/contato', nome: '04-contato' },
]

const FORMATOS = [
  { nome: 'desktop', width: 1440, height: 900, escala: 2 },
  { nome: 'mobile', width: 390, height: 844, escala: 2, mobile: true },
]

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

function acharChrome() {
  for (const caminho of CHROMES) {
    if (existsSync(caminho)) return caminho
  }
  return null
}

/** Sessão CDP mínima: envia comando, espera a resposta com o mesmo id. */
function abrirSessao(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const pendentes = new Map()
    let proximoId = 0

    ws.onmessage = (evento) => {
      const msg = JSON.parse(evento.data)
      if (msg.id != null && pendentes.has(msg.id)) {
        const { resolver, rejeitar } = pendentes.get(msg.id)
        pendentes.delete(msg.id)
        msg.error ? rejeitar(new Error(msg.error.message)) : resolver(msg.result)
      }
    }
    ws.onerror = () => reject(new Error('não consegui falar com o Chrome'))
    ws.onopen = () =>
      resolve({
        enviar: (method, params = {}) =>
          new Promise((resolver, rejeitar) => {
            const id = ++proximoId
            pendentes.set(id, { resolver, rejeitar })
            ws.send(JSON.stringify({ id, method, params }))
          }),
        fechar: () => ws.close(),
      })
  })
}

async function esperarChrome() {
  for (let tentativa = 0; tentativa < 40; tentativa += 1) {
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

async function principal() {
  const chrome = acharChrome()
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge instalados')

  // Confere que o dev server responde antes de subir o navegador.
  try {
    await fetch(BASE)
  } catch {
    throw new Error(`${BASE} não respondeu. Rode \`npm run dev\` antes.`)
  }

  rmSync(SAIDA, { recursive: true, force: true })
  mkdirSync(SAIDA, { recursive: true })

  const processo = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-extensions',
    `--remote-debugging-port=${PORTA}`,
    '--user-data-dir=' + join(SAIDA, '.perfil'),
    'about:blank',
  ], { stdio: 'ignore' })

  try {
    await esperarChrome()
    let total = 0

    for (const tela of TELAS) {
      for (const formato of FORMATOS) {
        const alvo = await fetch(
          `http://127.0.0.1:${PORTA}/json/new?${encodeURIComponent('about:blank')}`,
          { method: 'PUT' },
        ).then((r) => r.json())

        const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
        await sessao.enviar('Page.enable')
        await sessao.enviar('Emulation.setDeviceMetricsOverride', {
          width: formato.width,
          height: formato.height,
          deviceScaleFactor: formato.escala,
          mobile: Boolean(formato.mobile),
        })

        // `print=1` cala popups, assistente e abertura da marca.
        await sessao.enviar('Page.navigate', { url: `${BASE}${tela.rota}?print=1` })
        // Tempo real para as entradas assentarem e as imagens chegarem.
        await espera(4000)

        for (const [sufixo, inteira] of [['dobra', false], ['completa', true]]) {
          const { data } = await sessao.enviar('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: inteira,
            fromSurface: true,
          })
          const arquivo = join(SAIDA, `${tela.nome}-${formato.nome}-${sufixo}.png`)
          writeFileSync(arquivo, Buffer.from(data, 'base64'))
          total += 1
          console.log('  ', `${tela.nome}-${formato.nome}-${sufixo}.png`)
        }

        sessao.fechar()
        await fetch(`http://127.0.0.1:${PORTA}/json/close/${alvo.id}`)
      }
    }

    console.log(`\nPronto: ${total} arquivos em prints/`)
  } finally {
    processo.kill()
    await espera(500)
    rmSync(join(SAIDA, '.perfil'), { recursive: true, force: true })
  }
}

principal().catch((erro) => {
  console.error('Falhou:', erro.message)
  process.exit(1)
})
