import { useState } from 'react'
import { PENDENCIAS } from '../../content/documentacao'
import { Cartao } from './Pecas'
import { ehImpressao } from './modoImpressao'

const FILTROS = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'trava', rotulo: 'Segura a publicação' },
  { id: 'depois', rotulo: 'Pode ir depois' },
]

/**
 * Lista do que falta, filtrável.
 *
 * O filtro existe porque as duas perguntas são diferentes: "o que me impede de
 * publicar?" e "o que ainda tenho para fazer?". Sem ele, quem só quer a
 * primeira resposta lê nove itens para achar quatro.
 *
 * Os cartões abrem um a um. O título e o responsável ficam sempre visíveis —
 * é o que a pessoa procura ao varrer a lista atrás do próprio nome.
 */
export default function Pendencias({ publico }) {
  const impressao = ehImpressao()
  const [filtro, setFiltro] = useState('todos')

  const doPublico = PENDENCIAS.filter((item) => item.publicos.includes(publico))
  const lista = impressao ? doPublico : doPublico.filter((item) => {
    if (filtro === 'trava') return item.trava
    if (filtro === 'depois') return !item.trava
    return true
  })

  const travando = doPublico.filter((item) => item.trava).length

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        {FILTROS.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            onClick={() => setFiltro(opcao.id)}
            aria-pressed={filtro === opcao.id}
            className={`min-h-11 px-4 rounded-xl type-label border transition-colors cursor-pointer ${
              filtro === opcao.id
                ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                : 'border-line text-text-muted hover:text-text-dark'
            }`}
          >
            {opcao.rotulo}
            {opcao.id === 'trava' && (
              <span className="type-numeric ml-2">{travando}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {lista.map((item) => (
          <Cartao
            key={item.id}
            titulo={item.titulo}
            responsavel={item.responsavel}
            linhas={item.linhas}
            recolhivel
            destaque={item.trava}
          />
        ))}
      </div>
    </div>
  )
}
