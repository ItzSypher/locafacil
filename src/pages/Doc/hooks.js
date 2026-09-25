import { useCallback, useEffect, useState } from 'react'

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
