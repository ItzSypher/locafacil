/**
 * Gera os PDFs de apresentação a partir das próprias páginas do site.
 *
 *   npm run dev                      (noutro terminal)
 *   node scripts/telas-doc.mjs       (se os prints mudaram)
 *   node scripts/gerar-pdf.mjs
 *
 * Saída: `public/doc/Locafacil-Apresentacao-Cliente.pdf` e
 * `-Marketing.pdf`, servidos pelo próprio site — o botão "Baixar em PDF" no
 * topo de cada página aponta para eles.
 *
 * O PDF é impresso de `/doc/cliente` e `/doc/marketing`, e não de um HTML
 * paralelo. Já foi assim, com um `docs/apresentacao.html` só para impressão, e
 * o problema é conhecido: duas fontes para o mesmo conteúdo envelhecem em
 * ritmos diferentes, e é sempre a que ninguém abriu que vai para o cliente.
 *
 * `?print=1` cala o preloader e os popups; `?impressao=1` abre o que estaria
 * recolhido e troca a galeria por um bloco que cabe no papel. O resto do
 * enfeite de tela sai pelas variantes `print:` do Tailwind.
 */

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const BASE = process.env.PRINT_BASE ?? 'http://localhost:5173'
const SAIDA = join(process.cwd(), 'public', 'doc')
const PORTA = 9335

const PAGINAS = [
  { rota: '/doc/cliente', arquivo: 'Locafacil-Apresentacao-Cliente.pdf', rodape: 'Locafácil — novo site · apresentação e homologação' },
  { rota: '/doc/marketing', arquivo: 'Locafacil-Apresentacao-Marketing.pdf', rodape: 'Locafácil — novo site · material para marketing' },
]

/* A4 em polegadas. A margem dá lugar ao rodapé com o número da página. */
const PAPEL = { paperWidth: 8.27, paperHeight: 11.69, marginTop: 0.5, marginBottom: 0.6, marginLeft: 0.4, marginRight: 0.4 }

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

const rodape = (texto) =>
  '<div style="width:100%;font-size:7pt;color:#8a8a92;font-family:sans-serif;'
  + 'padding:0 10mm;display:flex;justify-content:space-between;">'
  + `<span>${texto}</span><span class="pageNumber"></span></div>`

async function principal() {
  const chrome = CHROMES.find((caminho) => existsSync(caminho))
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge instalados')

  try {
    await fetch(BASE)
  } catch {
    throw new Error(`${BASE} não respondeu. Rode \`npm run dev\` antes.`)
  }

  if (!existsSync(join(SAIDA, 'telas'))) {
    throw new Error('faltam as telas em public/doc/telas/. Rode `node scripts/telas-doc.mjs` antes.')
  }

  mkdirSync(SAIDA, { recursive: true })
  const perfil = join(SAIDA, '.perfil')

  const processo = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-extensions',
    `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${perfil}`,
    'about:blank',
  ], { stdio: 'ignore' })

  try {
    for (let tentativa = 0; tentativa < 40; tentativa += 1) {
      try { if ((await fetch(`http://127.0.0.1:${PORTA}/json/version`)).ok) break } catch { /* subindo */ }
      await espera(250)
    }

    for (const pagina of PAGINAS) {
      const alvo = await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' })
        .then((r) => r.json())
      const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
      await sessao.enviar('Page.enable')
      await sessao.enviar('Page.navigate', { url: `${BASE}${pagina.rota}?print=1&impressao=1` })

      // Tempo real: a rota chega por `lazy`, e as oito telas vêm do disco.
      await espera(4000)
      await sessao.enviar('Runtime.evaluate', {
        expression: 'document.fonts.ready.then(() => true)',
        awaitPromise: true,
      })
      await espera(500)

      const { data } = await sessao.enviar('Page.printToPDF', {
        ...PAPEL,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: rodape(pagina.rodape),
      })

      const pdf = Buffer.from(data, 'base64')
      writeFileSync(join(SAIDA, pagina.arquivo), pdf)
      console.log(`  ${pagina.arquivo}`.padEnd(46), `${(pdf.length / 1024 / 1024).toFixed(1)} MB`)

      sessao.fechar()
      await fetch(`http://127.0.0.1:${PORTA}/json/close/${alvo.id}`)
    }
  } finally {
    processo.kill()
    await espera(500)
    rmSync(perfil, { recursive: true, force: true })
  }
}

principal().catch((erro) => {
  console.error('Falhou:', erro.message)
  process.exit(1)
})
