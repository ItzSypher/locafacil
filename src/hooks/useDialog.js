import { useEffect, useRef } from 'react'

/* A trava de rolagem é contada, não empilhada. Dois diálogos abertos ao mesmo
   tempo — o popup de saída por cima do de boas-vindas — cada um guardando e
   devolvendo o valor anterior deixariam a página travada depois que ambos
   fechassem. Aqui o último a fechar destrava. */
let scrollLocks = 0

function lockScroll() {
  scrollLocks += 1
  if (scrollLocks === 1) document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) document.body.style.overflow = ''
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Comportamento de diálogo para as camadas que cobrem a página.
 *
 * Um popup que só aparece não é um diálogo: quem navega por teclado continua
 * tabulando na página atrás dele, não tem como fechar sem mouse e perde o
 * lugar de onde veio. O hook devolve a ref do painel e cuida de foco inicial,
 * foco preso, Escape, rolagem travada e devolução do foco ao fechar.
 */
export function useDialog(open, onClose) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  const returnToRef = useRef(null)

  closeRef.current = onClose

  useEffect(() => {
    if (!open) return undefined

    const panel = panelRef.current
    returnToRef.current = document.activeElement

    const visibleItems = () =>
      [...(panel?.querySelectorAll(FOCUSABLE) ?? [])].filter((el) => el.offsetParent !== null)

    const focusTimer = window.setTimeout(() => {
      const [first] = visibleItems()
      ;(first ?? panel)?.focus()
    }, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const items = visibleItems()
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    lockScroll()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      unlockScroll()
      const returnTo = returnToRef.current
      if (returnTo && document.contains(returnTo)) returnTo.focus()
    }
  }, [open])

  return panelRef
}
