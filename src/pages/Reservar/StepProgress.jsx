const STEPS = [
  { key: 'veiculos', label: 'Veículo' },
  { key: 'extras', label: 'Extras' },
  { key: 'dados', label: 'Seus Dados' },
  { key: 'confirmacao', label: 'Confirmação' },
]

export default function StepProgress({ current }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 sm:mb-14">
      {STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                  active
                    ? 'bg-brand-accent text-white shadow-glow'
                    : done
                    ? 'bg-brand-success text-white'
                    : 'bg-white/10 text-text-secondary'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 sm:w-16 h-0.5 mb-5 ${done ? 'bg-brand-success' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
