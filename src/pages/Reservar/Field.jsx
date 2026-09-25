import { useId } from 'react'

const base = 'w-full min-h-11 bg-surface-light border rounded-xl px-4 py-3 text-text-dark text-sm focus:outline-none focus:ring-1 transition-colors'
const ok = 'border-line focus:border-brand-accent focus:ring-brand-accent'
const bad = 'border-state-error focus:border-state-error focus:ring-state-error'

/**
 * Campo de formulário com erro no próprio campo.
 *
 * Um erro único no rodapé do formulário obriga o cliente a caçar qual dos nove
 * campos está errado; aqui a mensagem fica embaixo do campo e é amarrada a ele
 * por aria-describedby, então o leitor de tela a anuncia no foco.
 */
export default function Field({
  label, value, onChange, error, hint, type = 'text',
  numeric = false, children, className = '', ...rest
}) {
  const id = useId()
  const errorId = `${id}-erro`
  const hintId = `${id}-dica`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <label htmlFor={id} className="block type-label text-text-muted mb-2">{label}</label>
      {children ? (
        children({ id, className: `${base} ${error ? bad : ok}`, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy || undefined })
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} ${error ? bad : ok} ${numeric ? 'type-numeric' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />
      )}
      {hint && !error && <p id={hintId} className="mt-1.5 type-meta text-text-muted">{hint}</p>}
      {error && <p id={errorId} className="mt-1.5 type-meta text-state-error">{error}</p>}
    </div>
  )
}
