/* Quatro etapas até a reserva nascer. A tela de confirmação fica fora daqui:
   quando ela aparece a reserva já existe, e um passo "atual" depois do fim
   sugeriria que ainda falta alguma coisa. */
const STEPS = [
  { key: 'veiculos', label: 'Veículo' },
  { key: 'extras', label: 'Opcionais' },
  { key: 'dados', label: 'Seus Dados' },
  { key: 'revisao', label: 'Revisão' },
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
    <div className="mb-10 sm:mb-14">
      <ol className="flex items-start justify-center gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <li key={step.key} className="flex items-start gap-1 sm:gap-2">
              <div className="flex flex-col items-center gap-2 w-11 sm:w-20">
                <span
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold type-numeric transition-colors ${
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
                {/* No celular quatro rótulos em caixa alta não cabem lado a lado:
                    a linha vira dígitos e o nome da etapa atual vai abaixo. */}
                <span
                  className={`hidden sm:block type-label text-center ${
                    active ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {step.label}
                </span>
                <span className="sr-only">
                  {step.label}: {done ? 'etapa concluída' : active ? 'etapa atual' : 'etapa pendente'}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={`w-5 sm:w-10 h-0.5 mt-[18px] sm:mt-5 ${done ? 'bg-brand-success' : 'bg-white/10'}`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>

      <p className="sm:hidden type-label text-text-primary text-center mt-4" aria-hidden="true">
        <span className="type-numeric text-text-secondary">
          {currentIndex + 1}/{STEPS.length}
        </span>
        {' · '}
        {STEPS[currentIndex]?.label}
      </p>
    </div>
  )
}
