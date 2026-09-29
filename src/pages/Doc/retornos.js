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
