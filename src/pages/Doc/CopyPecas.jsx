import { memo, useEffect, useRef, useState } from 'react'
import {
  ROTULO_TIPO, LIMITE_TEXTO_NOVO, classeCampo, capturaDe, formaDaDobra, ICONES,
} from './copyRevisao'
import { prepararAnexo, ErroImagem } from './imagem'
import { enviarAnexo } from './retornos'

/* Peças da revisão de copy (`/doc/copy`). A página e o painel montam; aqui
   fica o que se repete por texto e por dobra. */

const hora = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/* Altura do campo pelo tamanho do texto: um botão de três palavras não pede
   uma caixa de seis linhas, e um parágrafo não cabe em duas. */
const linhasPara = (valor) =>
  Math.min(10, Math.max(2, String(valor).split('\n').length + Math.floor(String(valor).length / 60)))


export function Icone({ caminho, className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={caminho} />
    </svg>
  )
}

const BOTAO_SECUNDARIO =
  'min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-line bg-white type-label text-text-dark hover:border-brand-accent hover:text-brand-accent transition-colors cursor-pointer'

/**
 * Um texto do site dentro do painel da dobra.
 *
 * O padrão é manter: quem abre uma parte só mexe no que incomoda, e o resto
 * fica como está sem precisar de um clique por texto. "Trocar" abre o campo
 * já com o texto de hoje; "Tirar" risca. Os dois se desfazem no mesmo lugar.
 *
 * `memo` porque uma dobra chega a ter quarenta textos, e digitar num deles
 * não deve redesenhar os outros.
 */
export const TextoRevisao = memo(function TextoRevisao({ texto, resposta, aoDecidir, aoEscrever }) {
  const decisao = resposta?.decisao === 'trocar' || resposta?.decisao === 'tirar' ? resposta.decisao : null
  const novo = resposta?.novo ?? texto.texto
  const campoRef = useRef(null)
  const anterior = useRef(decisao)
  const idCampo = `novo-${texto.id}`

  /* Foco no campo só na passagem para "trocar": quem abre a parte de novo não
     pode ter o foco roubado pelo último campo aberto. */
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

  return (
    <li
      className={`py-5 border-l-2 pl-4 -ml-4 sm:pl-5 sm:-ml-5 transition-colors ${
        decisao === 'trocar' ? 'border-brand-accent' : decisao === 'tirar' ? 'border-state-error' : 'border-transparent'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="type-label text-text-muted">{ROTULO_TIPO[texto.tipo] ?? texto.tipo}</span>
        {decisao && (
          <span className={`type-label ${decisao === 'tirar' ? 'text-state-error' : 'text-text-dark'}`}>
            · {decisao === 'tirar' ? 'Sai do site' : 'Texto trocado'}
          </span>
        )}
      </div>
      {texto.obs && <p className="type-meta text-text-muted mt-1">{texto.obs}</p>}

      {decisao === 'trocar' ? (
        <div className="mt-2">
          <p className="type-meta text-text-muted">Antes</p>
          <p className="type-body text-text-muted whitespace-pre-line break-words">{texto.texto}</p>
          <label htmlFor={idCampo} className="type-meta text-text-dark block mt-3 mb-1.5">
            Depois
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
            <span className="type-numeric">{novo.length}</span> caracteres · antes eram{' '}
            <span className="type-numeric">{texto.texto.length}</span>
          </p>
        </div>
      ) : (
        <p
          className={`type-body mt-1.5 whitespace-pre-line break-words ${
            decisao === 'tirar' ? 'line-through decoration-state-error text-text-muted' : 'text-text-dark'
          }`}
        >
          {decisao === 'tirar' && <span className="sr-only">Marcado para tirar: </span>}
          {texto.texto}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {decisao ? (
          <button type="button" onClick={() => aoDecidir(texto.id, null)} className={BOTAO_SECUNDARIO}>
            <Icone caminho={ICONES.desfazer} />
            {decisao === 'tirar' ? 'Desfazer, manter o texto' : 'Desfazer a troca'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => aoDecidir(texto.id, 'trocar', texto.texto)}
              className={BOTAO_SECUNDARIO}
            >
              <Icone caminho={ICONES.lapis} />
              Trocar
            </button>
            <button
              type="button"
              onClick={() => aoDecidir(texto.id, 'tirar')}
              className={`${BOTAO_SECUNDARIO} hover:!border-state-error hover:!text-state-error`}
            >
              <Icone caminho={ICONES.x} />
              Tirar
            </button>
          </>
        )}
      </div>
    </li>
  )
})

/* ------------------------------------------------------------ desenhos -- */

/**
 * Desenho simples para a dobra que não é uma tela do site: o resultado do
 * Google e as mensagens do WhatsApp. Só formas, nas cores de superfície —
 * é um ícone grande, não uma captura falsa.
 */
function DesenhoDobra({ forma }) {
  if (forma === 'seo') {
    return (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="18" y="14" width="124" height="14" rx="7" className="fill-white stroke-line" />
        <circle cx="130" cy="21" r="3.5" className="fill-none stroke-text-muted" strokeWidth="1.5" />
        <rect x="18" y="40" width="46" height="4" rx="2" className="fill-text-muted" />
        <rect x="18" y="50" width="96" height="7" rx="3.5" className="fill-brand-accent/70" />
        <rect x="18" y="63" width="124" height="4" rx="2" className="fill-line" />
        <rect x="18" y="71" width="110" height="4" rx="2" className="fill-line" />
        <rect x="18" y="79" width="70" height="4" rx="2" className="fill-line" />
      </svg>
    )
  }
  if (forma === 'whatsapp') {
    return (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="16" y="14" width="86" height="20" rx="8" className="fill-white" />
        <rect x="24" y="21" width="60" height="4" rx="2" className="fill-line" />
        <rect x="58" y="42" width="86" height="26" rx="8" className="fill-brand-whatsapp/30" />
        <rect x="66" y="49" width="68" height="4" rx="2" className="fill-brand-whatsapp/70" />
        <rect x="66" y="57" width="44" height="4" rx="2" className="fill-brand-whatsapp/70" />
        <rect x="16" y="76" width="64" height="14" rx="7" className="fill-white" />
        <rect x="24" y="81" width="40" height="4" rx="2" className="fill-line" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
      <rect x="16" y="14" width="128" height="10" rx="3" className="fill-white" />
      <rect x="16" y="32" width="80" height="8" rx="3" className="fill-text-muted/60" />
      <rect x="16" y="46" width="110" height="4" rx="2" className="fill-line" />
      <rect x="16" y="54" width="96" height="4" rx="2" className="fill-line" />
      <rect x="16" y="68" width="44" height="14" rx="5" className="fill-brand-accent/60" />
    </svg>
  )
}

/**
 * Prévia da dobra no cartão: o topo da captura de computador, sempre na
 * mesma proporção, para a grade não dançar. Faixa muito baixa (o menu tem
 * 1440×80) não cabe cortada — ela entra inteira, centrada.
 */
export function Previa({ dobra, capturas, className = '' }) {
  const [falhou, setFalhou] = useState(false)
  const captura = capturaDe(capturas, dobra.id, 'desktop')
  const faixa = captura?.largura && captura?.altura && captura.altura / captura.largura < 0.3
  const semImagem = !captura || falhou

  return (
    <div className={`relative aspect-[16/10] overflow-hidden bg-surface-muted ${className}`}>
      {semImagem ? (
        <div className="absolute inset-0 p-4">
          <DesenhoDobra forma={formaDaDobra(dobra)} />
        </div>
      ) : (
        <img
          src={captura.endereco}
          alt=""
          width={captura.largura ?? undefined}
          height={captura.altura ?? undefined}
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
          className={`absolute inset-0 w-full h-full ${faixa ? 'object-contain object-center px-3' : 'object-cover object-top'}`}
        />
      )}
    </div>
  )
}

/* Situação da dobra em palavras, com ícone: a cor ajuda, mas não carrega a
   informação sozinha. */
export function SeloSituacao({ situacao }) {
  const estilo = {
    pendente: { classe: 'border border-line text-text-muted', icone: null },
    revisada: { classe: 'bg-state-success-soft text-text-dark', icone: ICONES.check },
    alterada: { classe: 'bg-brand-gold/15 text-text-dark', icone: ICONES.lapis },
  }[situacao.tipo]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-label ${estilo.classe}`}>
      {estilo.icone && <Icone caminho={estilo.icone} className="w-3.5 h-3.5" />}
      {situacao.rotulo}
    </span>
  )
}

/**
 * Captura grande do painel, no computador ou no celular.
 *
 * A imagem inteira, na largura da coluna, rolando dentro da própria caixa —
 * a captura do celular tem mais de três telas de altura. Tocar abre em outra
 * aba, onde dá para usar o zoom de pinça.
 */
export function CapturaGrande({ dobra, capturas }) {
  const desktop = capturaDe(capturas, dobra.id, 'desktop')
  const celular = capturaDe(capturas, dobra.id, 'celular')
  const [formato, setFormato] = useState('desktop')
  const [falhas, setFalhas] = useState({})

  const disponivel = {
    desktop: Boolean(desktop) && !falhas.desktop,
    celular: Boolean(celular) && !falhas.celular,
  }
  const atual = disponivel[formato] ? formato : disponivel.desktop ? 'desktop' : disponivel.celular ? 'celular' : null
  const captura = atual === 'celular' ? celular : desktop

  if (!atual) {
    return (
      <div className="rounded-xl bg-surface-muted aspect-[16/10] p-6">
        <DesenhoDobra forma={formaDaDobra(dobra)} />
        <span className="sr-only">Esta parte não é uma tela do site: não há captura.</span>
      </div>
    )
  }

  return (
    <figure>
      {disponivel.desktop && disponivel.celular && (
        <div className="inline-flex p-1 rounded-xl bg-surface-muted mb-3" role="group" aria-label="Formato da captura">
          {[
            ['desktop', 'Computador'],
            ['celular', 'Celular'],
          ].map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => setFormato(chave)}
              aria-pressed={atual === chave}
              className={`min-h-11 px-4 rounded-lg type-label transition-colors cursor-pointer ${
                atual === chave ? 'bg-white text-text-dark shadow-card' : 'text-text-muted hover:text-text-dark'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}
      <a
        href={captura.endereco}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-xl overflow-hidden border border-line bg-white hover:border-brand-accent transition-colors cursor-zoom-in ${
          atual === 'celular' ? 'max-w-[20rem] mx-auto' : ''
        }`}
      >
        <img
          key={captura.endereco}
          src={captura.endereco}
          alt={`${dobra.titulo}, como está hoje no ${atual === 'celular' ? 'celular' : 'computador'}`}
          width={captura.largura ?? undefined}
          height={captura.altura ?? undefined}
          decoding="async"
          onError={() => setFalhas((antes) => ({ ...antes, [atual]: true }))}
          // No celular a captura divide a tela com os textos: inteira, mas
          // baixa. No computador ela tem a coluna própria e vai no tamanho real.
          className="block w-full h-auto max-h-[45vh] object-contain object-top lg:max-h-none"
        />
      </a>
      <figcaption className="type-meta text-text-muted mt-2">Como está hoje. Toque para ampliar.</figcaption>
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
    ? 'Escreva seu nome para anexar.'
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
              <Icone caminho={ICONES.imagem} className="w-6 h-6" />
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
          <Icone caminho={ICONES.subir} />
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

/* Bolinha e frase do salvamento: é o que responde "chegou?" sem a pessoa
   precisar procurar. */
const SALVAMENTO = {
  ocioso: { ponto: 'bg-line', texto: () => 'O que você mudar salva sozinho' },
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
