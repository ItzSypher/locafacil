/* `?impressao=1` — a mesma página, montada para virar papel.
 *
 * O PDF é impresso a partir destas rotas, e não de um HTML paralelo: duas
 * fontes para o mesmo conteúdo envelhecem em ritmos diferentes, e é sempre a
 * que ninguém abriu que vai para o cliente.
 *
 * O que a bandeira muda é só o que o papel não sabe fazer: cartão recolhido
 * abre, filtro some, galeria mostra os dois formatos de uma vez. O resto do
 * enfeite de tela sai pelas variantes `print:` do Tailwind.
 *
 * Não é `import.meta.env.DEV`: o PDF também pode ser gerado contra o site
 * publicado, e ali a bandeira de desenvolvimento não existe.
 */
export function ehImpressao() {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('impressao') === '1'
  } catch {
    return false
  }
}
