import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  ROTULO_TIPO, LIMITE_TEXTO_NOVO, LIMITE_NOTA, enderecoCaptura, contarMarcados, classeCampo,
} from './copyRevisao'
import { prepararAnexo, ErroImagem } from './imagem'
import { enviarAnexo } from './retornos'

/* Peças da revisão de copy (`/doc/copy`). A página monta; aqui fica o que se
   repete por texto e por dobra. */

const hora = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/* Altura do campo pelo tamanho do texto: um botão de três palavras não pede
   uma caixa de seis linhas, e um parágrafo não cabe em duas. */
const linhasPara = (valor) =>
  Math.min(10, Math.max(2, String(valor).split('\n').length + Math.floor(String(valor).length / 70)))

const ICONES = {
  manter: 'M5 13l4 4L19 7',
  trocar: 'M15.2 5.2l3.6 3.6M4 20l4.3-1 10.4-10.4a2.5 2.5 0 00-3.6-3.6L4.7 15.4 4 20z',
  tirar: 'M6 6l12 12M18 6L6 18',
}

function Icone({ caminho, className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={caminho} />
    </svg>
  )
}

/* Cada decisão tem uma cor só quando marcada: na lista de trezentos textos, o
   olho acha o que vai mudar sem ler — azul é o que troca, vermelho o que sai. */
const OPCOES = [
  { valor: 'manter', rotulo: 'Manter', ativa: 'bg-white text-text-dark shadow-card' },
  { valor: 'trocar', rotulo: 'Trocar', ativa: 'bg-brand-accent text-white' },
  { valor: 'tirar', rotulo: 'Tirar', ativa: 'bg-state-error text-white' },
]

/**
 * Um texto do site com a decisão sobre ele.
 *
 * O controle é um grupo de rádios de verdade, só vestido de botões: o teclado
 * anda entre as três opções com as setas e o leitor de tela anuncia qual está
 * marcada, sem nenhum código a mais. Nenhuma vem marcada — "Manter" pré-
 * marcado viraria a resposta de quem só rolou a página.
 *
 * `memo` porque a página tem centenas destes, e digitar num deles não deve
 * redesenhar os outros.
 */
export const TextoRevisao = memo(function TextoRevisao({ texto, resposta, aoDecidir, aoEscrever }) {
  const decisao = resposta?.decisao
  const novo = resposta?.novo ?? texto.texto
  const campoRef = useRef(null)
  const anterior = useRef(decisao)

  /* Trocar abre o campo já com o texto atual e o cursor no fim: quem troca
     quase sempre ajusta uma palavra, não reescreve do zero. Só na passagem
     para "trocar" — quem volta à página não pode ter o foco roubado pelo
     último campo aberto. */
  useEffect(() => {
    if (decisao === 'trocar' && anterior.current !== 'trocar') {
      const campo = campoRef.current
      if (campo) {
        campo.focus({ preventScroll: true })
        campo.setSelectionRange(campo.value.length, campo.value.length)
      }
    }
    anterior.current = decisao
  }, [decisao])

  const idCampo = `novo-${texto.id}`

  return (
    <li className="px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="type-label text-text-muted">{ROTULO_TIPO[texto.tipo] ?? texto.tipo}</span>
        {texto.obs && <span className="type-meta text-text-muted">{texto.obs}</span>}
      </div>

      <p
        className={`type-body mt-1.5 whitespace-pre-line break-words ${
          decisao === 'tirar' ? 'line-through decoration-state-error text-text-muted' : 'text-text-dark'
        }`}
      >
        {decisao === 'tirar' && <span className="sr-only">Marcado para tirar: </span>}
        {texto.texto}
      </p>

      <fieldset className="mt-3">
        <legend className="sr-only">O que fazer com este texto</legend>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-muted sm:inline-grid">
          {OPCOES.map((opcao) => {
            const marcada = decisao === opcao.valor
            return (
              <label key={opcao.valor} className="block">
                <input
                  type="radio"
                  name={`decisao-${texto.id}`}
                  value={opcao.valor}
                  checked={marcada}
                  onChange={() => aoDecidir(texto.id, opcao.valor, texto.texto)}
                  className="peer sr-only"
                />
                <span
                  className={`min-h-11 sm:min-w-[7rem] px-3 flex items-center justify-center gap-1.5 rounded-lg type-label cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-accent peer-focus-visible:ring-offset-1 ${
                    marcada ? opcao.ativa : 'text-text-muted hover:text-text-dark hover:bg-white/70'
                  }`}
                >
                  <Icone caminho={ICONES[opcao.valor]} />
                  {opcao.rotulo}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {decisao === 'trocar' && (
        <div className="mt-4">
          <label htmlFor={idCampo} className="type-label text-text-dark block mb-2">
            Texto novo
          </label>
          <textarea
            id={idCampo}
            ref={campoRef}
            value={novo}
            onChange={(evento) => aoEscrever(texto.id, evento.target.value)}
            maxLength={LIMITE_TEXTO_NOVO}
            rows={linhasPara(novo)}
            className={classeCampo()}
          />
          <p className="type-meta text-text-muted mt-1.5">
            <span className="type-numeric">{novo.length}</span> caracteres · o texto de hoje tem{' '}
            <span className="type-numeric">{texto.texto.length}</span>
          </p>
        </div>
      )}
    </li>
  )
})

/**
 * Captura da dobra como está hoje, no computador ou no celular.
 *
 * As imagens são geradas à parte e podem ainda não existir: a que falha some
 * (`onError`), a outra assume, e sem nenhuma a dobra fica só com os textos.
 * Tocar abre a imagem inteira em outra aba — no celular, é onde dá para usar
 * o zoom de pinça.
 */
function Captura({ idDobra, titulo, falhas, aoFalhar }) {
  const [formato, setFormato] = useState('desktop')
  const atual = falhas[formato] ? (formato === 'desktop' ? 'celular' : 'desktop') : formato
  const endereco = enderecoCaptura(idDobra, atual)
  const celular = atual === 'celular'
  const podeTrocar = !falhas.desktop && !falhas.celular

  return (
    <figure>
      <a
        href={endereco}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-xl overflow-hidden border border-line bg-white hover:border-brand-accent transition-colors cursor-zoom-in ${
          celular ? 'w-fit max-w-full mx-auto' : ''
        }`}
      >
        <img
          key={endereco}
          src={endereco}
          alt={`${titulo}, como está hoje no ${celular ? 'celular' : 'computador'}`}
          loading="lazy"
          decoding="async"
          onError={() => aoFalhar(atual)}
          className={celular ? 'block h-auto w-auto max-w-full max-h-[70vh]' : 'block w-full h-auto'}
        />
      </a>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <span className="type-meta text-text-muted">Como está hoje. Toque para ampliar.</span>
        {podeTrocar && (
          <span className="inline-flex p-1 rounded-xl bg-surface-muted" role="group" aria-label="Formato da captura">
            {[
              ['desktop', 'Computador'],
              ['celular', 'Celular'],
            ].map(([chave, rotulo]) => (
              <button
                key={chave}
                type="button"
                onClick={() => setFormato(chave)}
                aria-pressed={atual === chave}
                className={`min-h-11 px-3 rounded-lg type-label transition-colors cursor-pointer ${
                  atual === chave ? 'bg-white text-text-dark shadow-card' : 'text-text-muted hover:text-text-dark'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

/**
 * Anexar uma imagem a uma dobra ou ao espaço livre.
 *
 * A imagem é reduzida no navegador (`imagem.js`) e sobe na hora; o que o
 * retorno guarda é só o caminho dela. A miniatura fica no navegador, para a
 * pessoa ver o que anexou quando voltar — o arquivo no servidor só se abre
 * com a senha da equipe.
 *
 * Sem nome não há envio, como no resto da página: o anexo sem dono não
 * chegaria a ninguém.
 */
export function CampoAnexo({ alvo, idPessoa, liberado, anexo, miniatura, aoAnexar, aoRemover }) {
  const [fase, setFase] = useState({ tipo: 'ocioso' })
  const idCampo = `anexo-${alvo}`
  const ocupado = fase.tipo === 'preparando' || fase.tipo === 'enviando'
  const temImagem = Boolean(anexo || miniatura)

  const escolher = async (evento) => {
    const arquivo = evento.target.files?.[0]
    // Limpa o campo para que escolher o mesmo arquivo de novo dispare outra vez.
    evento.target.value = ''
    if (!arquivo) return

    setFase({ tipo: 'preparando' })
    try {
      const { dataUrl, miniatura: pequena } = await prepararAnexo(arquivo)
      setFase({ tipo: 'enviando' })
      const resultado = await enviarAnexo({ id: idPessoa, alvo, dataUrl })
      aoAnexar(alvo, resultado.salvo ? resultado.anexo : null, pequena)
      setFase({ tipo: resultado.salvo ? 'enviado' : 'local' })
    } catch (erro) {
      setFase({
        tipo: 'erro',
        mensagem:
          erro instanceof ErroImagem
            ? erro.message
            : erro instanceof TypeError
              ? 'Sem conexão agora. Tente de novo em instantes.'
              : erro.message,
      })
    }
  }

  const aviso = !liberado
    ? 'Escreva seu nome no topo da página para anexar.'
    : {
        preparando: 'Reduzindo a imagem…',
        enviando: 'Enviando a imagem…',
        enviado: 'Imagem enviada. Já chegou para a equipe.',
        local: 'Imagem guardada só neste navegador: o servidor não recebeu.',
        erro: fase.mensagem,
      }[fase.tipo] ?? 'Um print rabiscado, uma referência. JPG, PNG ou WEBP.'

  return (
    <div>
      {temImagem && (
        <div className="flex items-start gap-4 mb-3">
          {miniatura ? (
            <img
              src={miniatura}
              alt="Imagem anexada"
              className="w-24 h-auto max-h-32 object-contain rounded-lg border border-line bg-white"
            />
          ) : (
            <span className="w-24 h-16 rounded-lg border border-line bg-white flex items-center justify-center text-text-muted">
              <Icone caminho="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-6 h-6" />
            </span>
          )}
          <div className="min-w-0">
            <p className="type-body text-text-dark">Imagem anexada</p>
            <p className="type-meta text-text-muted">
              {anexo ? 'Já chegou para a equipe.' : 'Só neste navegador — não chegou à equipe.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={idCampo}
          className={`min-h-11 inline-flex items-center gap-2 px-4 rounded-xl border type-label transition-colors focus-within:ring-2 focus-within:ring-brand-accent ${
            liberado && !ocupado
              ? 'border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 cursor-pointer'
              : 'border-line text-text-muted cursor-not-allowed'
          }`}
        >
          <input
            id={idCampo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!liberado || ocupado}
            onChange={escolher}
            className="sr-only"
          />
          <Icone caminho="M12 16V4m0 0L8 8m4-4l4 4M5 20h14" />
          {ocupado ? 'Aguarde…' : temImagem ? 'Trocar imagem' : 'Anexar imagem'}
        </label>
        {temImagem && !ocupado && (
          <button
            type="button"
            onClick={() => {
              aoRemover(alvo)
              setFase({ tipo: 'ocioso' })
            }}
            className="min-h-11 px-3 type-label text-text-muted hover:text-state-error transition-colors cursor-pointer"
          >
            Remover
          </button>
        )}
      </div>

      <p
        className={`type-meta mt-2 ${fase.tipo === 'erro' ? 'text-state-error' : 'text-text-muted'}`}
        aria-live="polite"
      >
        {aviso}
      </p>
    </div>
  )
}

/**
 * Uma dobra do site: captura ao lado, textos dela, observação e anexo.
 *
 * No computador a captura fica parada à esquerda enquanto a lista rola — a
 * pessoa lê o texto e confere onde ele está sem subir a página. No celular
 * ela vem em cima, antes dos textos.
 */
export function Dobra({
  dobra, posicao, total, respostas, bloco, miniatura, idPessoa, liberado,
  aoDecidir, aoEscrever, aoAnotar, aoAnexar, aoRemover,
}) {
  const [falhas, setFalhas] = useState({})
  const textos = Array.isArray(dobra.textos) ? dobra.textos : []
  const marcados = contarMarcados(textos, respostas)
  const completa = textos.length > 0 && marcados === textos.length
  const temCaptura = !(falhas.desktop && falhas.celular)
  const nota = bloco?.nota ?? ''

  const aoFalhar = useCallback(
    (formato) => setFalhas((atual) => (atual[formato] ? atual : { ...atual, [formato]: true })),
    [],
  )

  return (
    <article
      id={`dobra-${dobra.id}`}
      aria-labelledby={`titulo-${dobra.id}`}
      className="scroll-mt-28 rounded-2xl border border-line bg-white overflow-clip"
    >
      <header className="px-5 py-5 sm:px-6 border-b border-line-soft flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 id={`titulo-${dobra.id}`} className="type-subtitle text-text-dark">{dobra.titulo}</h3>
          <p className="type-meta text-text-muted mt-1">
            Parte <span className="type-numeric">{posicao}</span> de <span className="type-numeric">{total}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4">
          <span className="type-label text-text-dark inline-flex items-center gap-1.5">
            {completa && <Icone caminho={ICONES.manter} className="w-4 h-4 text-brand-success" />}
            <span className="type-numeric">{marcados}</span>/<span className="type-numeric">{textos.length}</span>
            <span className="sr-only">textos marcados nesta parte</span>
          </span>
          {dobra.rota && (
            <a
              href={dobra.rota}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 inline-flex items-center gap-1.5 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer"
            >
              Abrir no site
              <Icone caminho="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5" />
            </a>
          )}
        </div>
      </header>

      <div className={temCaptura ? 'lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''}>
        {temCaptura && (
          <div className="p-5 sm:p-6 bg-surface-light border-b border-line-soft lg:border-b-0 lg:border-r">
            <div className="lg:sticky lg:top-24">
              <Captura idDobra={dobra.id} titulo={dobra.titulo} falhas={falhas} aoFalhar={aoFalhar} />
            </div>
          </div>
        )}

        <div className="min-w-0">
          <ul className="divide-y divide-line-soft">
            {textos.map((texto) => (
              <TextoRevisao
                key={texto.id}
                texto={texto}
                resposta={respostas?.[texto.id]}
                aoDecidir={aoDecidir}
                aoEscrever={aoEscrever}
              />
            ))}
          </ul>

          <div className="px-5 py-5 sm:px-6 border-t border-line-soft bg-surface-light">
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
                idPessoa={idPessoa}
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
    </article>
  )
}

/* Bolinha e frase do salvamento, na barra fixa: é o que responde "chegou?"
   sem a pessoa precisar procurar. */
const SALVAMENTO = {
  ocioso: { ponto: 'bg-line', texto: () => 'Tudo o que você marcar salva sozinho' },
  'sem-nome': { ponto: 'bg-brand-gold', texto: () => 'Guardado só neste navegador. Escreva seu nome para chegar à equipe' },
  salvando: { ponto: 'bg-text-muted', texto: () => 'Salvando…' },
  salvo: { ponto: 'bg-brand-success', texto: ({ em }) => `Salvo — já chegou para a equipe${em ? ` · ${hora(em)}` : ''}` },
  local: { ponto: 'bg-brand-gold', texto: () => 'Salvo só neste navegador' },
  erro: { ponto: 'bg-state-error', texto: () => 'Não consegui salvar agora' },
}

export function AvisoSalvamento({ estado, aoTentarDeNovo, className = '' }) {
  const { ponto, texto } = SALVAMENTO[estado.tipo] ?? SALVAMENTO.ocioso
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <p
        className={`type-meta inline-flex items-center gap-2 ${estado.tipo === 'erro' ? 'text-state-error' : 'text-text-muted'}`}
        aria-live="polite"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${ponto}`} aria-hidden="true" />
        {texto(estado)}
      </p>
      {estado.tipo === 'erro' && (
        <button
          type="button"
          onClick={aoTentarDeNovo}
          className="min-h-11 px-3 -my-2 type-label text-brand-accent hover:text-brand-glow transition-colors cursor-pointer"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}
