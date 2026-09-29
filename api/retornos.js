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
      return req.query?.anexo ? await gravarAnexo(req, res) : await gravar(req, res)
    }
    if (req.method === 'GET') return await listar(req, res)
    if (req.method === 'DELETE') return await apagar(req, res)
    return recusa(res, 405, 'Método não suportado.')
  } catch (erro) {
    return recusa(res, 500, erro.message)
  }
}
