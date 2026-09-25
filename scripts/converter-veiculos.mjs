/**
 * Normaliza as fotos da frota para o card de veículos.
 *
 *   npm run dev                          (noutro terminal)
 *   node scripts/converter-veiculos.mjs
 *
 * Lê os PNG em `public/__tmp-veiculos/<CODIGO>.png`, recorta a moldura vazia,
 * centraliza numa tela 4:3 e grava `.webp` em `src/assets/veiculos/`.
 *
 * Por que normalizar: as fotos chegam em proporções diferentes (623×401,
 * 667×374, 1100×628). Postas direto no card, cada uma ocuparia uma altura, e a
 * grade dançaria de linha em linha. Aqui todas saem 800×600, com o carro
 * ocupando a mesma fração da tela — o card fica estável e a comparação entre
 * grupos passa a ser sobre o carro, não sobre o enquadramento.
 *
 * Fundo branco vira transparente por limiar sobre a **luminância das bordas**,
 * com busca a partir das quatro quinas. Limiar simples sobre a imagem inteira
 * comeria a lataria dos carros claros — Argo, Pulse e Kwid são brancos.
 *
 * Usa o Chrome pelo DevTools Protocol (canvas + toDataURL), como o
 * print-telas.mjs: sem dependência nova, sem baixar binário.
 */

import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const BASE = process.env.PRINT_BASE ?? 'http://localhost:5173'
const ENTRADA = join(process.cwd(), 'public', '__tmp-veiculos')
const SAIDA = join(process.cwd(), 'src', 'assets', 'veiculos')
const PORTA = 9334

const LARGURA = 800
const ALTURA = 600
const QUALIDADE = 0.88

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

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
    ws.onopen = () => resolve({
      enviar: (method, params = {}) => new Promise((resolver, rejeitar) => {
        const id = ++proximoId
        pendentes.set(id, { resolver, rejeitar })
        ws.send(JSON.stringify({ id, method, params }))
      }),
      fechar: () => ws.close(),
    })
  })
}

/* Roda dentro da página: recorta, limpa o fundo e devolve o webp. */
const NO_NAVEGADOR = `
async (arquivo, LARGURA, ALTURA, QUALIDADE) => {
  const img = new Image()
  img.src = arquivo
  await img.decode()

  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const dados = ctx.getImageData(0, 0, c.width, c.height)
  const px = dados.data

  const alpha = (x, y) => px[(y * c.width + x) * 4 + 3]

  // O arquivo já vem recortado? As quatro quinas dizem. Quando vem, usar
  // limiar de branco é o que estraga: a lataria de um carro branco tem
  // pixels tão claros quanto o fundo, e o preenchimento entra pela
  // carroceria furando o teto e o capô.
  const quinas = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]]
  const jaRecortado = quinas.every(([x, y]) => alpha(x, y) < 12)

  const claro = (x, y) => {
    const i = (y * c.width + x) * 4
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]]
    // Branco de estúdio é quase puro E quase neutro. A lataria clara tem
    // sombra e uma leve dominante, e não passa nos dois testes ao mesmo tempo.
    return r > 247 && g > 247 && b > 247 && Math.max(r, g, b) - Math.min(r, g, b) < 4
  }

  const fundo = jaRecortado
    ? (x, y) => alpha(x, y) < 12
    : (x, y) => alpha(x, y) < 12 || claro(x, y)

  // Preenchimento a partir das quatro quinas: só some o branco ligado à
  // borda. O branco de dentro do carro (farol, placa, lataria) fica.
  const marcado = new Uint8Array(c.width * c.height)
  const pilha = [0, 0, c.width - 1, 0, 0, c.height - 1, c.width - 1, c.height - 1]
  while (pilha.length) {
    const y = pilha.pop(), x = pilha.pop()
    if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue
    const k = y * c.width + x
    if (marcado[k] || !fundo(x, y)) continue
    marcado[k] = 1
    pilha.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  let minX = c.width, minY = c.height, maxX = -1, maxY = -1
  for (let y = 0; y < c.height; y += 1) {
    for (let x = 0; x < c.width; x += 1) {
      const k = y * c.width + x
      if (marcado[k]) {
        px[k * 4 + 3] = 0
      } else if (alpha(x, y) > 12) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  ctx.putImageData(dados, 0, 0)

  if (maxX < 0) { minX = 0; minY = 0; maxX = c.width - 1; maxY = c.height - 1 }
  const larguraCarro = maxX - minX + 1
  const alturaCarro = maxY - minY + 1

  // Tela final: o carro ocupa 92% da largura útil, centralizado, com o
  // mesmo respiro em todas as fotos.
  const saida = document.createElement('canvas')
  saida.width = LARGURA
  saida.height = ALTURA
  const sctx = saida.getContext('2d')
  sctx.imageSmoothingQuality = 'high'

  const escala = Math.min((LARGURA * 0.92) / larguraCarro, (ALTURA * 0.82) / alturaCarro)
  const w = larguraCarro * escala
  const h = alturaCarro * escala
  sctx.drawImage(c, minX, minY, larguraCarro, alturaCarro, (LARGURA - w) / 2, (ALTURA - h) / 2, w, h)

  return {
    webp: saida.toDataURL('image/webp', QUALIDADE),
    origem: img.naturalWidth + 'x' + img.naturalHeight,
    recorte: larguraCarro + 'x' + alturaCarro,
    modo: jaRecortado ? 'alfa' : 'branco',
  }
}
`

async function principal() {
  const chrome = CHROMES.find((c) => existsSync(c))
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge')
  if (!existsSync(ENTRADA)) throw new Error(`não achei ${ENTRADA}`)
  try { await fetch(BASE) } catch { throw new Error(`${BASE} não respondeu. Rode \`npm run dev\`.`) }

  mkdirSync(SAIDA, { recursive: true })
  const arquivos = readdirSync(ENTRADA).filter((f) => f.endsWith('.png'))

  const processo = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
    `--remote-debugging-port=${PORTA}`, '--user-data-dir=' + join(SAIDA, '.perfil'), 'about:blank',
  ], { stdio: 'ignore' })

  try {
    for (let i = 0; i < 40; i += 1) {
      try { if ((await fetch(`http://127.0.0.1:${PORTA}/json/version`)).ok) break } catch { /* subindo */ }
      await espera(250)
    }

    const alvo = await fetch(`http://127.0.0.1:${PORTA}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' }).then((r) => r.json())
    const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
    await sessao.enviar('Page.enable')
    await sessao.enviar('Page.navigate', { url: BASE })
    await espera(2500)

    for (const arquivo of arquivos) {
      const codigo = arquivo.replace('.png', '')
      const { result } = await sessao.enviar('Runtime.evaluate', {
        expression: `(${NO_NAVEGADOR})('/__tmp-veiculos/${arquivo}', ${LARGURA}, ${ALTURA}, ${QUALIDADE})`,
        awaitPromise: true,
        returnByValue: true,
      })
      if (!result.value?.webp) throw new Error(`falhou em ${arquivo}`)
      const { webp, origem, recorte, modo } = result.value
      const bytes = Buffer.from(webp.split(',')[1], 'base64')
      writeFileSync(join(SAIDA, `grupo-${codigo.toLowerCase()}.webp`), bytes)
      console.log(`  grupo-${codigo.toLowerCase()}.webp`.padEnd(26), `${origem} → recorte ${recorte} (${modo}) → ${LARGURA}x${ALTURA}`, (bytes.length / 1024).toFixed(0) + ' kB')
    }

    sessao.fechar()
    await fetch(`http://127.0.0.1:${PORTA}/json/close/${alvo.id}`)
  } finally {
    processo.kill()
    await espera(500)
    rmSync(join(SAIDA, '.perfil'), { recursive: true, force: true })
  }
}

principal().catch((e) => { console.error('Falhou:', e.message); process.exit(1) })
