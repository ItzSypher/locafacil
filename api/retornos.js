import { Buffer } from 'node:buffer'
import { createHash, timingSafeEqual } from 'node:crypto'
import { put, list, get, del } from '@vercel/blob'

// Retornos das páginas internas: a homologação de /doc/cliente e
// /doc/marketing e a revisão de copy de /doc/copy.
//
// POST grava. As páginas salvam sozinhas a cada alteração, então quem marca
// três passos e fecha a aba já deixou o retorno aqui — sem depender de lembrar
// de copiar e mandar. Um arquivo por pessoa e por página, sobrescrito a cada
// salvamento: o que fica é sempre a versão mais nova de cada um.
//
// GET lista e DELETE apaga um retorno, os dois só com a senha de
// DOC_RETORNOS_SENHA. É quem alimenta /doc/retornos.
//
// A revisão de copy mora no mesmo endpoint, e não num arquivo novo em `api/`,
// porque o plano Hobby da Vercel limita o projeto a doze funções e já usamos
// onze. Ela tem forma própria (uma decisão por texto do site, observação e
// imagem por dobra) e por isso validação própria, mas o resto — senha,
// armazenamento, sobrescrita — é o mesmo dos outros retornos.
//
// Os arquivos de imagem do design (a agência entrega por /doc/marketing) também
// passam por aqui, pelo mesmo motivo: `?arquivo=1` no POST grava, e no GET e
// no DELETE, com a senha, devolve ou apaga um arquivo. Ver "arquivos do
// design" mais abaixo.
//
// O armazenamento é o Vercel Blob `locafacil-retornos`, privado: os arquivos
// não têm URL pública, e só esta função, com BLOB_READ_WRITE_TOKEN, lê e
// escreve. Sem o token — rodando local com `npm run dev` — o POST responde
// `salvo: false` e a página segue funcionando, guardando só no navegador.

const PUBLICOS = new Set(['cliente', 'marketing'])
const ID = /^[a-z0-9-]{8,64}$/
const PASSO = /^[a-z0-9-]{1,32}$/
const DATA_ISO = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/

// Limites generosos para quem escreve de verdade e curtos para quem tenta
// encher o armazenamento: a página é aberta para qualquer um com o link.
const LIMITE_NOME = 80
const LIMITE_NOTA = 2000
const LIMITE_PASSOS = 30
const LIMITE_CORPO = 40_000

const PREFIXO = 'retornos/'

/* ------------------------------------------------------ revisão de copy -- */

// Identificador de texto e de dobra, os mesmos do inventário
// (`src/content/copy/inventario.json`). `livre` é o alvo do espaço livre.
const CHAVE = /^[a-z0-9-]{1,80}$/
const DECISOES = new Set(['manter', 'trocar', 'tirar'])

// O site tem entre 150 e 300 textos; a folga cobre o inventário crescer sem
// abrir espaço para um corpo arbitrário.
const LIMITE_TEXTOS = 400
const LIMITE_DOBRAS = 80
const LIMITE_CORPO_COPY = 200_000
// O espaço livre é onde cabe "falta uma seção inteira", com o texto dela.
// Os 2000 caracteres de uma observação cortariam justamente esse pedido.
const LIMITE_LIVRE = 8000
const LIMITE_VERSAO = 40

// A página reduz a imagem antes de mandar (JPEG, lado maior de 1600px); o
// limite aqui é a rede de segurança, não o caminho normal.
const LIMITE_ANEXO = 1.5 * 1024 * 1024
// Base64 ocupa 4/3 do binário, mais o cabeçalho do data URL. Conferir o
// tamanho da string antes de decodificar evita alocar o que vai ser recusado.
const LIMITE_DATA_URL = Math.ceil((LIMITE_ANEXO * 4) / 3) + 64

const PREFIXO_COPY = 'copy/'
const PREFIXO_ANEXOS = 'copy-anexos/'

const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const TIPO_DA_EXTENSAO = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/
const CAMINHO_ANEXO = /^copy-anexos\/([a-z0-9-]{8,64})\/([a-z0-9-]{1,80})\.(jpg|png|webp)$/

const temArmazenamento = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

/* Comparação em tempo constante, sobre o hash das duas: comparar a string
   direto vaza pelo tempo de resposta quantos caracteres já estão certos. */
function senhaConfere(cabecalho) {
  const esperada = process.env.DOC_RETORNOS_SENHA
  if (!esperada) return false
  const recebida = String(cabecalho ?? '').replace(/^Bearer\s+/i, '')
  const a = createHash('sha256').update(recebida).digest()
  const b = createHash('sha256').update(esperada).digest()
  return timingSafeEqual(a, b)
}

const texto = (valor, limite) => String(valor ?? '').trim().slice(0, limite)

const recusa = (res, status, mensagem) =>
  res.status(status).json({ success: false, data: null, errors: [mensagem] })

/** Aceita só o formato que a página manda. Qualquer outra coisa é descartada. */
function validar(corpo) {
  if (!corpo || typeof corpo !== 'object') return { erro: 'Corpo vazio.' }
  if (corpo.publico === 'copy') return validarCopy(corpo)
  if (JSON.stringify(corpo).length > LIMITE_CORPO) return { erro: 'Retorno grande demais.' }

  const publico = String(corpo.publico ?? '')
  const id = String(corpo.id ?? '')
  if (!PUBLICOS.has(publico)) return { erro: 'Página desconhecida.' }
  if (!ID.test(id)) return { erro: 'Identificador inválido.' }

  const entrada = corpo.passos && typeof corpo.passos === 'object' ? corpo.passos : {}
  const passos = {}
  for (const [chave, valor] of Object.entries(entrada).slice(0, LIMITE_PASSOS)) {
    if (!PASSO.test(chave) || !valor || typeof valor !== 'object') continue
    passos[chave] = {
      feito: valor.feito === true,
      nota: texto(valor.nota, LIMITE_NOTA),
    }
  }

  const enviadoEm = DATA_ISO.test(String(corpo.enviadoEm ?? '')) ? corpo.enviadoEm : null

  return {
    retorno: {
      publico,
      id,
      nome: texto(corpo.nome, LIMITE_NOME),
      passos,
      enviadoEm,
      atualizadoEm: new Date().toISOString(),
    },
  }
}

/* Objeto simples, ou vazio quando não veio. Lista e texto no lugar de objeto
   são recusados: não é o formato que a página manda. */
function objeto(valor) {
  if (valor == null) return {}
  if (typeof valor !== 'object' || Array.isArray(valor)) return null
  return valor
}

/* A referência de anexo só vale se aponta para a imagem desta pessoa neste
   alvo. Sem isso, um retorno poderia apontar para o anexo de outra pessoa, e
   a tela de retornos mostraria a imagem errada debaixo do nome errado. */
function anexoConfere(caminho, id, alvo) {
  const partes = CAMINHO_ANEXO.exec(caminho)
  return Boolean(partes) && partes[1] === id && partes[2] === alvo
}

/* Observação, anexo e "parte concluída" de uma dobra (ou do espaço livre).
   Devolve `null` quando não há nada, para o arquivo guardar só o que foi
   escrito. `revisada` só é guardado quando é verdadeiro: parte não concluída
   é o estado de quem nem abriu, e não precisa de linha no arquivo. */
function validarBloco(valor, { id, alvo, limite }) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return { erro: `Bloco “${alvo}” em formato inválido.` }
  }
  const nota = valor.nota == null ? '' : String(valor.nota)
  if (nota.length > limite) return { erro: `Observação de “${alvo}” passa de ${limite} caracteres.` }
  const anexo = valor.anexo == null || valor.anexo === '' ? '' : String(valor.anexo)
  if (anexo && !anexoConfere(anexo, id, alvo)) return { erro: `Anexo de “${alvo}” inválido.` }
  if (valor.revisada != null && typeof valor.revisada !== 'boolean') {
    return { erro: `Marcação de concluída em “${alvo}” inválida.` }
  }

  const bloco = {}
  if (nota.trim()) bloco.nota = nota.trim()
  if (anexo) bloco.anexo = anexo
  if (valor.revisada === true && alvo !== 'livre') bloco.revisada = true
  return { bloco: Object.keys(bloco).length ? bloco : null }
}

/* A revisão de copy recusa em vez de descartar em silêncio: um texto novo que
   some sem aviso é o pedido do cliente que não chega. A página já impede tudo
   o que é recusado aqui, então a recusa só aparece para quem não é a página. */
function validarCopy(corpo) {
  if (JSON.stringify(corpo).length > LIMITE_CORPO_COPY) return { erro: 'Revisão grande demais.' }

  const id = String(corpo.id ?? '')
  if (!ID.test(id)) return { erro: 'Identificador inválido.' }
  const nome = texto(corpo.nome, LIMITE_NOME)
  if (!nome) return { erro: 'Diga quem está respondendo.' }

  const entradaTextos = objeto(corpo.textos)
  const entradaDobras = objeto(corpo.dobras)
  const entradaLivre = objeto(corpo.livre)
  if (!entradaTextos || !entradaDobras || !entradaLivre) return { erro: 'Revisão em formato inválido.' }
  if (Object.keys(entradaTextos).length > LIMITE_TEXTOS) return { erro: 'Textos demais.' }
  if (Object.keys(entradaDobras).length > LIMITE_DOBRAS) return { erro: 'Dobras demais.' }

  const textos = {}
  for (const [chave, valor] of Object.entries(entradaTextos)) {
    if (!CHAVE.test(chave)) return { erro: 'Texto com identificador inválido.' }
    if (!valor || typeof valor !== 'object' || !DECISOES.has(valor.decisao)) {
      return { erro: `Decisão inválida no texto “${chave}”.` }
    }
    const item = { decisao: valor.decisao }
    if (valor.decisao === 'trocar') {
      const novo = valor.novo == null ? '' : String(valor.novo)
      if (novo.length > LIMITE_NOTA) return { erro: `Texto novo de “${chave}” passa de ${LIMITE_NOTA} caracteres.` }
      item.novo = novo.trim()
    }
    textos[chave] = item
  }

  const dobras = {}
  for (const [chave, valor] of Object.entries(entradaDobras)) {
    if (!CHAVE.test(chave)) return { erro: 'Dobra com identificador inválido.' }
    const { erro, bloco } = validarBloco(valor, { id, alvo: chave, limite: LIMITE_NOTA })
    if (erro) return { erro }
    if (bloco) dobras[chave] = bloco
  }

  const { erro: erroLivre, bloco: livre } = validarBloco(entradaLivre, {
    id,
    alvo: 'livre',
    limite: LIMITE_LIVRE,
  })
  if (erroLivre) return { erro: erroLivre }

  const enviadoEm = DATA_ISO.test(String(corpo.enviadoEm ?? '')) ? corpo.enviadoEm : null

  return {
    retorno: {
      publico: 'copy',
      id,
      nome,
      // Versão do inventário que a pessoa tinha na tela: se o site mudar
      // depois, dá para saber contra qual texto ela respondeu.
      versao: texto(corpo.versao, LIMITE_VERSAO) || null,
      textos,
      dobras,
      livre: livre ?? {},
      enviadoEm,
      atualizadoEm: new Date().toISOString(),
    },
  }
}

const caminhoDe = (retorno) =>
  retorno.publico === 'copy'
    ? `${PREFIXO_COPY}${retorno.id}.json`
    : `${PREFIXO}${retorno.publico}/${retorno.id}.json`

async function gravar(req, res) {
  const { erro, retorno } = validar(req.body)
  if (erro) return recusa(res, 400, erro)

  if (!temArmazenamento()) {
    return res.status(200).json({ success: true, data: { salvo: false }, errors: [] })
  }

  await put(caminhoDe(retorno), JSON.stringify(retorno), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })

  return res.status(200).json({
    success: true,
    data: { salvo: true, atualizadoEm: retorno.atualizadoEm },
    errors: [],
  })
}

/* O arquivo diz o que é pelos primeiros bytes, não pelo cabeçalho do data
   URL, que quem manda escreve como quiser. */
function assinaturaConfere(bytes, tipo) {
  if (tipo === 'image/jpeg') {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (tipo === 'image/png') {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    return bytes.length > png.length && png.every((byte, i) => bytes[i] === byte)
  }
  if (tipo === 'image/webp') {
    return (
      bytes.length > 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
  }
  return false
}

/* Imagem anexada a uma dobra ou ao espaço livre: um print rabiscado, uma
   referência. Um arquivo por pessoa e por alvo, sobrescrito quando a pessoa
   troca a imagem. A página guarda o caminho devolvido no retorno. */
async function gravarAnexo(req, res) {
  const corpo = req.body
  if (!corpo || typeof corpo !== 'object') return recusa(res, 400, 'Corpo vazio.')
  if (corpo.publico !== 'copy') return recusa(res, 400, 'Anexo só existe na revisão de copy.')

  const id = String(corpo.id ?? '')
  const alvo = String(corpo.alvo ?? '')
  if (!ID.test(id)) return recusa(res, 400, 'Identificador inválido.')
  if (!CHAVE.test(alvo)) return recusa(res, 400, 'Parte do site inválida.')

  const dataUrl = String(corpo.dataUrl ?? '')
  if (dataUrl.length > LIMITE_DATA_URL) return recusa(res, 400, 'Imagem grande demais.')
  const partes = DATA_URL.exec(dataUrl)
  if (!partes) return recusa(res, 400, 'Formato não aceito: use JPG, PNG ou WEBP.')

  const tipo = partes[1]
  const bytes = Buffer.from(partes[2], 'base64')
  if (bytes.length > LIMITE_ANEXO) return recusa(res, 400, 'Imagem grande demais.')
  if (!assinaturaConfere(bytes, tipo)) return recusa(res, 400, 'O arquivo não é a imagem que diz ser.')

  if (!temArmazenamento()) {
    return res.status(200).json({ success: true, data: { salvo: false }, errors: [] })
  }

  const caminho = `${PREFIXO_ANEXOS}${id}/${alvo}.${EXTENSAO[tipo]}`
  await put(caminho, bytes, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: tipo,
  })

  return res.status(200).json({ success: true, data: { salvo: true, anexo: caminho }, errors: [] })
}

/* ------------------------------------------------- arquivos do design -- */

/* A agência de design entrega as imagens do site por /doc/marketing: fotos
   das seções, logos das montadoras, fotos da frota. Diferente do anexo da
   copy, aqui o arquivo é o produto final — vai para o site como chegou. Por
   isso não há redução no navegador nem recompressão aqui: os bytes são
   gravados exatamente como saíram do programa de quem desenhou.

   O caminho é `marketing-arquivos/<pessoa>/<espaço>/<nome>`. Vários arquivos
   por espaço (duas opções de foto, a logo em SVG e em PNG); mandar de novo
   com o mesmo nome substitui. Ao lado, `marketing-arquivos/<pessoa>/quem.json`
   guarda o nome de quem enviou, para /doc/retornos dizer de quem é cada um. */

// 3 MB de arquivo viram 4 MB em base64. Com o resto do JSON, o corpo fica
// abaixo dos 4,5 MB que a Vercel aceita numa função.
const LIMITE_ARQUIVO = 3 * 1024 * 1024
const LIMITE_DATA_URL_ARQUIVO = Math.ceil((LIMITE_ARQUIVO * 4) / 3) + 64
// Folga para opções e versões, e teto para quem tenta encher o armazenamento.
const LIMITE_ARQUIVOS_POR_ESPACO = 12
const LIMITE_ARQUIVOS_POR_PESSOA = 150

const PREFIXO_ARQUIVOS = 'marketing-arquivos/'

const EXTENSAO_ARQUIVO = { ...EXTENSAO, 'image/svg+xml': 'svg' }
const TIPO_DO_ARQUIVO = { ...TIPO_DA_EXTENSAO, svg: 'image/svg+xml' }
const DATA_URL_ARQUIVO = /^data:(image\/(?:jpeg|png|webp|svg\+xml));base64,([A-Za-z0-9+/]+={0,2})$/
const CAMINHO_ARQUIVO =
  /^marketing-arquivos\/([a-z0-9-]{8,64})\/([a-z0-9-]{1,80})\/([a-z0-9]+(?:[._-][a-z0-9]+)*)\.(jpg|png|webp|svg)$/
const CAMINHO_QUEM = /^marketing-arquivos\/([a-z0-9-]{8,64})\/quem\.json$/

const caminhoDeQuem = (id) => `${PREFIXO_ARQUIVOS}${id}/quem.json`

/* Nome que vai para o caminho: sem acento, minúsculo, só letra, número e
   separador simples, e a extensão do tipo que os bytes provaram ter — não a
   que o arquivo trazia. `Logo FIAT (final).PNG` vira `logo-fiat-final.png`. */
function nomeDoArquivo(original, extensao) {
  const base = String(original ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,5}$/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/[._-]{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 60)
    .replace(/[._-]+$/, '')
  return `${base || 'arquivo'}.${extensao}`
}

/* SVG é texto: começa por `<svg` ou pela declaração `<?xml` (que é como o
   Illustrator e o Figma exportam), e em algum ponto abre a tag `<svg`. Byte
   nulo denuncia binário com nome de SVG. */
function svgConfere(bytes) {
  if (!bytes.length || bytes.includes(0)) return false
  let conteudo = bytes.toString('utf8')
  if (conteudo.charCodeAt(0) === 0xfeff) conteudo = conteudo.slice(1)
  conteudo = conteudo.trimStart()
  if (!conteudo.startsWith('<svg') && !conteudo.startsWith('<?xml')) return false
  return /<svg[\s>]/.test(conteudo)
}

async function gravarArquivo(req, res) {
  const corpo = req.body
  if (!corpo || typeof corpo !== 'object') return recusa(res, 400, 'Corpo vazio.')
  if (corpo.publico !== 'marketing') return recusa(res, 400, 'Arquivo do design só existe na página do marketing.')

  const id = String(corpo.id ?? '')
  const espaco = String(corpo.espaco ?? '')
  if (!ID.test(id)) return recusa(res, 400, 'Identificador inválido.')
  if (!CHAVE.test(espaco)) return recusa(res, 400, 'Espaço de imagem inválido.')
  const nome = texto(corpo.nome, LIMITE_NOME)
  if (!nome) return recusa(res, 400, 'Diga quem está enviando.')

  const dataUrl = String(corpo.dataUrl ?? '')
  if (dataUrl.length > LIMITE_DATA_URL_ARQUIVO) return recusa(res, 413, 'Arquivo grande demais: o limite é 3 MB.')
  const partes = DATA_URL_ARQUIVO.exec(dataUrl)
  if (!partes) return recusa(res, 415, 'Formato não aceito: use JPG, PNG, WEBP ou SVG.')

  const tipo = partes[1]
  const bytes = Buffer.from(partes[2], 'base64')
  if (bytes.length > LIMITE_ARQUIVO) return recusa(res, 413, 'Arquivo grande demais: o limite é 3 MB.')
  const confere = tipo === 'image/svg+xml' ? svgConfere(bytes) : assinaturaConfere(bytes, tipo)
  if (!confere) return recusa(res, 415, 'O arquivo não é a imagem que diz ser.')

  const arquivo = nomeDoArquivo(corpo.arquivo, EXTENSAO_ARQUIVO[tipo])

  if (!temArmazenamento()) {
    return res.status(200).json({ success: true, data: { salvo: false, arquivo, tamanho: bytes.length }, errors: [] })
  }

  const pasta = `${PREFIXO_ARQUIVOS}${id}/${espaco}/`
  const caminho = `${pasta}${arquivo}`
  const daPessoa = (await listarPrefixo(`${PREFIXO_ARQUIVOS}${id}/`)).filter((blob) => CAMINHO_ARQUIVO.test(blob.pathname))
  const substitui = daPessoa.some((blob) => blob.pathname === caminho)
  if (!substitui) {
    if (daPessoa.filter((blob) => blob.pathname.startsWith(pasta)).length >= LIMITE_ARQUIVOS_POR_ESPACO) {
      return recusa(
        res,
        400,
        `Este espaço já tem ${LIMITE_ARQUIVOS_POR_ESPACO} arquivos seus. Mande com o nome de um deles para substituir.`,
      )
    }
    if (daPessoa.length >= LIMITE_ARQUIVOS_POR_PESSOA) return recusa(res, 400, 'Arquivos demais. Fale com a equipe do projeto.')
  }

  await put(caminho, bytes, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: tipo,
  })
  const enviadoEm = new Date().toISOString()
  await put(caminhoDeQuem(id), JSON.stringify({ nome, atualizadoEm: enviadoEm }), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })

  return res.status(200).json({
    success: true,
    data: { salvo: true, caminho, arquivo, tamanho: bytes.length, substituiu: substitui, enviadoEm },
    errors: [],
  })
}

/* Bytes de um arquivo do design, só com a senha e só com o caminho na forma
   que `gravarArquivo` monta. SVG sai sempre como download: aberto no
   navegador, um SVG é documento e roda o script que trouxer. A CSP com
   `sandbox` é a segunda tranca, para o caso de alguém abrir mesmo assim. */
async function lerArquivo(req, res) {
  const caminho = String(req.query?.arquivo ?? '')
  const partes = CAMINHO_ARQUIVO.exec(caminho)
  if (!partes) return recusa(res, 400, 'Arquivo inválido.')

  let resultado = null
  try {
    resultado = await get(caminho, { access: 'private', useCache: false })
  } catch {
    resultado = null
  }
  if (resultado?.statusCode !== 200) return recusa(res, 404, 'Arquivo não encontrado.')

  const extensao = partes[4]
  const bytes = Buffer.from(await new Response(resultado.stream).arrayBuffer())
  res.setHeader?.('Content-Type', TIPO_DO_ARQUIVO[extensao])
  res.setHeader?.('X-Content-Type-Options', 'nosniff')
  res.setHeader?.('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  res.setHeader?.(
    'Content-Disposition',
    `${extensao === 'svg' ? 'attachment' : 'inline'}; filename="${partes[3]}.${extensao}"`,
  )
  res.status(200)
  return typeof res.send === 'function' ? res.send(bytes) : res.end(bytes)
}

/* Todos os arquivos do design, do mais novo para o mais antigo, com o nome
   de quem mandou. Só a lista: os bytes vêm um a um por `lerArquivo`. */
async function listarArquivos(req, res) {
  const blobs = await listarPrefixo(PREFIXO_ARQUIVOS)
  const pessoas = new Map()
  await Promise.all(
    blobs
      .filter((blob) => CAMINHO_QUEM.test(blob.pathname))
      .map(async (blob) => {
        try {
          const resultado = await get(blob.pathname, { access: 'private', useCache: false })
          if (resultado?.statusCode !== 200) return
          const quem = JSON.parse(await new Response(resultado.stream).text())
          pessoas.set(CAMINHO_QUEM.exec(blob.pathname)[1], texto(quem?.nome, LIMITE_NOME))
        } catch {
          // Sem o nome, o arquivo aparece como "sem nome"; não some.
        }
      }),
  )

  const arquivos = blobs
    .map((blob) => {
      const partes = CAMINHO_ARQUIVO.exec(blob.pathname)
      if (!partes) return null
      const enviadoEm = blob.uploadedAt instanceof Date ? blob.uploadedAt.toISOString() : String(blob.uploadedAt ?? '')
      return {
        caminho: blob.pathname,
        pessoa: partes[1],
        nome: pessoas.get(partes[1]) ?? '',
        espaco: partes[2],
        arquivo: `${partes[3]}.${partes[4]}`,
        tipo: TIPO_DO_ARQUIVO[partes[4]],
        tamanho: blob.size,
        enviadoEm,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm))

  return res.status(200).json({ success: true, data: arquivos, errors: [] })
}

async function apagarArquivo(req, res) {
  const caminho = String(req.query?.arquivo ?? '')
  if (!CAMINHO_ARQUIVO.test(caminho)) return recusa(res, 400, 'Arquivo inválido.')
  await del(caminho)
  return res.status(200).json({ success: true, data: { apagado: true }, errors: [] })
}

async function listarPrefixo(prefix) {
  const blobs = []
  let cursor
  do {
    const pagina = await list({ prefix, cursor, limit: 1000 })
    blobs.push(...pagina.blobs)
    cursor = pagina.hasMore ? pagina.cursor : undefined
  } while (cursor)
  return blobs
}

/* Devolve os bytes de um anexo, só com a senha. O caminho precisa ter a forma
   exata que `gravarAnexo` monta: com a senha certa ainda não se lê nada fora
   de `copy-anexos/`. */
async function lerAnexo(req, res) {
  const caminho = String(req.query?.anexo ?? '')
  const partes = CAMINHO_ANEXO.exec(caminho)
  if (!partes) return recusa(res, 400, 'Anexo inválido.')

  let resultado = null
  try {
    resultado = await get(caminho, { access: 'private', useCache: false })
  } catch {
    resultado = null
  }
  if (resultado?.statusCode !== 200) return recusa(res, 404, 'Anexo não encontrado.')

  const bytes = Buffer.from(await new Response(resultado.stream).arrayBuffer())
  res.setHeader?.('Content-Type', TIPO_DA_EXTENSAO[partes[3]])
  res.setHeader?.('X-Content-Type-Options', 'nosniff')
  res.status(200)
  return typeof res.send === 'function' ? res.send(bytes) : res.end(bytes)
}

async function listar(req, res) {
  if (!senhaConfere(req.headers?.authorization)) return recusa(res, 401, 'Senha não confere.')
  if (!temArmazenamento()) return recusa(res, 503, 'Armazenamento não configurado neste ambiente.')

  if (req.query?.anexo) return lerAnexo(req, res)
  if (req.query?.arquivo) return lerArquivo(req, res)
  if (req.query?.arquivos) return listarArquivos(req, res)

  // Os dois prefixos numa lista só: cada retorno diz de que página veio pelo
  // `publico`, e é por ele que /doc/retornos separa a homologação da copy.
  const blobs = [
    ...(await listarPrefixo(PREFIXO)),
    ...(await listarPrefixo(PREFIXO_COPY)),
  ]

  // `useCache: false` porque o arquivo é sobrescrito: pelo cache, a lista
  // mostraria a versão de minutos atrás de quem ainda está respondendo.
  const retornos = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const resultado = await get(blob.pathname, { access: 'private', useCache: false })
        if (resultado?.statusCode !== 200) return null
        return JSON.parse(await new Response(resultado.stream).text())
      } catch {
        return null
      }
    }),
  )

  const ordenados = retornos
    .filter(Boolean)
    .sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)))

  return res.status(200).json({ success: true, data: ordenados, errors: [] })
}

async function apagar(req, res) {
  if (!senhaConfere(req.headers?.authorization)) return recusa(res, 401, 'Senha não confere.')
  if (!temArmazenamento()) return recusa(res, 503, 'Armazenamento não configurado neste ambiente.')

  // Arquivo do design: o caminho chega pronto, mas só passa na forma exata de
  // `marketing-arquivos/<pessoa>/<espaço>/<nome>.<ext>`.
  if (req.query?.arquivo) return apagarArquivo(req, res)

  // O caminho é remontado aqui, nunca recebido pronto: com a senha certa ainda
  // não se apaga nada fora de `retornos/`, `copy/` e `copy-anexos/`.
  const publico = String(req.query?.publico ?? '')
  const id = String(req.query?.id ?? '')
  if (!(PUBLICOS.has(publico) || publico === 'copy') || !ID.test(id)) {
    return recusa(res, 400, 'Retorno inválido.')
  }

  if (publico === 'copy') {
    // Os anexos vão junto: imagem sem o retorno que a cita não tem quem leia.
    const anexos = await listarPrefixo(`${PREFIXO_ANEXOS}${id}/`)
    await del([caminhoDe({ publico, id }), ...anexos.map((blob) => blob.pathname)])
  } else {
    await del(caminhoDe({ publico, id }))
  }
  return res.status(200).json({ success: true, data: { apagado: true }, errors: [] })
}

export default async function handler(req, res) {
  // Nada daqui pode ficar em cache: é retorno de gente, e muda a cada minuto.
  res.setHeader?.('Cache-Control', 'no-store')

  try {
    if (req.method === 'POST') {
      if (req.query?.arquivo) return await gravarArquivo(req, res)
      return req.query?.anexo ? await gravarAnexo(req, res) : await gravar(req, res)
    }
    if (req.method === 'GET') return await listar(req, res)
    if (req.method === 'DELETE') return await apagar(req, res)
    return recusa(res, 405, 'Método não suportado.')
  } catch (erro) {
    return recusa(res, 500, erro.message)
  }
}
