import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import TripSummary from '../TripSummary'
import VehicleArt from '../VehicleArt'
import Dialog from '../Dialog'
import Price from '../Price'
import { useReservation } from '../../../context/ReservationContext'
import { searchAvailability, ReservationApiError } from '../../../lib/api/reservation'
import { buildAvailabilityPayload, diariasLabel } from '../lib/reservation'

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function SpecIcon({ path }) {
  return (
    <svg className="w-4 h-4 shrink-0 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

const ICON_PASSENGERS = 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
const ICON_BAGGAGE = 'M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 0h10a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z'
const ICON_TRANSMISSION = 'M12 6v12m0-12L8 9m4-3l4 3M6 9v6a2 2 0 002 2h8a2 2 0 002-2V9'
const ICON_AIR = 'M12 3v18M3 12h18M6.5 6.5l11 11M17.5 6.5l-11 11'
const ICON_ROAD = 'M12 3v4m0 4v2m0 4v4M5 21l2-18M19 21l-2-18'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`type-meta px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
        active
          ? 'border-brand-accent bg-brand-accent/15 text-text-primary'
          : 'border-white/15 bg-white/5 text-text-secondary hover:text-text-primary hover:border-white/25'
      }`}
    >
      {children}
    </button>
  )
}

/* A quote tem prazo. Exibir o horário e não fazer nada com ele deixa o cliente
   levar um preço vencido para a etapa seguinte. */
function useQuoteCountdown(expiresAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [expiresAt])

  if (!expiresAt) return { expired: false, label: null }

  const remaining = new Date(expiresAt).getTime() - now
  if (remaining <= 0) return { expired: true, label: null }

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return { expired: false, label: `${minutes}:${String(seconds).padStart(2, '0')}` }
}

export default function ReservarVeiculos() {
  const location = useLocation()
  const navigate = useNavigate()
  const { search, patch } = useReservation()

  const searchParams = location.state ?? search

  const [offers, setOffers] = useState([])
  const [quote, setQuote] = useState({ quoteId: null, expiresAt: null })
  const [days, setDays] = useState(0)
  const [demo, setDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)

  const [onlyAutomatic, setOnlyAutomatic] = useState(false)
  const [onlyAir, setOnlyAir] = useState(false)
  const [minPassengers, setMinPassengers] = useState(0)

  const { expired, label: countdown } = useQuoteCountdown(quote.expiresAt)

  // Uma chave do período: muda a busca, refaz a chamada. Sem isso a etapa 1
  // ficava presa no primeiro resultado mesmo com datas novas.
  const searchKey = searchParams
    ? `${searchParams.pickupLocationCode}|${searchParams.returnLocationCode}|${searchParams.pickUpDateTime}|${searchParams.returnDateTime}|${searchParams.scenario ?? ''}`
    : null

  useEffect(() => {
    if (!searchParams?.pickUpDateTime) {
      navigate('/reservar')
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')

    searchAvailability(buildAvailabilityPayload(searchParams), searchParams.scenario)
      .then((res) => {
        if (!active) return
        setOffers(res.data.offers ?? [])
        setDays(res.data.days ?? 0)
        setQuote({ quoteId: res.data.quoteId, expiresAt: res.data.expiresAt })
        setDemo(Boolean(res.demo))
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof ReservationApiError ? err.errors.join(' ') : 'Não foi possível buscar veículos disponíveis.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
    // searchKey resume os parâmetros; searchParams é objeto novo a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey])

  // Espelha a busca no contexto para sobreviver ao refresh desta etapa.
  useEffect(() => {
    if (searchParams?.pickUpDateTime && !search?.pickUpDateTime) patch({ search: searchParams })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey])

  const visible = useMemo(() => offers.filter((offer) => {
    if (onlyAutomatic && !/autom/i.test(offer.transmission)) return false
    if (onlyAir && !offer.airCondition) return false
    if (minPassengers && offer.passengers < minPassengers) return false
    return true
  }), [offers, onlyAutomatic, onlyAir, minPassengers])

  const handleSelect = useCallback((offer) => {
    patch({ quote, selectedVehicle: offer, extras: null, confirmation: null })
    navigate('/reservar/extras')
  }, [navigate, patch, quote])

  const clearFilters = () => {
    setOnlyAutomatic(false)
    setOnlyAir(false)
    setMinPassengers(0)
  }

  const filtersOn = onlyAutomatic || onlyAir || minPassengers > 0

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <StepProgress current="veiculos" />

          <h1 className="type-title text-text-primary text-center mb-8">Escolha seu veículo</h1>

          <TripSummary search={searchParams} days={days} />

          {demo && !loading && !error && (
            <p className="max-w-6xl mx-auto mb-6 type-meta text-text-secondary text-center">
              Valores de demonstração enquanto a integração com o sistema da loja é liberada.
            </p>
          )}

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" aria-live="polite" aria-busy="true">
              <span className="sr-only">Buscando veículos disponíveis</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="h-3 w-24 bg-white/10 rounded mb-4" />
                  <div className="h-5 w-40 bg-white/10 rounded mb-5" />
                  <div className="h-20 bg-white/10 rounded-xl mb-5" />
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[0, 1, 2, 3].map((j) => <div key={j} className="h-3 bg-white/10 rounded" />)}
                  </div>
                  <div className="h-8 w-32 bg-white/10 rounded mb-4" />
                  <div className="h-12 bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="glass rounded-2xl max-w-md mx-auto p-8 text-center" role="alert">
              <p className="type-subtitle text-text-primary mb-2">Não foi possível buscar os veículos</p>
              <p className="type-meta text-text-secondary mb-6">{error}</p>
              <button
                onClick={() => navigate('/reservar')}
                className="bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Refazer a busca
              </button>
            </div>
          )}

          {!loading && !error && expired && (
            <div className="glass rounded-2xl max-w-md mx-auto p-8 text-center" role="alert">
              <p className="type-subtitle text-text-primary mb-2">Os preços desta busca expiraram</p>
              <p className="type-meta text-text-secondary mb-6">
                A cotação vale por tempo limitado. Refaça a busca para ver os valores atualizados.
              </p>
              <button
                onClick={() => navigate('/reservar')}
                className="bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Buscar de novo
              </button>
            </div>
          )}

          {!loading && !error && !expired && offers.length === 0 && (
            <div className="glass rounded-2xl max-w-md mx-auto p-8 text-center">
              <p className="type-subtitle text-text-primary mb-2">Nenhum veículo para este período</p>
              <p className="type-meta text-text-secondary mb-6">
                Tente ampliar as datas ou escolher outra loja de retirada.
              </p>
              <button
                onClick={() => navigate('/reservar')}
                className="bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Alterar busca
              </button>
            </div>
          )}

          {!loading && !error && !expired && offers.length > 0 && (
            <>
              <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center gap-2.5">
                <Chip active={onlyAutomatic} onClick={() => setOnlyAutomatic((v) => !v)}>Automático</Chip>
                <Chip active={onlyAir} onClick={() => setOnlyAir((v) => !v)}>Ar-condicionado</Chip>
                <Chip active={minPassengers === 5} onClick={() => setMinPassengers((v) => (v === 5 ? 0 : 5))}>5 lugares</Chip>
                {filtersOn && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="type-meta text-text-secondary underline underline-offset-4 hover:text-text-primary transition-colors cursor-pointer px-2 py-3"
                  >
                    Limpar filtros
                  </button>
                )}
                <p className="type-meta text-text-secondary ml-auto" aria-live="polite">
                  <span className="type-numeric">{visible.length}</span>
                  {visible.length === 1 ? ' grupo disponível' : ' grupos disponíveis'}
                  {countdown && (
                    <>
                      {' · preços por mais '}
                      <span className="type-numeric">{countdown}</span>
                    </>
                  )}
                </p>
              </div>

              {visible.length === 0 ? (
                <div className="glass rounded-2xl max-w-md mx-auto p-8 text-center">
                  <p className="type-subtitle text-text-primary mb-2">Nenhum grupo com esses filtros</p>
                  <p className="type-meta text-text-secondary mb-6">
                    Há {offers.length} grupos disponíveis no período — os filtros escolhidos deixaram todos de fora.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors duration-300 cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                >
                  {visible.map((offer) => (
                    <motion.article key={offer.id} variants={fadeInUp} className="glass rounded-2xl p-6 flex flex-col">
                      <p className="type-label text-text-secondary mb-2">{offer.category || 'Grupo'}</p>
                      <h2 className="type-subtitle text-text-primary mb-4">{offer.groupName}</h2>

                      <div className="text-text-primary/80 mb-4 px-2">
                        <VehicleArt offer={offer} />
                      </div>

                      <p className="type-meta text-text-secondary mb-5">{offer.description}</p>

                      <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-6 type-meta text-text-secondary">
                        <li className="flex items-center gap-2">
                          <SpecIcon path={ICON_PASSENGERS} />
                          {offer.passengers} pessoas
                        </li>
                        <li className="flex items-center gap-2">
                          <SpecIcon path={ICON_BAGGAGE} />
                          {offer.baggage} malas
                        </li>
                        <li className="flex items-center gap-2">
                          <SpecIcon path={ICON_TRANSMISSION} />
                          {offer.transmission}
                        </li>
                        <li className="flex items-center gap-2">
                          <SpecIcon path={ICON_AIR} />
                          {offer.airCondition ? 'Ar-condicionado' : 'Sem ar'}
                        </li>
                        <li className="flex items-center gap-2 col-span-2">
                          <SpecIcon path={ICON_ROAD} />
                          {offer.kmPolicy.label}
                        </li>
                      </ul>

                      <div className="mt-auto">
                        <button
                          type="button"
                          onClick={() => setDetails(offer)}
                          className="type-meta text-text-primary underline underline-offset-4 hover:text-brand-glow transition-colors cursor-pointer mb-4 py-3 -my-1.5 block"
                        >
                          Ver detalhes e composição do valor
                        </button>

                        <p className="type-label text-text-secondary mb-1">Total do período</p>
                        <Price value={offer.totals.estimated} size="md" className="text-text-primary" />
                        {days > 0 && (
                          <p className="type-meta text-text-secondary mt-1 mb-5">
                            {diariasLabel(days)} · <span className="type-numeric">{BRL.format(offer.dailyRate)}</span> por dia
                          </p>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelect(offer)}
                          className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                        >
                          Escolher {offer.groupName}
                        </motion.button>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}

              <p className="max-w-6xl mx-auto mt-8 type-meta text-text-secondary text-center">
                A reserva é feita por grupo de veículos, não por modelo específico. O carro entregue
                pertence ao grupo escolhido.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />

      <Dialog
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title={details ? `${details.groupName} · detalhes` : ''}
        footer={details && (
          <button
            type="button"
            onClick={() => { const chosen = details; setDetails(null); handleSelect(chosen) }}
            className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
          >
            Escolher este grupo
          </button>
        )}
      >
        {details && <OfferDetails offer={details} days={days} />}
      </Dialog>
    </div>
  )
}

function OfferDetails({ offer, days }) {
  const specs = [
    ['Passageiros', `${offer.passengers}`],
    ['Portas', offer.doors ? `${offer.doors}` : '—'],
    ['Transmissão', offer.transmission || '—'],
    ['Ar-condicionado', offer.airCondition ? 'Sim' : 'Não'],
    ['Bagagem', `${offer.baggage} malas`],
    ['Quilometragem', offer.kmPolicy.label],
  ]

  return (
    <>
      <p className="type-body text-text-muted text-sm mb-6">{offer.description}</p>

      <h3 className="type-label text-text-muted mb-3">Características incluídas</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-8">
        {specs.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-line-soft pb-2">
            <dt className="type-meta text-text-muted">{label}</dt>
            <dd className="type-meta text-text-dark type-numeric">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="type-label text-text-muted mb-3">Composição do valor</h3>
      <ul className="space-y-2.5 mb-6">
        {offer.charges.map((charge) => (
          <li key={charge.purposeCode + charge.description}>
            <div className="flex justify-between gap-3">
              <span className="type-meta text-text-dark">{charge.description}</span>
              <span className="type-meta type-numeric text-text-dark">{BRL.format(charge.amount)}</span>
            </div>
            {charge.quantity != null && charge.unitCharge != null && (
              <p className="type-meta text-text-muted">
                <span className="type-numeric">{charge.quantity}</span>
                {' × '}
                <span className="type-numeric">{BRL.format(charge.unitCharge)}</span>
              </p>
            )}
            {charge.taxes.map((tax) => (
              <p key={tax.description} className="type-meta text-text-muted">
                {tax.description}: <span className="type-numeric">{BRL.format(tax.total)}</span>
                {tax.extraDescription ? ` — ${tax.extraDescription}` : ''}
              </p>
            ))}
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-baseline gap-3 pt-4 border-t border-line">
        <span className="type-subtitle text-text-dark">Total de {diariasLabel(days)}</span>
        <Price value={offer.totals.estimated} size="sm" className="text-text-dark" />
      </div>

      <p className="type-meta text-text-muted mt-4">
        Proteções e itens opcionais são escolhidos na próxima etapa e somam ao total.
      </p>
    </>
  )
}
