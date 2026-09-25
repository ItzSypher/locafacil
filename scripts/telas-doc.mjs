/**
 * Prepara os arquivos que as páginas de documentação servem.
 *
 *   node scripts/print-telas.mjs   (antes, se o visual mudou)
 *   node scripts/telas-doc.mjs
 *
 * Faz duas coisas:
 *
 *   1. Reduz as capturas de `prints/` e grava em `public/doc/telas/`. As
 *      originais saem em 2× para retina e somam 22 MB — servidas assim, a
 *      página de documentação pesaria mais que o site inteiro. Reduzidas e
 *      recodificadas em JPEG, as oito ficam em menos de 1 MB.
 *
 *   2. Copia os arquivos de marca para `public/doc/marca/`, para o time de
 *      marketing baixar o logotipo da própria página.
 *
 * A saída é versionada de propósito: a Vercel publica o que está no
 * repositório, e `prints/` não está. Sem este passo as telas quebrariam em
 * produção mesmo funcionando no navegador de quem gerou.
 *
 * A redução roda dentro do Chrome, via canvas, como em
 * `converter-veiculos.mjs` — sem dependência nova. O acesso de um arquivo
 * local a outro exige `--allow-file-access-from-files`; sem a flag o canvas
 * fica marcado como contaminado e `toDataURL` estoura.
 */

import { writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const RAIZ = process.cwd()
const PRINTS = join(RAIZ, 'prints')
const MARCA_ORIGEM = join(RAIZ, 'src', 'assets', 'brand')
const SAIDA_TELAS = join(RAIZ, 'public', 'doc', 'telas')
const SAIDA_MARCA = join(RAIZ, 'public', 'doc', 'marca')
const PORTA = 9337

/* Só a primeira dobra: é o que cabe num cartão de galeria. A página inteira
   continua em `prints/`, para quem precisar. */
const TELAS = [
  { origem: '01-home-desktop-dobra', destino: '01-home-desktop', largura: 1400 },
  { origem: '02-reservar-busca-desktop-dobra', destino: '02-reservar-busca-desktop', largura: 1400 },
  { origem: '03-para-empresas-desktop-dobra', destino: '03-para-empresas-desktop', largura: 1400 },
  { origem: '04-contato-desktop-dobra', destino: '04-contato-desktop', largura: 1400 },
  { origem: '01-home-mobile-dobra', destino: '01-home-mobile', largura: 780 },
  { origem: '02-reservar-busca-mobile-dobra', destino: '02-reservar-busca-mobile', largura: 780 },
  { origem: '03-para-empresas-mobile-dobra', destino: '03-para-empresas-mobile', largura: 780 },
  { origem: '04-contato-mobile-dobra', destino: '04-contato-mobile', largura: 780 },
]

const MARCA = [
  'logo-lockup-color.svg',
  'logo-lockup-white.svg',
  'logo-lockup-black.svg',
  'symbol-color.svg',
  'symbol-white.svg',
]

const QUALIDADE = 0.82

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

/* Roda dentro da página: reduz e devolve JPEG sobre branco. O fundo branco é
   explícito porque JPEG não tem transparência — sem ele, pixel transparente
   vira preto. */
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

async function principal() {
  const chrome = CHROMES.find((caminho) => existsSync(caminho))
  if (!chrome) throw new Error('não encontrei o Chrome nem o Edge instalados')
  if (!existsSync(PRINTS)) {
    throw new Error('a pasta prints/ não existe. Rode `node scripts/print-telas.mjs` antes.')
  }

  const faltando = TELAS.filter(({ origem }) => !existsSync(join(PRINTS, `${origem}.png`)))
  if (faltando.length) {
    throw new Error(`faltam capturas: ${faltando.map((t) => t.origem).join(', ')}`)
  }

  mkdirSync(SAIDA_TELAS, { recursive: true })
  mkdirSync(SAIDA_MARCA, { recursive: true })

  const perfil = join(RAIZ, 'public', 'doc', '.perfil')
  const processo = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${perfil}`,
    'about:blank',
  ], { stdio: 'ignore' })

  try {
    for (let tentativa = 0; tentativa < 40; tentativa += 1) {
      try { if ((await fetch(`http://127.0.0.1:${PORTA}/json/version`)).ok) break } catch { /* subindo */ }
      await espera(250)
    }

    /* A página que faz a redução precisa ser ela própria um `file://`: a
       flag de acesso a arquivos vale para documentos de arquivo, e um
       `about:blank` continua sem permissão para ler o PNG do disco. */
    const conversor = join(RAIZ, 'public', 'doc', '.conversor.html')
    writeFileSync(conversor, '<!doctype html><meta charset="utf-8"><title>conversor</title>')

    const alvo = await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' })
      .then((r) => r.json())
    const sessao = await abrirSessao(alvo.webSocketDebuggerUrl)
    await sessao.enviar('Page.enable')
    await sessao.enviar('Page.navigate', { url: pathToFileURL(conversor).href })
    await espera(800)

    let peso = 0
    for (const tela of TELAS) {
      const origem = pathToFileURL(join(PRINTS, `${tela.origem}.png`)).href
      const { result } = await sessao.enviar('Runtime.evaluate', {
        expression: `(${REDUZIR})(${JSON.stringify(origem)}, ${tela.largura}, ${QUALIDADE})`,
        awaitPromise: true,
        returnByValue: true,
      })
      if (!result.value?.jpeg) throw new Error(`não consegui reduzir ${tela.origem}.png`)
      const bytes = Buffer.from(result.value.jpeg.split(',')[1], 'base64')
      writeFileSync(join(SAIDA_TELAS, `${tela.destino}.jpg`), bytes)
      peso += bytes.length
      console.log(
        `  telas/${tela.destino}.jpg`.padEnd(42),
        `${result.value.largura}x${result.value.altura}`,
        `${(bytes.length / 1024).toFixed(0)} kB`,
      )
    }

    sessao.fechar()
    await fetch(`http://127.0.0.1:${PORTA}/json/close/${alvo.id}`)
    rmSync(conversor, { force: true })

    for (const arquivo of MARCA) {
      copyFileSync(join(MARCA_ORIGEM, arquivo), join(SAIDA_MARCA, arquivo))
      console.log(`  marca/${arquivo}`)
    }

    console.log(`\nTelas: ${(peso / 1024 / 1024).toFixed(1)} MB em public/doc/telas/`)
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
