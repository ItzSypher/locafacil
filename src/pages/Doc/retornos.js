/* Conversa com `/api/retornos`, que guarda os retornos da homologação no
   Vercel Blob. Separado dos componentes para que a página que salva e a que
   lista falem com o servidor do mesmo jeito. */

/** Grava a versão atual do retorno de uma pessoa. Devolve `{ salvo, atualizadoEm }`. */
export async function salvarRetorno(retorno) {
  const resposta = await fetch('/api/retornos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(retorno),
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

/* Identificador deste navegador. Um arquivo por pessoa e por página: quem
   volta no dia seguinte continua o mesmo retorno em vez de abrir outro. */
export function novoIdentificador() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
