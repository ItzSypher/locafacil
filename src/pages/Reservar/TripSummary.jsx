import { Link } from 'react-router-dom'
import { formatDate, formatTime, diariasLabel } from './lib/reservation'

function PinIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function Leg({ label, locationName, dateTime }) {
  return (
    <div className="min-w-0">
      <p className="type-label text-text-secondary mb-1.5">{label}</p>
      <p className="flex items-start gap-2 type-body text-text-primary text-sm">
        <PinIcon />
        <span className="truncate">{locationName || 'Loja Locafacil'}</span>
      </p>
      <p className="type-meta text-text-secondary mt-1 pl-6">
        <span className="type-numeric">{formatDate(dateTime)}</span>
        {' às '}
        <span className="type-numeric">{formatTime(dateTime)}</span>
      </p>
    </div>
  )
}

/**
 * O que o cliente pediu, visível em todas as etapas. Sem isso o período e a
 * loja somem da tela depois da busca, e ele precisa voltar para conferir.
 */
export default function TripSummary({ search, days, editable = true }) {
  if (!search?.pickUpDateTime) return null

  return (
    <section className="glass rounded-2xl p-5 sm:p-6 max-w-6xl mx-auto mb-8" aria-label="Resumo da sua busca">
      <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
        <Leg label="Retirada" locationName={search.pickupLocationName} dateTime={search.pickUpDateTime} />
        <Leg label="Devolução" locationName={search.returnLocationName} dateTime={search.returnDateTime} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10">
        {days > 0 && (
          <p className="type-meta text-text-secondary">
            Período de <span className="type-numeric text-text-primary">{diariasLabel(days)}</span>
          </p>
        )}
        {editable && (
          <Link
            to="/reservar"
            className="type-meta text-text-primary underline underline-offset-4 hover:text-brand-glow transition-colors py-3 -my-1.5"
          >
            Alterar datas ou loja
          </Link>
        )}
      </div>
    </section>
  )
}
