import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { novoIdentificador } from './retornos'

/* Estado que sobrevive ao refresh, guardado no navegador de quem lê.
 *
 * A homologação não se faz numa sentada: a pessoa marca três passos, fecha o
 * notebook, volta no dia seguinte. Se o que ela marcou sumir, ela não marca de
 * novo — desiste da lista e manda o retorno pela metade.
 *
 * Esta é a cópia local: cada pessoa continua de onde parou, e nada se perde
 * se um salvamento no servidor falhar. O retorno que chega até nós vai por
 * `/api/retornos` (ver `Checklist.jsx`). Em aba anônima o acesso estoura; ali
 * a página funciona igual, só não lembra.
 */
export function useArmazenamento(chave, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const salvo = localStorage.getItem(chave)
      return salvo ? JSON.parse(salvo) : inicial
    } catch {
      return inicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      // Sem armazenamento a página segue funcionando, só não lembra.
    }
  }, [chave, valor])

  return [valor, setValor]
}

/**
 * Copia um texto e avisa quem clicou.
 *
 * Devolve `[copiar, copiado]`. O aviso apaga sozinho depois de dois segundos —
 * tempo de ler "copiado" sem que o botão fique preso num estado que não é mais
 * verdade.
 *
 * `navigator.clipboard` exige contexto seguro e pode ser negado pelo usuário;
 * quando falha, a função devolve `false` para quem chamou decidir o que dizer.
 */
export function useCopia() {
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!copiado) return undefined
    const timer = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(timer)
  }, [copiado])

  const copiar = useCallback(async (texto) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      return true
    } catch {
      setCopiado(false)
      return false
    }
  }, [])

  return [copiar, copiado]
}

const TITULO_DO_SITE = 'Locafacil | Aluguel de Veículos Sem Burocracia - Carros e Motos no RJ'

/**
 * Título da aba e `noindex` das páginas internas.
 *
 * Posto ao montar e retirado ao sair. O site não usa biblioteca de `<head>`,
 * e um `noindex` esquecido no documento derrubaria a home do Google na
 * próxima navegação dentro da mesma aba.
 */
export function useSemIndice(titulo) {
  useEffect(() => {
    document.title = `${titulo} — Locafácil`

    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)

    return () => {
      document.head.removeChild(meta)
      document.title = TITULO_DO_SITE
    }
  }, [titulo])
}

/* ------------------------------------------------------------- pessoa -- */

/* Quem está respondendo: o mesmo `{ id, nome }` para tudo o que uma página
 * grava. Em /doc/marketing são dois lugares — o roteiro de homologação e o
 * envio de imagens — e com dois `useArmazenamento` na mesma chave cada um
 * nascia com um id próprio no primeiro acesso, e o nome digitado num não
 * aparecia no outro. Aqui é uma fonte só, que avisa a todos quando muda.
 */
const CHAVE_PESSOA = 'locafacil_doc_pessoa'
const ouvintesDaPessoa = new Set()
let pessoaAtual = null

function lerPessoa() {
  if (pessoaAtual) return pessoaAtual
  try {
    const salva = JSON.parse(localStorage.getItem(CHAVE_PESSOA) ?? 'null')
    if (salva && typeof salva.id === 'string' && salva.id) {
      pessoaAtual = { id: salva.id, nome: String(salva.nome ?? '') }
    }
  } catch {
    // Sem armazenamento: a pessoa vale só até recarregar.
  }
  if (!pessoaAtual) {
    // Gravado já na primeira leitura: quem marca um passo sem escrever o nome
    // e volta amanhã continua o mesmo retorno, não abre outro.
    pessoaAtual = { id: novoIdentificador(), nome: '' }
    try {
      localStorage.setItem(CHAVE_PESSOA, JSON.stringify(pessoaAtual))
    } catch {
      // Segue sem lembrar.
    }
  }
  return pessoaAtual
}

function ouvirPessoa(avisar) {
  ouvintesDaPessoa.add(avisar)
  return () => ouvintesDaPessoa.delete(avisar)
}

/** `[pessoa, setPessoa]`, como um `useState` compartilhado entre componentes. */
export function usePessoa() {
  const pessoa = useSyncExternalStore(ouvirPessoa, lerPessoa, lerPessoa)
  const setPessoa = useCallback((atualizar) => {
    const atual = lerPessoa()
    const nova = typeof atualizar === 'function' ? atualizar(atual) : atualizar
    pessoaAtual = { id: nova?.id || atual.id, nome: String(nova?.nome ?? '') }
    try {
      localStorage.setItem(CHAVE_PESSOA, JSON.stringify(pessoaAtual))
    } catch {
      // Segue sem lembrar.
    }
    ouvintesDaPessoa.forEach((avisar) => avisar())
  }, [])
  return [pessoa, setPessoa]
}
