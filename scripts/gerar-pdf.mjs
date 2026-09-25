/**
 * Gera o PDF de apresentação do site, para mandar ao cliente e ao marketing.
 *
 *   node scripts/print-telas.mjs   (antes, se os prints mudaram)
 *   node scripts/gerar-pdf.mjs
 *
 * Fonte: `docs/apresentacao.html`. Saída: `apresentacao/Locafacil-Apresentacao.pdf`.
 *
 * Este script não precisa do dev server: monta uma pasta temporária com o HTML
 * e as imagens lado a lado e imprime o arquivo direto do disco.
 *
 * Por que reduzir os prints antes de imprimir: as capturas saem em 2× para
 * retina e somam 22 MB. Embutidas cruas, o PDF não passa por e-mail nem por
 * WhatsApp. Reduzidas para 1400 px de largura e recodificadas em JPEG, o
 * documento inteiro fica em poucos megabytes e continua nítido em papel.
 *
 * A redução roda dentro do próprio Chrome, via canvas, como em
 * `converter-veiculos.mjs` — sem dependência nova. O acesso de um arquivo
 * local a outro exige `--allow-file-access-from-files`; sem a flag o canvas
 * fica marcado como contaminado e `toDataURL` estoura.
 */

import { writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const RAIZ = process.cwd()
const FONTE = join(RAIZ, 'docs', 'apresentacao.html')
const PRINTS = join(RAIZ, 'prints')
const LOGO = join(RAIZ, 'src', 'assets', 'brand', 'logo-lockup-color.svg')
const SAIDA = join(RAIZ, 'apresentacao')
const MONTAGEM = join(SAIDA, '.build')
const PDF = join(SAIDA, 'Locafacil-Apresentacao.pdf')
const PORTA = 9335

const LARGURA_MAX = 1400
const QUALIDADE = 0.82

/* Só as capturas usadas no documento. As de página inteira ficam de fora: são
   as mais pesadas e o PDF não é o lugar de mostrar a página inteira rolada. */
const IMAGENS = [
  '01-home-desktop-dobra',
  '02-reservar-busca-desktop-dobra',
  '03-para-empresas-desktop-dobra',
  '04-contato-desktop-dobra',
  '01-home-mobile-dobra',
  '02-reservar-busca-mobile-dobra',
  '03-para-empresas-mobile-dobra',
  '04-contato-mobile-dobra',
]

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

/* Roda dentro da página: lê o PNG, reduz e devolve JPEG sobre branco.
   O fundo branco é explícito porque JPEG não tem transparência — sem ele,
   pixel transparente vira preto. */
const REDUZIR = `
async (arquivo, larguraMax, qualidade) => {
  const img = new Image()
  img.src = arquivo
  await img.decode()

  const escala = Math.min(1, larguraMax / img.naturalWidth)
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * escala)
  c.height = Math.round(img.naturalHeight * escala)

  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, 0, 0, c.width, c.height)

  return { jpeg: c.toDataURL('image/jpeg', qualidade), largura: c.width, altura: c.height }
}
`

async function esperarChrome() {
  for (let tentativa = 0; tentativa < 40; tentativa += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORTA}/json/version`)
      if (res.ok) return
    } catch {
      /* ainda subindo */
    }
    await espera(250)
  }
  throw new Error('o Chrome não abriu a porta de depuração')
}

async function novaAba(url) {
  const alvo = await fetch(
    `http://127.0.0.1:${PORTA}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT' },
  ).then((r) => r.json())
  const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
  await sessao.enviar('Page.enable')
  return { alvo, sessao }
}

async function principal() {
  const chrome = CHROMES.find((caminho) => existsSync(caminho))
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge instalados')
  if (!existsSync(FONTE)) throw new Error(`não achei ${FONTE}`)
  if (!existsSync(PRINTS)) {
    throw new Error('a pasta prints/ não existe. Rode `node scripts/print-telas.mjs` antes.')
  }

  const faltando = IMAGENS.filter((nome) => !existsSync(join(PRINTS, `${nome}.png`)))
  if (faltando.length) {
    throw new Error(`faltam capturas em prints/: ${faltando.join(', ')}`)
  }

  rmSync(MONTAGEM, { recursive: true, force: true })
  mkdirSync(join(MONTAGEM, 'img'), { recursive: true })
  copyFileSync(FONTE, join(MONTAGEM, 'index.html'))
  copyFileSync(LOGO, join(MONTAGEM, 'img', 'logo.svg'))

  const processo = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-extensions',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${PORTA}`,
    '--user-data-dir=' + join(MONTAGEM, '.perfil'),
    'about:blank',
  ], { stdio: 'ignore' })

  try {
    await esperarChrome()

    // --- 1. Reduzir as capturas -------------------------------------------
    const base = pathToFileURL(join(MONTAGEM, 'index.html')).href
    const { alvo, sessao } = await novaAba(base)
    await espera(1000)

    let peso = 0
    for (const nome of IMAGENS) {
      const origem = pathToFileURL(join(PRINTS, `${nome}.png`)).href
      const { result } = await sessao.enviar('Runtime.evaluate', {
        expression: `(${REDUZIR})(${JSON.stringify(origem)}, ${LARGURA_MAX}, ${QUALIDADE})`,
        awaitPromise: true,
        returnByValue: true,
      })
      if (!result.value?.jpeg) throw new Error(`não consegui reduzir ${nome}.png`)
      const bytes = Buffer.from(result.value.jpeg.split(',')[1], 'base64')
      writeFileSync(join(MONTAGEM, 'img', `${nome}.jpg`), bytes)
      peso += bytes.length
      console.log(`  ${nome}.jpg`.padEnd(42), `${result.value.largura}x${result.value.altura}`, (bytes.length / 1024).toFixed(0) + ' kB')
    }
    sessao.fechar()
    await fetch(`http://127.0.0.1:${PORTA}/json/close/${alvo.id}`)

    // --- 2. Imprimir -------------------------------------------------------
    const impressao = await novaAba('about:blank')
    await impressao.sessao.enviar('Page.navigate', { url: base })
    // Tempo real: a fonte vem do Google Fonts e as imagens do disco.
    await espera(3000)
    await impressao.sessao.enviar('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => true)',
      awaitPromise: true,
    })
    await espera(500)

    const { data } = await impressao.sessao.enviar('Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;font-size:7pt;color:#8a8a92;font-family:sans-serif;'
        + 'padding:0 16mm;display:flex;justify-content:space-between;">'
        + '<span>Locafácil — novo site · apresentação e homologação</span>'
        + '<span class="pageNumber"></span></div>',
      marginTop: 0.7,
      marginBottom: 0.7,
    })

    const pdf = Buffer.from(data, 'base64')
    writeFileSync(PDF, pdf)
    impressao.sessao.fechar()
    await fetch(`http://127.0.0.1:${PORTA}/json/close/${impressao.alvo.id}`)

    console.log(`\nImagens: ${(peso / 1024 / 1024).toFixed(1)} MB`)
    console.log(`PDF:     ${(pdf.length / 1024 / 1024).toFixed(1)} MB — ${PDF}`)
  } finally {
    processo.kill()
    await espera(500)
    // `--manter` deixa a montagem em pé para abrir no navegador e conferir a
    // paginação antes de imprimir de novo.
    if (process.argv.includes('--manter')) {
      rmSync(join(MONTAGEM, '.perfil'), { recursive: true, force: true })
      console.log(`Montagem mantida: ${MONTAGEM}`)
    } else {
      rmSync(MONTAGEM, { recursive: true, force: true })
    }
  }
}

// `readFileSync` fica aqui só para a mensagem de erro citar o arquivo certo
// quando o HTML existe mas está vazio — engano comum ao editar o documento.
if (existsSync(FONTE) && readFileSync(FONTE, 'utf8').trim().length === 0) {
  console.error('Falhou: docs/apresentacao.html está vazio')
  process.exit(1)
}

principal().catch((erro) => {
  console.error('Falhou:', erro.message)
  process.exit(1)
})
