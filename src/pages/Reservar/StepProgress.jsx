const STEPS = [
  { key: 'veiculos', label: 'Veículo' },
  { key: 'extras', label: 'Extras' },
  { key: 'dados', label: 'Seus Dados' },
  { key: 'confirmacao', label: 'Confirmação' },
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function StepProgress({ current }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)

  return (
    <ol className="flex items-start justify-center gap-1 sm:gap-2 mb-10 sm:mb-14">
      {STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <li key={step.key} className="flex items-start gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-2 w-16 sm:w-20">
              <span
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  active
                    ? 'bg-brand-accent text-white'
                    : done
                    ? 'bg-brand-success text-white'
                    : 'bg-white/10 text-text-secondary'
                }`}
                aria-hidden="true"
              >
                {done ? <CheckIcon /> : i + 1}
              </span>
              <span className={`text-xs text-center leading-tight ${active ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                {step.label}
              </span>
              <span className="sr-only">
                {done ? 'Etapa concluída' : active ? 'Etapa atual' : 'Etapa pendente'}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`w-4 sm:w-10 h-0.5 mt-[18px] sm:mt-5 ${done ? 'bg-brand-success' : 'bg-white/10'}`} aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
