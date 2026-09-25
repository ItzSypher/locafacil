import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/brand/logo-lockup-white.svg'
import { ROTEIRO } from '../../content/documentacao'
import { useSemIndice } from './hooks'
import { BotaoCopiar } from './Pecas'
import { listarRetornos, apagarRetorno } from './retornos'

const CHAVE_SENHA = 'locafacil_doc_senha'

const PAGINAS = { cliente: 'Cliente', marketing: 'Marketing' }

const quando = (iso) => {
  if (!iso) return ''
  const data = new Date(iso)
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

/* A senha fica na sessão da aba, não no navegador: fechou a aba, pede de novo.
   Esta tela mostra o que as pessoas escreveram — não deve abrir sozinha num
   computador emprestado dias depois. */
function lerSenha() {
  try {
    return sessionStorage.getItem(CHAVE_SENHA) ?? ''
  } catch {
    return ''
  }
}

function guardarSenha(senha) {
  try {
    if (senha) sessionStorage.setItem(CHAVE_SENHA, senha)
    else sessionStorage.removeItem(CHAVE_SENHA)
  } catch {
    // Sem armazenamento, a senha vale só até recarregar a página.
  }
}

/** Texto corrido de todos os retornos, para colar numa conversa ou num documento. */
function textoDe(retornos) {
  return retornos
    .map((retorno) => {
      const linhas = [
        `${retorno.nome || 'Sem nome'} — página ${PAGINAS[retorno.publico] ?? retorno.publico} — ${quando(retorno.atualizadoEm)}`,
      ]
      ROTEIRO.forEach((passo, indice) => {
        const marcado = retorno.passos?.[passo.id]?.feito
        const nota = retorno.passos?.[passo.id]?.nota
        if (!marcado && !nota) return
        linhas.push(`${marcado ? '[x]' : '[ ]'} ${indice + 1}. ${passo.titulo}`)
        if (nota) linhas.push(`    ${nota}`)
      })
      return linhas.join('\n')
    })
    .join('\n\n')
}

/* Apagar é definitivo: o arquivo sai do armazenamento e não volta. Por isso
   são dois cliques, e o segundo diz exatamente o que vai acontecer. */
function Apagar({ aoConfirmar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [apagando, setApagando] = useState(false)

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="min-h-11 px-3 type-label text-text-muted hover:text-state-error transition-colors cursor-pointer"
      >
        Apagar
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={apagando}
        aria-busy={apagando}
        onClick={async () => {
          setApagando(true)
          try {
            await aoConfirmar()
          } finally {
            setApagando(false)
            setConfirmando(false)
          }
        }}
        className="min-h-11 px-3 rounded-xl border border-state-error/40 text-state-error hover:bg-state-error-soft disabled:opacity-60 transition-colors cursor-pointer type-label"
      >
        Apagar de vez
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="min-h-11 px-3 type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
      >
        Cancelar
      </button>
    </span>
  )
}

function CartaoRetorno({ retorno, aoApagar }) {
  const feitos = ROTEIRO.filter((passo) => retorno.passos?.[passo.id]?.feito).length

  return (
    <article className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className={`type-subtitle ${retorno.nome ? 'text-text-dark' : 'text-text-muted'}`}>
            {retorno.nome || 'Sem nome'}
          </h2>
          <p className="type-meta text-text-muted mt-1">
            Atualizado em <span className="type-numeric">{quando(retorno.atualizadoEm)}</span>
            {retorno.enviadoEm && (
              <>
                {' · '}enviado pelo WhatsApp em{' '}
                <span className="type-numeric">{quando(retorno.enviadoEm)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="type-label text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full">
            {PAGINAS[retorno.publico] ?? retorno.publico}
          </span>
          <span className="type-label text-text-dark">
            <span className="type-numeric">{feitos}</span> de{' '}
            <span className="type-numeric">{ROTEIRO.length}</span>
          </span>
          <Apagar aoConfirmar={aoApagar} />
        </div>
      </header>

      <ol className="mt-5 space-y-3">
        {ROTEIRO.map((passo, indice) => {
          const marcado = Boolean(retorno.passos?.[passo.id]?.feito)
          const nota = retorno.passos?.[passo.id]?.nota
          return (
            <li key={passo.id} className="flex gap-3">
              <span
                className={`w-5 h-5 mt-0.5 shrink-0 rounded-md border flex items-center justify-center ${
                  marcado ? 'bg-brand-success border-brand-success text-white' : 'border-line'
                }`}
                aria-hidden="true"
              >
                {marcado && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <p className={`type-body ${marcado ? 'text-text-dark' : 'text-text-muted'}`}>
                  <span className="sr-only">{marcado ? 'Conferido: ' : 'Não conferido: '}</span>
                  <span className="type-numeric mr-1">{indice + 1}.</span> {passo.titulo}
                </p>
                {nota && (
                  <p className="type-body text-text-dark mt-1.5 rounded-xl bg-surface-light border border-line px-4 py-3 whitespace-pre-wrap break-words">
                    {nota}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </article>
  )
}

/**
 * Retornos da homologação, para quem conduz o projeto.
 *
 * Lê `/api/retornos` com a senha de `DOC_RETORNOS_SENHA`. Cada cartão é uma
 * pessoa numa página, na versão mais recente do que ela marcou e escreveu —
 * inclusive de quem nunca apertou o botão do WhatsApp.
 */
export default function DocRetornos() {
  useSemIndice('Retornos da homologação')

  const [senhaDaSessao] = useState(lerSenha)
  const [senha, setSenha] = useState('')
  const [digitada, setDigitada] = useState('')
  const [retornos, setRetornos] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const carregar = useCallback(async (chave) => {
    setCarregando(true)
    setErro('')
    try {
      const dados = await listarRetornos(chave)
      setRetornos(dados)
      setSenha(chave)
      guardarSenha(chave)
    } catch (falha) {
      if (falha.status === 401) {
        setErro('Senha não confere.')
        setSenha('')
        guardarSenha('')
        setRetornos(null)
      } else {
        setErro(falha.message)
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  // Senha já guardada nesta aba: carrega direto, sem pedir de novo. As duas
  // dependências não mudam depois da montagem — quem recarrega é o botão.
  useEffect(() => {
    if (senhaDaSessao) carregar(senhaDaSessao)
  }, [senhaDaSessao, carregar])

  const contagem = useMemo(() => {
    const lista = retornos ?? []
    return {
      todos: lista.length,
      cliente: lista.filter((r) => r.publico === 'cliente').length,
      marketing: lista.filter((r) => r.publico === 'marketing').length,
    }
  }, [retornos])

  const visiveis = (retornos ?? []).filter((r) => filtro === 'todos' || r.publico === filtro)

  const apagar = async (retorno) => {
    try {
      await apagarRetorno(senha, retorno)
      setRetornos((lista) => lista.filter((r) => !(r.publico === retorno.publico && r.id === retorno.id)))
    } catch (falha) {
      setErro(falha.message)
    }
  }

  const sair = () => {
    guardarSenha('')
    setSenha('')
    setRetornos(null)
    setDigitada('')
  }

  return (
    <div className="on-light min-h-screen bg-white overflow-x-hidden">
      <header className="bg-hero-gradient">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-10 sm:pt-10 sm:pb-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="inline-flex min-h-11 items-center">
              <img src={logo} alt="Locafácil" width={850} height={255} className="h-8 w-auto" />
            </Link>
            <span className="type-label text-text-secondary border border-white/20 rounded-full px-3 py-1.5">
              Acesso restrito
            </span>
          </div>
          <h1 className="type-headline text-text-primary mt-10">Retornos da homologação</h1>
          <p className="type-body text-text-secondary mt-3 max-w-2xl">
            O que cada pessoa marcou e escreveu nas páginas do cliente e do
            marketing, salvo automaticamente — inclusive de quem não mandou pelo
            WhatsApp.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {!retornos && (
          <form
            onSubmit={(evento) => {
              evento.preventDefault()
              if (digitada.trim()) carregar(digitada.trim())
            }}
            className="max-w-md"
          >
            <label className="block">
              <span className="type-label text-text-muted block mb-2">Senha</span>
              <input
                type="password"
                value={digitada}
                onChange={(evento) => setDigitada(evento.target.value)}
                autoComplete="current-password"
                aria-invalid={Boolean(erro) || undefined}
                aria-describedby={erro ? 'erro-senha' : undefined}
                className="w-full rounded-xl border border-line bg-surface-light px-4 py-3 type-body text-text-dark focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
              />
            </label>
            {erro && (
              <p id="erro-senha" role="alert" className="type-meta text-state-error mt-2">
                {erro}
              </p>
            )}
            <button
              type="submit"
              disabled={carregando || !digitada.trim()}
              aria-busy={carregando}
              className="mt-4 min-h-11 px-6 rounded-xl bg-brand-accent hover:bg-brand-glow disabled:opacity-60 disabled:cursor-not-allowed text-white type-label transition-colors cursor-pointer"
            >
              Ver retornos
            </button>
          </form>
        )}

        {retornos && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {[
                ['todos', 'Todos'],
                ['cliente', 'Cliente'],
                ['marketing', 'Marketing'],
              ].map(([chave, rotulo]) => (
                <button
                  key={chave}
                  type="button"
                  onClick={() => setFiltro(chave)}
                  aria-pressed={filtro === chave}
                  className={`min-h-11 px-4 rounded-xl type-label border transition-colors cursor-pointer ${
                    filtro === chave
                      ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                      : 'border-line text-text-muted hover:text-text-dark'
                  }`}
                >
                  {rotulo} <span className="type-numeric ml-1">{contagem[chave]}</span>
                </button>
              ))}

              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => carregar(senha)}
                  disabled={carregando}
                  aria-busy={carregando}
                  className="min-h-11 px-4 rounded-xl border border-line type-label text-text-dark hover:border-brand-accent disabled:opacity-60 transition-colors cursor-pointer"
                >
                  Atualizar
                </button>
                {visiveis.length > 0 && <BotaoCopiar texto={textoDe(visiveis)} rotulo="Copiar tudo" />}
                <button
                  type="button"
                  onClick={sair}
                  className="min-h-11 px-4 type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </div>
            </div>

            {erro && (
              <p role="alert" className="type-meta text-state-error mb-6">{erro}</p>
            )}

            {visiveis.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface-light p-8 text-center">
                <p className="type-subtitle text-text-dark">Ninguém respondeu ainda</p>
                <p className="type-body text-text-muted mt-2">
                  Os retornos aparecem aqui assim que alguém marcar um passo ou
                  escrever uma observação numa das páginas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visiveis.map((retorno) => (
                  <CartaoRetorno
                    key={`${retorno.publico}-${retorno.id}`}
                    retorno={retorno}
                    aoApagar={() => apagar(retorno)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
