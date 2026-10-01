/* Conversa com `/api/retornos`, que guarda no Vercel Blob os retornos da
   homologação e da revisão de copy. Separado dos componentes para que as
   páginas que salvam e a que lista falem com o servidor do mesmo jeito. */

/**
 * Grava a versão atual do retorno de uma pessoa. Devolve `{ salvo, atualizadoEm }`.
 *
 * `keepalive` é para o salvamento de quando a aba some: sem ele o navegador
 * cancela o pedido junto com a página, e a última frase digitada fica só no
 * navegador. O navegador recusa corpo acima de 64 kB nesse modo — quem chama
 * trata a falha como qualquer outra.
 */
export async function salvarRetorno(retorno, { keepalive = false } = {}) {
  const resposta = await fetch('/api/retornos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(retorno),
    keepalive,
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível salvar.')
  }
  return corpo.data
}

/**
 * Lista todos os retornos. Exige a senha de `DOC_RETORNOS_SENHA`.
 * O erro carrega o status, para a tela separar senha errada de servidor fora.
 */
export async function listarRetornos(senha) {
  const resposta = await fetch('/api/retornos', {
    headers: { Authorization: `Bearer ${senha}` },
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    const erro = new Error(corpo?.errors?.[0] ?? 'Não foi possível carregar os retornos.')
    erro.status = resposta.status
    throw erro
  }
  return corpo.data
}

/** Apaga um retorno. Exige a mesma senha da listagem. */
export async function apagarRetorno(senha, { publico, id }) {
  const consulta = new URLSearchParams({ publico, id })
  const resposta = await fetch(`/api/retornos?${consulta}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${senha}` },
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível apagar.')
  }
}

/**
 * Envia a imagem anexada a uma parte da revisão de copy. `dataUrl` já vem
 * reduzida (ver `imagem.js`). Devolve `{ salvo, anexo }` — `anexo` é o
 * caminho que o retorno guarda para a equipe achar a imagem.
 */
export async function enviarAnexo({ id, alvo, dataUrl }) {
  const resposta = await fetch('/api/retornos?anexo=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publico: 'copy', id, alvo, dataUrl }),
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível enviar a imagem.')
  }
  return corpo.data
}

/** Baixa um anexo com a senha da listagem. Devolve um `Blob` para virar object URL. */
export async function lerAnexo(senha, caminho) {
  const resposta = await fetch(`/api/retornos?${new URLSearchParams({ anexo: caminho })}`, {
    headers: { Authorization: `Bearer ${senha}` },
  })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível abrir a imagem.')
  }
  return resposta.blob()
}

/* Identificador deste navegador. Um arquivo por pessoa e por página: quem
   volta no dia seguinte continua o mesmo retorno em vez de abrir outro. */
export function novoIdentificador() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/* ------------------------------------------------- arquivos do design -- */

/* Lê o arquivo inteiro como veio, sem passar por canvas: o que a agência
   entrega é o arquivo final, e redesenhar recomprimiria a foto e apagaria a
   transparência. O tipo vem da extensão quando o navegador não sabe dizer
   (acontece com SVG e WEBP em alguns sistemas); o servidor confere pelos
   primeiros bytes de qualquer jeito. */
function lerComoDataUrl(arquivo, tipo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      const bruto = String(leitor.result)
      resolve(`data:${tipo};base64,${bruto.slice(bruto.indexOf(',') + 1)}`)
    }
    leitor.onerror = () => reject(new Error('Não consegui ler esse arquivo. Tente de novo.'))
    leitor.readAsDataURL(arquivo)
  })
}

/**
 * Envia um arquivo do design para um espaço de imagem. Devolve
 * `{ salvo, caminho, arquivo, tamanho, substituiu }` — `salvo: false` quando o
 * ambiente não tem armazenamento (rodando local).
 */
export async function enviarArquivoDesign({ id, nome, espaco, arquivo, tipo }) {
  const dataUrl = await lerComoDataUrl(arquivo, tipo)
  const resposta = await fetch('/api/retornos?arquivo=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publico: 'marketing', id, nome, espaco, arquivo: arquivo.name, dataUrl }),
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    throw new Error(
      corpo?.errors?.[0] ??
        (resposta.status === 413 ? 'Arquivo grande demais: o limite é 3 MB.' : 'Não foi possível enviar o arquivo.'),
    )
  }
  return corpo.data
}

/** Lista os arquivos do design. Exige a senha de `DOC_RETORNOS_SENHA`. */
export async function listarArquivosDesign(senha) {
  const resposta = await fetch('/api/retornos?arquivos=1', {
    headers: { Authorization: `Bearer ${senha}` },
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível carregar os arquivos do design.')
  }
  return corpo.data
}

/** Bytes de um arquivo do design, com a senha. Devolve um `Blob`. */
export async function lerArquivoDesign(senha, caminho) {
  const resposta = await fetch(`/api/retornos?${new URLSearchParams({ arquivo: caminho })}`, {
    headers: { Authorization: `Bearer ${senha}` },
  })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível abrir o arquivo.')
  }
  return resposta.blob()
}

/** Apaga um arquivo do design. Exige a senha. */
export async function apagarArquivoDesign(senha, caminho) {
  const resposta = await fetch(`/api/retornos?${new URLSearchParams({ arquivo: caminho })}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${senha}` },
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.success) {
    throw new Error(corpo?.errors?.[0] ?? 'Não foi possível apagar.')
  }
}

/** Faz o navegador baixar um `Blob` com o nome dado. */
export function baixarBlob(blob, nome) {
  const endereco = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(endereco), 1000)
}
