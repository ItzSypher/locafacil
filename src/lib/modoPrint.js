/* `?print=1` — a tela limpa, para a captura.
 *
 * Cala o preloader, os popups de captação e o andaime de desenvolvimento
 * (o botão de dados falsos e o seletor de cenário). Sem isso a captura sai com
 * a tarja laranja de "dados falsos" no rodapé e o combo de cenário no meio do
 * formulário — e é essa imagem que vai para o cliente e para quem monta banner.
 *
 * Só existe em desenvolvimento: `import.meta.env.DEV` some no build, e com ele
 * a bandeira inteira. Em produção não há andaime para esconder.
 *
 * Não confundir com `?impressao=1`, de `src/pages/Doc/modoImpressao.js`: aquele
 * prepara as páginas de documentação para virar papel.
 */
export function modoPrint() {
  if (!import.meta.env.DEV) return false
  try {
    return new URLSearchParams(window.location.search).get('print') === '1'
  } catch {
    return false
  }
}
