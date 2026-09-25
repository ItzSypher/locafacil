import { useCallback, useEffect, useState } from 'react'

/* Estado que sobrevive ao refresh, guardado no navegador de quem lê.
 *
 * A homologação não se faz numa sentada: a pessoa marca três passos, fecha o
 * notebook, volta no dia seguinte. Se o que ela marcou sumir, ela não marca de
 * novo — desiste da lista e manda o retorno pela metade.
 *
 * O armazenamento é do navegador, não do servidor: cada pessoa vê o próprio
 * progresso, e nada disso chega até nós até ela copiar o retorno e mandar. Em
 * aba anônima o acesso estoura; ali a página funciona igual, só não lembra.
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
