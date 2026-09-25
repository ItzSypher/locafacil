import { useId } from 'react'
import { motion } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'

/* Camada sobre a página é diálogo: foco preso e devolvido, Escape, rolagem
   travada. O hook cuida disso; aqui fica só a casca visual.
   Sem AnimatePresence na saída — um painel em opacity 0 continua tabulável. */
export default function Dialog({ open, onClose, title, children, footer }) {
  const panelRef = useDialog(open, onClose)
  const titleId = useId()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-brand-dark/80 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="on-light relative w-full sm:max-w-lg max-h-[88vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-card-hover flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-line-soft">
          <h2 id={titleId} className="type-subtitle text-text-dark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 w-11 h-11 -m-2.5 flex items-center justify-center rounded-xl text-text-muted hover:text-text-dark hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="p-6 pt-4 border-t border-line-soft">{footer}</div>}
      </motion.div>
    </div>
  )
}
