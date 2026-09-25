import { createHash, timingSafeEqual } from 'node:crypto'
import { put, list, get, del } from '@vercel/blob'

// Retornos da homologação, das páginas /doc/cliente e /doc/marketing.
//
// POST grava. O roteiro salva sozinho a cada alteração, então quem marca três
// passos e fecha a aba já deixou o retorno aqui — sem depender de lembrar de
// copiar e mandar. Um arquivo por pessoa e por página, sobrescrito a cada
// salvamento: o que fica é sempre a versão mais nova de cada um.
//
// GET lista e DELETE apaga um retorno, os dois só com a senha de
// DOC_RETORNOS_SENHA. É quem alimenta /doc/retornos.
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

/** Aceita só o formato que a página manda. Qualquer outra coisa é descartada. */
function validar(corpo) {
  if (!corpo || typeof corpo !== 'object') return { erro: 'Corpo vazio.' }
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

async function gravar(req, res) {
  const { erro, retorno } = validar(req.body)
  if (erro) return res.status(400).json({ success: false, data: null, errors: [erro] })

  if (!temArmazenamento()) {
    return res.status(200).json({ success: true, data: { salvo: false }, errors: [] })
  }

  await put(`${PREFIXO}${retorno.publico}/${retorno.id}.json`, JSON.stringify(retorno), {
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

async function listar(req, res) {
  if (!senhaConfere(req.headers?.authorization)) {
    return res.status(401).json({ success: false, data: null, errors: ['Senha não confere.'] })
  }
  if (!temArmazenamento()) {
    return res.status(503).json({ success: false, data: null, errors: ['Armazenamento não configurado neste ambiente.'] })
  }

  const blobs = []
  let cursor
  do {
    const pagina = await list({ prefix: PREFIXO, cursor, limit: 1000 })
    blobs.push(...pagina.blobs)
    cursor = pagina.hasMore ? pagina.cursor : undefined
  } while (cursor)

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
  if (!senhaConfere(req.headers?.authorization)) {
    return res.status(401).json({ success: false, data: null, errors: ['Senha não confere.'] })
  }
  if (!temArmazenamento()) {
    return res.status(503).json({ success: false, data: null, errors: ['Armazenamento não configurado neste ambiente.'] })
  }

  // O caminho é remontado aqui, nunca recebido pronto: com a senha certa ainda
  // não se apaga nada fora de `retornos/`.
  const publico = String(req.query?.publico ?? '')
  const id = String(req.query?.id ?? '')
  if (!PUBLICOS.has(publico) || !ID.test(id)) {
    return res.status(400).json({ success: false, data: null, errors: ['Retorno inválido.'] })
  }

  await del(`${PREFIXO}${publico}/${id}.json`)
  return res.status(200).json({ success: true, data: { apagado: true }, errors: [] })
}

export default async function handler(req, res) {
  // Nada daqui pode ficar em cache: é retorno de gente, e muda a cada minuto.
  res.setHeader?.('Cache-Control', 'no-store')

  try {
    if (req.method === 'POST') return await gravar(req, res)
    if (req.method === 'GET') return await listar(req, res)
    if (req.method === 'DELETE') return await apagar(req, res)
    return res.status(405).json({ success: false, data: null, errors: ['Método não suportado.'] })
  } catch (erro) {
    return res.status(500).json({ success: false, data: null, errors: [erro.message] })
  }
}
