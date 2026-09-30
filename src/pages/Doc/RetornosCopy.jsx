import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'
import { BotaoCopiar } from './Pecas'
import { lerAnexo } from './retornos'
import {
  INVENTARIO, DECKS, TODAS_AS_DOBRAS, ROTULO_TIPO, ICONES,
  dobrasDoDeck, situacaoDaDobra, mudancasDe, comoLista, nomeCurto, useCapturas, diferencaDePalavras,
} from './copyRevisao'
import { Previa, SeloSituacao, Icone } from './CopyPecas'

/* Revisão de copy dentro de `/doc/retornos`.
 *
 * Quem abre esta tela é a equipe, para entender de relance o que o cliente
 * pediu e baixar o arquivo que vai virar mudança no código. Por isso a ordem:
 * primeiro um cartão por pessoa, com o tamanho do pedido e o botão do
 * arquivo; depois o pedido dela, página por página e parte por parte, com a
 * tela de hoje ao lado e a diferença de palavras marcada — ninguém precisa
 * comparar duas frases de olho para achar a palavra que mudou.
 */

const POSICAO = new Map(TODAS_AS_DOBRAS.map((item) => [item.dobra.id, item.posicao]))

const semAcento = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/* O arquivo leva o retorno como veio do servidor e o inventário da hora do
   download, junto: é com os dois que as mudanças são aplicadas no código,
   e o inventário pode mudar depois. Formato estável — quem aplica lê
   `retorno` e `inventario`. */
function baixarJson(retorno) {
  const conteudo = JSON.stringify(
    { baixadoEm: new Date().toISOString(), retorno, inventario: INVENTARIO },
    null,
    2,
  )
  const endereco = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = endereco
  link.download = `revisao-copy-${semAcento(retorno.nome) || 'sem-nome'}-${String(retorno.atualizadoEm ?? '').slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(endereco), 1000)
}

/** Números do pedido de uma pessoa: o que o cartão do topo mostra. */
function contagemDe(retorno) {
  const textos = Object.values(retorno?.textos ?? {})
  const blocos = [...Object.values(retorno?.dobras ?? {}), retorno?.livre ?? {}]
  return {
    trocas: textos.filter((resposta) => resposta?.decisao === 'trocar').length,
    tiradas: textos.filter((resposta) => resposta?.decisao === 'tirar').length,
    observacoes: blocos.filter((bloco) => String(bloco?.nota ?? '').trim()).length,
    anexos: blocos.filter((bloco) => bloco?.anexo).length,
    concluidas: TODAS_AS_DOBRAS.filter(({ dobra }) => retorno?.dobras?.[dobra.id]?.revisada === true).length,
  }
}

/* ------------------------------------------------------------ anexos -- */

/* Imagem anexada ampliada. Diálogo de verdade (`useDialog`): Esc fecha, o
   foco fica preso no botão de fechar e volta à miniatura. */
function Ampliacao({ endereco, aoFechar }) {
  const painelRef = useDialog(Boolean(endereco), aoFechar)
  if (!endereco) return null
  return createPortal(
    <div className="fixed inset-0 z-[9996] bg-brand-dark/90 backdrop-blur-md p-4 sm:p-8 overflow-auto" onClick={aoFechar}>
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Imagem anexada, ampliada"
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        className="mx-auto w-fit max-w-full focus:outline-none"
      >
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-11 px-4 rounded-xl border border-white/20 text-text-primary hover:bg-white/10 transition-colors cursor-pointer type-label"
          >
            Fechar
          </button>
        </div>
        <img src={endereco} alt="Imagem anexada pelo cliente" className="rounded-xl shadow-glass max-w-full h-auto" />
      </div>
    </div>,
    document.body,
  )
}

/* O anexo é privado: só sai do servidor com a senha, então não dá para pôr o
   caminho num <img>. Baixa com a senha e mostra por um object URL, liberado
   quando a miniatura sai da tela. */
function MiniaturaAnexo({ senha, caminho }) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [ampliada, setAmpliada] = useState(false)

  useEffect(() => {
    let ativo = true
    let endereco = null
    lerAnexo(senha, caminho)
      .then((blob) => {
        endereco = URL.createObjectURL(blob)
        if (ativo) setEstado({ tipo: 'pronto', endereco })
        else URL.revokeObjectURL(endereco)
      })
      .catch((erro) => {
        if (ativo) setEstado({ tipo: 'erro', mensagem: erro.message })
      })
    return () => {
      ativo = false
      if (endereco) URL.revokeObjectURL(endereco)
    }
  }, [senha, caminho])

  if (estado.tipo === 'carregando') {
    return (
      <div className="w-40 h-28 rounded-xl bg-surface-muted" role="status">
        <span className="sr-only">Carregando imagem anexada</span>
      </div>
    )
  }

  if (estado.tipo === 'erro') {
    return (
      <p className="type-meta text-state-error">
        {estado.mensagem} <span className="text-text-muted break-all">({caminho})</span>
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAmpliada(true)}
        aria-label="Ampliar a imagem anexada"
        className="block w-40 rounded-xl overflow-hidden border border-line hover:border-brand-accent transition-colors cursor-zoom-in"
      >
        <img src={estado.endereco} alt="" className="block w-full h-auto" />
      </button>
      <Ampliacao endereco={ampliada ? estado.endereco : null} aoFechar={() => setAmpliada(false)} />
    </>
  )
}

/* ---------------------------------------------------------- mudanças -- */

function Trechos({ pedacos, lado }) {
  return pedacos.map((pedaco, indice) => {
    if (pedaco.tipo === 'saiu') {
      return (
        <del key={indice} className="bg-state-error-soft text-text-dark line-through decoration-state-error rounded px-0.5">
          {pedaco.texto}
        </del>
      )
    }
    if (pedaco.tipo === 'entrou') {
      return (
        <ins key={indice} className="bg-state-success-soft text-text-dark no-underline rounded px-0.5 font-semibold">
          {pedaco.texto}
        </ins>
      )
    }
    return (
      <span key={indice} className={lado === 'antes' ? 'text-text-muted' : 'text-text-dark'}>
        {pedaco.texto}
      </span>
    )
  })
}

/* Uma mudança num texto: Antes | Depois lado a lado (empilhados no celular),
   com a diferença de palavras marcada. "Tirar" é o texto inteiro riscado. */
function Mudanca({ texto, resposta }) {
  const tirar = resposta.decisao === 'tirar'
  const novo = String(resposta.novo ?? '')
  const diferenca = useMemo(() => (tirar ? null : diferencaDePalavras(texto.texto, novo)), [tirar, texto.texto, novo])
  const igual = !tirar && novo.trim() === String(texto.texto).trim()

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="type-label text-text-dark">
          {ROTULO_TIPO[texto.tipo] ?? texto.tipo}
          <span className={tirar ? 'text-state-error' : 'text-text-muted'}> · {tirar ? 'Sai do site' : 'Trocar'}</span>
        </p>
        {/* Para a equipe técnica: onde o texto mora no código. */}
        <p className="type-meta text-text-muted break-all">
          {texto.arquivo}
          {texto.linha != null && <span className="type-numeric">:{texto.linha}</span>}
        </p>
      </div>

      {tirar ? (
        <p className="type-body mt-3 whitespace-pre-line break-words bg-state-error-soft rounded-lg px-3 py-2 text-text-dark line-through decoration-state-error">
          {texto.texto}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-light px-3 py-2">
            <p className="type-label text-text-muted mb-1">Antes</p>
            <p className="type-body whitespace-pre-line break-words">
              <Trechos pedacos={diferenca.antes} lado="antes" />
            </p>
          </div>
          <div className="rounded-lg border border-line px-3 py-2">
            <p className="type-label text-text-dark mb-1">Depois</p>
            <p className="type-body whitespace-pre-line break-words">
              {novo.trim() ? <Trechos pedacos={diferenca.depois} lado="depois" /> : <span className="text-text-muted">(campo vazio)</span>}
            </p>
          </div>
          {igual && (
            <p className="type-meta text-text-muted sm:col-span-2">Marcou trocar, mas o texto ficou igual ao de hoje.</p>
          )}
        </div>
      )}
    </li>
  )
}

/* Uma parte do site no pedido: miniatura da tela de hoje, título, situação e
   o que mudou nela, já passado pelo filtro. */
function ParteDoPedido({ dobra, retorno, senha, capturas, filtro }) {
  const bloco = retorno.dobras?.[dobra.id] ?? {}
  const situacao = situacaoDaDobra(dobra, retorno.textos ?? {}, bloco)
  const mudancas = situacao.alterados.filter(({ resposta }) =>
    filtro === 'tudo' ? true : filtro === 'trocas' ? resposta.decisao === 'trocar' : filtro === 'tiradas' ? resposta.decisao === 'tirar' : false,
  )
  const mostraExtras = filtro === 'tudo' || filtro === 'observacoes'
  const nota = mostraExtras ? String(bloco.nota ?? '').trim() : ''
  const anexo = mostraExtras ? bloco.anexo : null

  return (
    <li className="rounded-2xl border border-line bg-surface-light p-4 sm:p-5">
      <div className="flex gap-4">
        <div className="w-28 sm:w-40 shrink-0 self-start rounded-lg overflow-hidden border border-line">
          <Previa dobra={dobra} capturas={capturas} />
        </div>
        <div className="min-w-0">
          <h5 className="type-subtitle text-text-dark">
            <span className="text-text-muted">
              Parte <span className="type-numeric">{POSICAO.get(dobra.id)}</span> ·
            </span>{' '}
            {dobra.titulo}
          </h5>
          <div className="mt-2">
            <SeloSituacao situacao={situacao} />
          </div>
        </div>
      </div>

      {mudancas.length > 0 && (
        <ul className="mt-4 space-y-3">
          {mudancas.map(({ texto, resposta }) => (
            <Mudanca key={texto.id} texto={texto} resposta={resposta} />
          ))}
        </ul>
      )}

      {(nota || anexo) && (
        <div className="mt-4 rounded-xl border border-line bg-white p-4">
          <p className="type-label text-text-muted">Observações desta parte</p>
          {nota && <p className="type-body text-text-dark mt-2 whitespace-pre-wrap break-words">{nota}</p>}
          {anexo && (
            <div className="mt-3">
              <MiniaturaAnexo senha={senha} caminho={anexo} />
            </div>
          )}
        </div>
      )}
    </li>
  )
}

const FILTROS = [
  ['tudo', 'Tudo'],
  ['trocas', 'Trocas'],
  ['tiradas', 'Tiradas'],
  ['observacoes', 'Observações'],
]

/* Se uma parte tem algo a mostrar com o filtro atual. */
function temNoFiltro(dobra, retorno, filtro) {
  const bloco = retorno.dobras?.[dobra.id] ?? {}
  const { alterados } = situacaoDaDobra(dobra, retorno.textos ?? {}, bloco)
  const extras = Boolean(String(bloco.nota ?? '').trim() || bloco.anexo)
  if (filtro === 'trocas') return alterados.some(({ resposta }) => resposta.decisao === 'trocar')
  if (filtro === 'tiradas') return alterados.some(({ resposta }) => resposta.decisao === 'tirar')
  if (filtro === 'observacoes') return extras
  return alterados.length > 0 || extras
}

/** O pedido de uma pessoa, página por página. */
function Pedido({ retorno, senha, capturas }) {
  const [filtro, setFiltro] = useState('tudo')
  const [esconder, setEsconder] = useState(true)
  const contagem = contagemDe(retorno)
  const { soltos, dobrasSoltas, livre } = useMemo(() => mudancasDe(retorno), [retorno])
  const total = { tudo: null, trocas: contagem.trocas, tiradas: contagem.tiradas, observacoes: contagem.observacoes + contagem.anexos }

  const paginas = DECKS.map((deck) => ({
    deck,
    partes: dobrasDoDeck(deck).filter((dobra) =>
      temNoFiltro(dobra, retorno, filtro) || (filtro === 'tudo' && !esconder),
    ),
  })).filter((pagina) => pagina.partes.length)

  const temLivre = Boolean(String(livre.nota ?? '').trim() || livre.anexo) && (filtro === 'tudo' || filtro === 'observacoes')

  return (
    <div id={`pedido-${retorno.id}`} className="scroll-mt-8 mt-10">
      <h3 className="type-title text-text-dark">O que {retorno.nome || 'esta pessoa'} pediu</h3>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-surface-muted" role="group" aria-label="Mostrar">
          {FILTROS.map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => setFiltro(chave)}
              aria-pressed={filtro === chave}
              className={`min-h-11 px-3 sm:px-4 rounded-lg type-label transition-colors cursor-pointer ${
                filtro === chave ? 'bg-white text-text-dark shadow-card' : 'text-text-muted hover:text-text-dark'
              }`}
            >
              {rotulo}
              {total[chave] != null && <span className="type-numeric ml-1.5">{total[chave]}</span>}
            </button>
          ))}
        </div>
        <label className="min-h-11 inline-flex items-center gap-2 cursor-pointer type-body text-text-dark">
          <input
            type="checkbox"
            checked={esconder}
            onChange={(evento) => setEsconder(evento.target.checked)}
            className="w-5 h-5 accent-brand-accent cursor-pointer"
          />
          Esconder partes sem mudança
        </label>
      </div>

      {paginas.length === 0 && !temLivre ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface-light p-6 text-center">
          <p className="type-subtitle text-text-dark">Nada para mostrar com este filtro</p>
          <p className="type-body text-text-muted mt-2">
            {contagem.concluidas
              ? `${contagem.concluidas} ${contagem.concluidas === 1 ? 'parte concluída' : 'partes concluídas'} sem mudanças. Desmarque “Esconder partes sem mudança” para ver quais.`
              : 'Esta pessoa ainda não mudou nem concluiu nenhuma parte.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {paginas.map(({ deck, partes }) => (
            <section key={deck.id} aria-labelledby={`pagina-${retorno.id}-${deck.id}`}>
              <h4 id={`pagina-${retorno.id}-${deck.id}`} className="type-label text-text-muted pb-2 border-b border-line">
                <span className="type-numeric">{deck.numero}</span> · {nomeCurto(deck)}
              </h4>
              <ul className="mt-4 space-y-4">
                {partes.map((dobra) => (
                  <ParteDoPedido
                    key={dobra.id}
                    dobra={dobra}
                    retorno={retorno}
                    senha={senha}
                    capturas={capturas}
                    filtro={filtro}
                  />
                ))}
              </ul>
            </section>
          ))}

          {filtro === 'tudo' && (soltos.length > 0 || dobrasSoltas.length > 0) && (
            <section>
              <h4 className="type-label text-text-muted pb-2 border-b border-line">Fora do inventário atual</h4>
              <p className="type-meta text-text-muted mt-2">
                Respostas para textos ou partes que o inventário de hoje não tem mais.
              </p>
              <ul className="mt-3 space-y-2">
                {soltos.map(({ id, resposta }) => (
                  <li key={id} className="type-body text-text-dark break-words">
                    <span className="type-meta text-text-muted">[{id}]</span>{' '}
                    {resposta.decisao === 'tirar' ? 'Sai do site' : `→ ${resposta.novo ?? ''}`}
                  </li>
                ))}
                {dobrasSoltas.map(({ id, nota, anexo }) => (
                  <li key={id} className="type-body text-text-dark break-words">
                    <span className="type-meta text-text-muted">[{id}]</span> {nota}
                    {anexo && <MiniaturaAnexo senha={senha} caminho={anexo} />}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* O espaço livre é onde cabe o pedido que não é de texto nenhum — uma
          seção nova, um tom. Fica por último e em destaque para não passar. */}
      {temLivre && (
        <section className="mt-10 rounded-2xl border-2 border-brand-gold/50 bg-brand-gold/10 p-5 sm:p-6">
          <h4 className="type-subtitle text-text-dark">Espaço livre</h4>
          <p className="type-meta text-text-muted mt-1">Pedidos gerais, fora das partes do site.</p>
          {String(livre.nota ?? '').trim() && (
            <p className="type-body text-text-dark mt-3 whitespace-pre-wrap break-words">{livre.nota}</p>
          )}
          {livre.anexo && (
            <div className="mt-4">
              <MiniaturaAnexo senha={senha} caminho={livre.anexo} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}

/* ----------------------------------------------------------- pessoas -- */

/* Cartão de uma pessoa no topo da seção: quanto ela pediu, até onde foi e o
   arquivo que a equipe baixa para aplicar. */
function CartaoPessoa({ retorno, quando, selecionada, aoSelecionar, acoes }) {
  const contagem = contagemDe(retorno)
  const lista = useMemo(() => comoLista(retorno, { quando }), [retorno, quando])
  const largura = Math.round((contagem.concluidas / TODAS_AS_DOBRAS.length) * 100)

  return (
    <li
      className={`rounded-2xl border bg-white p-5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8 ${
        selecionada ? 'border-brand-accent/40 shadow-card' : 'border-line'
      }`}
    >
      {/* Números à esquerda, ações à direita; no celular, um embaixo do outro. */}
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={`type-subtitle ${retorno.nome ? 'text-text-dark' : 'text-text-muted'}`}>{retorno.nome || 'Sem nome'}</h3>
            <p className="type-meta text-text-muted mt-1">
              Atualizado em <span className="type-numeric">{quando(retorno.atualizadoEm)}</span>
            </p>
          </div>
          {retorno.enviadoEm && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-label bg-state-success-soft text-text-dark"
              title={`Avisou que terminou em ${quando(retorno.enviadoEm)}`}
            >
              <Icone caminho={ICONES.check} className="w-3.5 h-3.5 text-brand-success" />
              Terminou
            </span>
          )}
        </div>

        <div>
          <p className="type-meta text-text-dark mb-2">
            <span className="type-numeric font-semibold">{contagem.concluidas}</span> de{' '}
            <span className="type-numeric">{TODAS_AS_DOBRAS.length}</span> partes concluídas
          </p>
          <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
            <div
              className="h-full bg-brand-success"
              style={{ width: `${largura}%` }}
              role="progressbar"
              aria-valuenow={contagem.concluidas}
              aria-valuemin={0}
              aria-valuemax={TODAS_AS_DOBRAS.length}
              aria-label={`Partes concluídas por ${retorno.nome || 'esta pessoa'}`}
            />
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Trocas', contagem.trocas],
            ['Tiradas', contagem.tiradas],
            ['Observações', contagem.observacoes],
            ['Anexos', contagem.anexos],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-xl bg-surface-light px-3 py-2">
              <dt className="type-label text-text-muted">{rotulo}</dt>
              <dd className="type-title text-text-dark type-numeric">{valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 lg:mt-0 flex flex-col justify-center">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => baixarJson(retorno)}
          className="w-full min-h-11 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-brand-accent hover:bg-brand-glow text-white type-label transition-colors cursor-pointer"
        >
          <Icone caminho={ICONES.baixar} />
          Baixar JSON para aplicar
        </motion.button>
        <p className="type-meta text-text-muted mt-2">
          É este arquivo que a equipe manda para aplicar as mudanças no site.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            type="button"
            onClick={aoSelecionar}
            aria-pressed={selecionada}
            className={`min-h-11 px-4 rounded-xl border type-label transition-colors cursor-pointer ${
              selecionada ? 'border-line text-text-muted' : 'border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10'
            }`}
          >
            {selecionada ? 'Mostrando abaixo' : 'Ver o que pediu'}
          </button>
          <BotaoCopiar texto={lista} rotulo="Copiar como lista" />
          {acoes}
        </div>
      </div>
    </li>
  )
}

/**
 * Seção "Revisão de copy" da página de retornos.
 *
 * `acoesDe` devolve os controles que dependem da página que lista (o apagar,
 * que precisa da senha e atualiza a lista) — esta seção só mostra.
 */
export default function RetornosCopy({ retornos, senha, quando, acoesDe }) {
  const capturas = useCapturas()
  const [escolhido, setEscolhido] = useState(null)
  // Sem escolha, mostra o mais recente (a lista já vem do mais novo para o
  // mais velho). Se a pessoa escolhida sumir — foi apagada —, volta a ele.
  const selecionado = retornos.find((retorno) => retorno.id === escolhido) ?? retornos[0]

  const selecionar = (id) => {
    setEscolhido(id)
    requestAnimationFrame(() => document.getElementById(`pedido-${id}`)?.scrollIntoView({ block: 'start' }))
  }

  return (
    <section id="revisao-copy" aria-labelledby="titulo-revisao-copy" className="scroll-mt-8 mt-16 pt-10 border-t border-line">
      <h2 id="titulo-revisao-copy" className="type-title text-text-dark">Revisão de copy</h2>
      <p className="type-body text-text-muted mt-3 max-w-2xl">
        O que o cliente pediu em <span className="whitespace-nowrap">/doc/copy</span>, parte por
        parte do site. Para aplicar, baixe o JSON da pessoa e mande para a equipe.
      </p>

      {retornos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface-light p-8 text-center mt-6">
          <p className="type-subtitle text-text-dark">Nenhuma revisão ainda</p>
          <p className="type-body text-text-muted mt-2">
            Aparece aqui assim que alguém escrever o nome e mudar ou concluir a
            primeira parte em /doc/copy.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-4">
            {retornos.map((retorno) => (
              <CartaoPessoa
                key={retorno.id}
                retorno={retorno}
                quando={quando}
                selecionada={retorno.id === selecionado.id}
                aoSelecionar={() => selecionar(retorno.id)}
                acoes={acoesDe(retorno)}
              />
            ))}
          </ul>
          <Pedido key={selecionado.id} retorno={selecionado} senha={senha} capturas={capturas} />
        </>
      )}
    </section>
  )
}
