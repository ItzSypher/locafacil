import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'
import { LIMITE_NOTA, ICONES, classeCampo, nomeCurto, situacaoDaDobra } from './copyRevisao'
import {
  TextoRevisao, CapturaGrande, CampoAnexo, AvisoSalvamento, SeloSituacao, Icone,
} from './CopyPecas'

/**
 * Painel de uma dobra: a captura de um lado, os textos dela do outro.
 *
 * É aqui que a revisão acontece. A grade só mostra onde cada parte está e o
 * que já mudou; o painel mostra uma parte por vez, com a tela de hoje à vista
 * enquanto a pessoa decide texto por texto.
 *
 * No computador é um painel grande sobre a página, com as duas colunas
 * rolando cada uma por si — a captura fica parada enquanto a lista anda. No
 * celular ocupa a tela inteira, captura em cima e textos embaixo. Nos dois é
 * diálogo de verdade (`useDialog`): foco preso, Esc fecha, o foco volta ao
 * cartão de onde veio.
 *
 * Vai por portal no `body` e não mora dentro de nenhum `motion.*`: camada
 * fixa dentro de um elemento com transform mede a caixa dele, não a janela.
 * As caixas que só recortam usam `overflow-clip`, não `hidden`: caixa
 * `hidden` ainda rola por código, e o foco de um campo lá embaixo empurrava o
 * cabeçalho para fora do painel.
 */
export default function CopyPainel({
  item, anterior, proxima, respostas, bloco, miniatura, pessoa, aoMudarNome,
  estadoSalvamento, aoTentarDeNovo, capturas,
  aoDecidir, aoEscrever, aoAnotar, aoAnexar, aoRemover, aoConcluir, aoIr, aoFechar,
}) {
  const painelRef = useDialog(Boolean(item), aoFechar)
  const rolagemRef = useRef([])
  const { dobra, deck, posicao, total } = item
  const textos = Array.isArray(dobra.textos) ? dobra.textos : []
  const situacao = situacaoDaDobra(dobra, respostas, bloco)
  const nota = bloco?.nota ?? ''
  const liberado = Boolean(pessoa.nome.trim())

  // Parte nova começa do topo, nas duas colunas.
  useEffect(() => {
    rolagemRef.current.forEach((elemento) => elemento?.scrollTo?.(0, 0))
  }, [dobra.id])

  const guardarRolagem = (indice) => (elemento) => {
    rolagemRef.current[indice] = elemento
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex lg:p-6 lg:bg-brand-dark/70 lg:backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="painel-titulo"
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        className="on-light relative flex flex-col w-full h-full bg-white overflow-clip focus:outline-none lg:max-w-7xl lg:mx-auto lg:rounded-2xl lg:shadow-glass"
      >
        <header className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 py-3 border-b border-line">
          <div className="min-w-0 py-1">
            <p className="type-meta text-text-muted">
              {nomeCurto(deck)} · Parte <span className="type-numeric">{posicao}</span> de{' '}
              <span className="type-numeric">{total}</span>
            </p>
            <h2 id="painel-titulo" className="type-subtitle text-text-dark">{dobra.titulo}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <AvisoSalvamento estado={estadoSalvamento} aoTentarDeNovo={aoTentarDeNovo} className="hidden md:flex" />
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar e voltar às partes"
              className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-text-muted hover:text-text-dark hover:bg-surface-muted transition-colors cursor-pointer"
            >
              <Icone caminho={ICONES.x} className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div
          ref={guardarRolagem(0)}
          className="flex-1 min-h-0 overflow-y-auto lg:overflow-clip lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div
            ref={guardarRolagem(1)}
            className="bg-surface-light p-5 sm:p-6 border-b border-line lg:border-b-0 lg:border-r lg:overflow-y-auto"
          >
            <CapturaGrande key={dobra.id} dobra={dobra} capturas={capturas} />
          </div>

          <div ref={guardarRolagem(2)} className="lg:overflow-y-auto">
            <div className="px-5 sm:px-6 pb-8">
              {!liberado && (
                <div className="mt-5 rounded-xl border border-brand-gold/40 bg-brand-gold/10 p-4">
                  <label htmlFor="painel-nome" className="type-label text-text-dark block mb-2">
                    Seu nome
                  </label>
                  <input
                    id="painel-nome"
                    type="text"
                    value={pessoa.nome}
                    onChange={(evento) => aoMudarNome(evento.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    maxLength={80}
                    className={classeCampo('bg-white')}
                  />
                  <p className="type-meta text-text-dark mt-2">
                    Sem ele as alterações ficam só neste navegador e não chegam à equipe.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-5">
                <p className="type-meta text-text-muted">
                  <span className="type-numeric">{textos.length}</span> {textos.length === 1 ? 'texto' : 'textos'} nesta
                  parte. O que você não mexer fica como está.
                </p>
                <SeloSituacao situacao={situacao} />
              </div>

              <ul className="mt-1 divide-y divide-line-soft">
                {textos.map((texto) => (
                  <TextoRevisao
                    key={texto.id}
                    texto={texto}
                    resposta={respostas[texto.id]}
                    aoDecidir={aoDecidir}
                    aoEscrever={aoEscrever}
                  />
                ))}
              </ul>

              <div className="mt-2 rounded-2xl border border-line bg-surface-light p-5">
                <label htmlFor={`nota-${dobra.id}`} className="type-label text-text-dark block mb-2">
                  Observações desta parte
                </label>
                <textarea
                  id={`nota-${dobra.id}`}
                  value={nota}
                  onChange={(evento) => aoAnotar(dobra.id, evento.target.value)}
                  rows={nota ? 3 : 2}
                  maxLength={LIMITE_NOTA}
                  placeholder="Algo que vale para a parte inteira: o tom, a ordem, o que está faltando."
                  className={classeCampo('bg-white')}
                />
                <div className="mt-4">
                  <CampoAnexo
                    alvo={dobra.id}
                    idPessoa={pessoa.id}
                    liberado={liberado}
                    anexo={bloco?.anexo}
                    miniatura={miniatura}
                    aoAnexar={aoAnexar}
                    aoRemover={aoRemover}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-line bg-white px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => anterior && aoIr(anterior.dobra.id)}
            disabled={!anterior}
            className="min-h-11 inline-flex items-center gap-1.5 px-3 rounded-xl type-label whitespace-nowrap text-text-muted hover:text-text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Icone caminho={ICONES.voltar} />
            <span className="hidden sm:inline">Parte</span> anterior
          </button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => aoConcluir(dobra.id, !situacao.revisada)}
            aria-pressed={situacao.revisada}
            className={`min-h-11 inline-flex items-center gap-2 px-4 sm:px-6 rounded-xl type-label whitespace-nowrap transition-colors cursor-pointer ${
              situacao.revisada
                ? 'bg-state-success-soft text-text-dark border border-brand-success/40'
                : 'bg-brand-accent hover:bg-brand-glow text-white'
            }`}
          >
            <Icone caminho={ICONES.check} />
            {/* No celular os três botões dividem 390px: o rótulo encurta, o
                leitor de tela ouve a frase inteira. */}
            {situacao.revisada ? (
              <>
                <span className="hidden sm:inline">Parte</span> concluída
              </>
            ) : (
              <>
                Concluir<span className="hidden sm:inline"> esta parte</span>
                <span className="sr-only sm:hidden"> esta parte</span>
              </>
            )}
          </motion.button>

          <button
            type="button"
            onClick={() => proxima && aoIr(proxima.dobra.id)}
            disabled={!proxima}
            className="min-h-11 inline-flex items-center gap-1.5 px-3 rounded-xl type-label whitespace-nowrap text-text-muted hover:text-text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Próxima <span className="hidden sm:inline">parte</span>
            <Icone caminho={ICONES.seta} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
