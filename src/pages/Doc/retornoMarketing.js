/* O retorno do marketing é um arquivo só por pessoa (`retornos/marketing/<id>.json`),
 * mas dois lugares da página escrevem nele: o roteiro de homologação
 * (`Checklist`) e as quebras de linha (`QuebrasTexto`). Cada salvamento
 * sobrescreve o arquivo inteiro, então quem salva manda também a parte do
 * outro, lida da cópia local. Assim nenhum dos dois apaga o que o outro
 * gravou, salve quem salvar por último.
 */

export const CHAVE_QUEBRAS = 'locafacil_doc_marketing_quebras'
export const CHAVE_ROTEIRO_MARKETING = 'locafacil_doc_marketing_roteiro'
export const CHAVE_ENVIADO_MARKETING = 'locafacil_doc_marketing_enviado'

export function lerLocal(chave, inicial) {
  try {
    const salvo = localStorage.getItem(chave)
    return salvo ? JSON.parse(salvo) : inicial
  } catch {
    return inicial
  }
}
