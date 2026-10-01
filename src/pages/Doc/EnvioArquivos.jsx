import { useEffect, useRef, useState } from 'react'
import { LIMITE_ENVIO, FORMATOS_ACEITOS } from '../../content/marketing-imagens'
import { usePessoa } from './hooks'
import { enviarArquivoDesign } from './retornos'

/* Envio de arquivos do design para `/api/retornos?arquivo=1`.
 *
 * Usado pelas fichas de imagem e pelos blocos de quebra de linha de
 * /doc/marketing: o destino (`espaco`) diz a que parte do site o arquivo
 * pertence, e é por ele que /doc/retornos agrupa o que chegou.
 */

const CAMINHOS = {
  subir: 'M12 16V4m0 0L8 8m4-4l4 4M5 20h14',
  check: 'M5 13l4 4L19 7',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  imagem: 'M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
}

function Icone({ caminho, className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={caminho} />
    </svg>
  )
}

const megas = (bytes) => `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
const quilos = (bytes) =>
  bytes >= 1024 * 1024 ? megas(bytes) : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('pt-BR')} KB`
const extensaoDe = (nome) => String(nome ?? '').toLowerCase().split('.').pop()

const hora = (iso) => {
  if (!iso) return ''
  const data = new Date(iso)
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

/* ------------------------------------------------------------- envio -- */

const MENSAGEM_ESTADO = {
  enviando: 'Enviando…',
  enviado: 'Chegou à equipe',
  local: 'Só neste navegador: o servidor não guardou',
  erro: null,
}

/* Confere no navegador o que o servidor recusaria, para a pessoa saber na
   hora — e sem gastar um envio de 3 MB para ouvir "não". */
function problemaDe(arquivo) {
  const extensao = extensaoDe(arquivo.name)
  const tipo = FORMATOS_ACEITOS.tipos[extensao]
  if (!tipo) return { erro: 'Formato não aceito: use JPG, PNG, WEBP ou SVG.' }
  if (arquivo.size > LIMITE_ENVIO) {
    return { erro: `Tem ${megas(arquivo.size)}; o limite é 3 MB. Exporte com mais compressão ou mande por link à equipe.` }
  }
  if (!arquivo.size) return { erro: 'Arquivo vazio.' }
  return { tipo }
}

/**
 * Campo de envio de um destino (um espaço, as logos, um grupo da frota).
 *
 * Aceita vários arquivos de uma vez, por clique ou arrastando. Cada um sobe
 * sozinho, em sequência, e a lista mostra o estado de cada um. O que já
 * chegou fica guardado no navegador (`enviados`), para a pessoa ver o que
 * mandou quando voltar; a prévia só existe na visita em que foi enviado.
 */
export default function Envio({ destino, rotulo, botao, enviados = [], aoEnviar, compacto = false }) {
  const [pessoa] = usePessoa()
  const [fila, setFila] = useState([])
  const [arrastando, setArrastando] = useState(false)
  const previas = useRef(new Map())
  const liberado = Boolean(pessoa.nome.trim())
  const ocupado = fila.some((item) => item.estado === 'enviando')
  const idCampo = `envio-${destino}`

  // As prévias são object URLs: soltas quando o cartão sai da tela.
  useEffect(() => {
    const mapa = previas.current
    return () => mapa.forEach((endereco) => URL.revokeObjectURL(endereco))
  }, [])

  const enviar = async (lista) => {
    if (!liberado) return
    const novos = [...lista].map((arquivo, indice) => ({
      chave: `${Date.now()}-${indice}-${arquivo.name}`,
      arquivo,
      original: arquivo.name,
      tamanho: arquivo.size,
      ...problemaDe(arquivo),
    }))
    setFila((atual) => [
      ...novos.map(({ chave, original, tamanho, erro }) => ({
        chave,
        original,
        tamanho,
        estado: erro ? 'erro' : 'enviando',
        mensagem: erro,
      })),
      ...atual.filter((item) => item.estado !== 'enviado' && item.estado !== 'local'),
    ])

    for (const item of novos) {
      if (item.erro) continue
      try {
        const resultado = await enviarArquivoDesign({
          id: pessoa.id,
          nome: pessoa.nome.trim(),
          espaco: destino,
          arquivo: item.arquivo,
          tipo: item.tipo,
        })
        if (item.tipo !== 'image/svg+xml') {
          const anterior = previas.current.get(resultado.arquivo)
          if (anterior) URL.revokeObjectURL(anterior)
          previas.current.set(resultado.arquivo, URL.createObjectURL(item.arquivo))
        }
        aoEnviar(destino, {
          arquivo: resultado.arquivo,
          original: item.original,
          tamanho: resultado.tamanho ?? item.tamanho,
          enviadoEm: resultado.enviadoEm ?? new Date().toISOString(),
          salvo: Boolean(resultado.salvo),
        })
        setFila((atual) =>
          atual.map((x) => (x.chave === item.chave ? { ...x, estado: resultado.salvo ? 'enviado' : 'local', arquivo: resultado.arquivo } : x)),
        )
      } catch (erro) {
        const mensagem = erro instanceof TypeError ? 'Sem conexão agora. Tente de novo em instantes.' : erro.message
        setFila((atual) => atual.map((x) => (x.chave === item.chave ? { ...x, estado: 'erro', mensagem } : x)))
      }
    }
  }

  const escolher = (evento) => {
    const arquivos = evento.target.files
    if (arquivos?.length) enviar(arquivos)
    // Limpa para que escolher o mesmo arquivo de novo dispare outra vez.
    evento.target.value = ''
  }

  // Na lista: o que está subindo ou falhou nesta visita, e depois o que já
  // chegou (guardado no navegador), do mais novo para o mais antigo.
  const pendentes = fila.filter((item) => item.estado === 'enviando' || item.estado === 'erro')
  const chegaram = [...enviados].sort((a, b) => String(b.enviadoEm).localeCompare(String(a.enviadoEm)))

  return (
    <div
      onDragOver={(evento) => {
        if (!liberado) return
        evento.preventDefault()
        setArrastando(true)
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(evento) => {
        evento.preventDefault()
        setArrastando(false)
        if (liberado && evento.dataTransfer?.files?.length) enviar(evento.dataTransfer.files)
      }}
      className={`rounded-xl border border-dashed p-4 transition-colors print:hidden ${
        arrastando ? 'border-brand-accent bg-brand-accent/10' : 'border-line bg-surface-light'
      }`}
    >
      {!compacto && <p className="type-label text-text-dark mb-2">{rotulo ?? 'Enviar arquivo novo'}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label
          htmlFor={idCampo}
          className={`min-h-11 inline-flex items-center gap-2 px-4 rounded-xl border type-label transition-colors focus-within:ring-2 focus-within:ring-brand-accent ${
            liberado && !ocupado
              ? 'border-brand-accent/40 bg-white text-brand-accent hover:bg-brand-accent/10 cursor-pointer'
              : 'border-line bg-white text-text-muted cursor-not-allowed'
          }`}
        >
          <input
            id={idCampo}
            type="file"
            multiple
            accept={FORMATOS_ACEITOS.accept}
            disabled={!liberado || ocupado}
            onChange={escolher}
            className="sr-only"
          />
          <Icone caminho={CAMINHOS.subir} />
          {ocupado ? 'Enviando…' : botao ?? (compacto ? 'Enviar foto nova' : 'Enviar arquivo novo')}
        </label>
        <p className="type-meta text-text-muted">
          {liberado ? (
            <>JPG, PNG, WEBP ou SVG, até 3 MB cada. Pode mandar mais de um, ou arrastar até aqui.</>
          ) : (
            <>
              <a href="#quem-envia" className="text-brand-accent hover:text-brand-glow underline underline-offset-2">
                Escreva seu nome
              </a>{' '}
              para enviar.
            </>
          )}
        </p>
      </div>

      {(pendentes.length > 0 || chegaram.length > 0) && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {pendentes.map((item) => (
            <li key={item.chave} className="flex items-start gap-3 rounded-lg bg-white border border-line px-3 py-2">
              <span className={`mt-0.5 ${item.estado === 'erro' ? 'text-state-error' : 'text-text-muted'}`}>
                <Icone caminho={item.estado === 'erro' ? CAMINHOS.alerta : CAMINHOS.subir} />
              </span>
              <div className="min-w-0">
                <p className="type-body text-text-dark break-all">{item.original}</p>
                <p className={`type-meta ${item.estado === 'erro' ? 'text-state-error' : 'text-text-muted'}`}>
                  {item.estado === 'erro' ? item.mensagem : MENSAGEM_ESTADO[item.estado]}
                </p>
              </div>
            </li>
          ))}
          {chegaram.map((item) => {
            const previa = previas.current.get(item.arquivo)
            return (
              <li key={item.arquivo} className="flex items-center gap-3 rounded-lg bg-white border border-line px-3 py-2">
                {previa ? (
                  <img src={previa} alt="" className="w-12 h-12 rounded-md object-contain bg-surface-muted shrink-0" />
                ) : (
                  <span className="w-12 h-12 rounded-md bg-surface-muted text-text-muted inline-flex items-center justify-center shrink-0">
                    <Icone caminho={CAMINHOS.imagem} className="w-5 h-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="type-body text-text-dark break-all">{item.arquivo}</p>
                  <p className="type-meta text-text-muted">
                    <span className="type-numeric">{quilos(item.tamanho)}</span> ·{' '}
                    <span className="type-numeric">{hora(item.enviadoEm)}</span> ·{' '}
                    {item.salvo ? (
                      <span className="text-text-dark">Chegou à equipe</span>
                    ) : (
                      <span className="text-state-error">{MENSAGEM_ESTADO.local}</span>
                    )}
                  </p>
                </div>
                <span className={`ml-auto ${item.salvo ? 'text-brand-success' : 'text-state-error'}`}>
                  <Icone caminho={item.salvo ? CAMINHOS.check : CAMINHOS.alerta} />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
