import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import TripSummary from '../TripSummary'
import Dialog from '../Dialog'
import Price from '../Price'
import { useReservation } from '../../../context/ReservationContext'
import { computeTotals, diariasLabel } from '../lib/reservation'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const CARD = 'glass rounded-2xl p-5 text-left w-full transition-colors cursor-pointer'
const CARD_ON = '!border-brand-accent bg-brand-accent/10'

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5.5c0 4.2-2.9 8.1-7 9.5-4.1-1.4-7-5.3-7-9.5V6l7-3z" />
    </svg>
  )
}

export default function ReservarExtras() {
  const navigate = useNavigate()
  const { search, selectedVehicle: offer, extras, patch } = useReservation()

  const [coverageType, setCoverageType] = useState(extras?.coverageType ?? null)
  const [equipTypes, setEquipTypes] = useState(extras?.equipTypes ?? [])
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!offer) navigate('/reservar')
  }, [offer, navigate])

  const totals = useMemo(
    () => computeTotals({ offer, extras: { coverageType, equipTypes } }),
    [offer, coverageType, equipTypes],
  )

  if (!offer) return null

  const coverages = offer.coverages ?? []
  const equipments = offer.equipments ?? []
  const days = offer.days || 1

  const toggleEquip = (type) => {
    setEquipTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleContinue = () => {
    // A locadora não entrega carro sem proteção definida; o portal da JCompany
    // também exige a escolha antes de seguir.
    if (coverages.length > 0 && !coverageType) {
      setError('Escolha uma proteção para continuar.')
      return
    }
    setError('')
    patch({ extras: { coverageType, equipTypes } })
    navigate('/reservar/dados')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <StepProgress current="extras" />

          <h1 className="type-title text-text-primary text-center mb-8">Proteções e opcionais</h1>

          <TripSummary search={search} days={days} />

          <section className="glass rounded-2xl p-5 sm:p-6 mb-8" aria-label="Veículo escolhido">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="type-label text-text-secondary mb-1">Veículo escolhido</p>
                <p className="type-subtitle text-text-primary">{offer.groupName}</p>
                <p className="type-meta text-text-secondary mt-1">
                  {offer.transmission} · {offer.kmPolicy.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/reservar/veiculos')}
                className="type-meta text-text-primary underline underline-offset-4 hover:text-brand-glow transition-colors cursor-pointer py-3 -my-1.5"
              >
                Trocar de grupo
              </button>
            </div>
          </section>

          {coverages.length > 0 && (
            <section className="mb-10" aria-labelledby="titulo-protecoes">
              <h2 id="titulo-protecoes" className="type-subtitle text-text-primary mb-1">Proteção</h2>
              <p className="type-meta text-text-secondary mb-5">
                Obrigatória para retirar o veículo. Escolha uma das opções.
              </p>

              <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid sm:grid-cols-2 gap-4">
                {coverages.map((coverage) => {
                  const active = coverageType === coverage.type
                  return (
                    <motion.div key={coverage.type} variants={fadeInUp}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => { setCoverageType(coverage.type); setError('') }}
                        className={`${CARD} ${active ? CARD_ON : ''}`}
                      >
                        <span className="flex items-start gap-3">
                          <ShieldIcon />
                          <span className="min-w-0 flex-1">
                            <span className="block type-subtitle text-text-primary">{coverage.name}</span>
                            <span className="block type-meta text-text-secondary mt-1 line-clamp-2">
                              {coverage.description}
                            </span>
                          </span>
                        </span>
                        <span className="flex items-end justify-between gap-3 mt-4 pt-4 border-t border-white/10">
                          <span className="block">
                            {coverage.includedInRate ? (
                              <span className="type-meta text-brand-success">Inclusa na diária</span>
                            ) : (
                              <>
                                <Price value={coverage.amountPerDay} size="sm" suffix="/dia" className="text-text-primary" />
                                <span className="block type-meta text-text-secondary mt-1">
                                  {diariasLabel(days)} · <span className="type-numeric">{BRL.format(coverage.amountTotal)}</span>
                                </span>
                              </>
                            )}
                          </span>
                          <span
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              active ? 'border-brand-accent bg-brand-accent' : 'border-white/30'
                            }`}
                            aria-hidden="true"
                          >
                            {active && (
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetail(coverage)}
                        className="type-meta text-text-secondary hover:text-text-primary underline underline-offset-4 transition-colors cursor-pointer mt-1 py-3 -my-1"
                      >
                        O que esta proteção cobre
                      </button>
                    </motion.div>
                  )
                })}
              </motion.div>
            </section>
          )}

          <section className="mb-10" aria-labelledby="titulo-opcionais">
            <h2 id="titulo-opcionais" className="type-subtitle text-text-primary mb-1">Itens opcionais</h2>
            <p className="type-meta text-text-secondary mb-5">Adicione o que precisar. Pode ficar para depois.</p>

            {equipments.length === 0 ? (
              <p className="glass rounded-2xl p-5 type-meta text-text-secondary">
                Esta loja não oferece itens opcionais para o período escolhido.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {equipments.map((item) => {
                  const active = equipTypes.includes(item.type)
                  return (
                    <button
                      key={item.type}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleEquip(item.type)}
                      className={`${CARD} ${active ? CARD_ON : ''} flex items-center justify-between gap-4`}
                    >
                      <span className="min-w-0">
                        <span className="block type-subtitle text-text-primary text-base">{item.description}</span>
                        <span className="block type-meta text-text-secondary mt-1">
                          <span className="type-numeric">{BRL.format(item.amountPerDay)}</span> por dia ·{' '}
                          <span className="type-numeric">{BRL.format(item.amountTotal)}</span> no período
                        </span>
                      </span>
                      <span
                        className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                          active ? 'border-brand-accent bg-brand-accent' : 'border-white/30'
                        }`}
                        aria-hidden="true"
                      >
                        {active && (
                          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="glass rounded-2xl p-5 sm:p-6" aria-label="Total parcial">
            <ul className="space-y-2.5 mb-4">
              <li className="flex justify-between gap-4 type-meta text-text-secondary">
                <span>{offer.groupName} · {diariasLabel(days)}</span>
                <span className="type-numeric text-text-primary">{BRL.format(totals.base)}</span>
              </li>
              {totals.coverageItem && (
                <li className="flex justify-between gap-4 type-meta text-text-secondary">
                  <span>Proteção {totals.coverageItem.name}</span>
                  <span className="type-numeric text-text-primary">
                    {totals.coverageItem.includedInRate ? 'Inclusa' : BRL.format(totals.coverage)}
                  </span>
                </li>
              )}
              {totals.equipmentItems.map((item) => (
                <li key={item.type} className="flex justify-between gap-4 type-meta text-text-secondary">
                  <span>{item.description}</span>
                  <span className="type-numeric text-text-primary">{BRL.format(item.amountTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-end justify-between gap-4 pt-4 border-t border-white/10" aria-live="polite">
              <span className="type-subtitle text-text-primary">Total</span>
              <Price value={totals.total} size="md" className="text-text-primary" />
            </div>
          </section>

          {error && (
            <p className="mt-5 type-meta text-state-error-dark text-center" role="alert">{error}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate('/reservar/veiculos')}
              className="sm:w-auto px-6 py-4 rounded-xl border border-white/15 text-text-secondary hover:text-text-primary hover:border-white/25 transition-colors cursor-pointer type-meta"
            >
              Voltar
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-brand-accent hover:bg-brand-glow text-white font-bold text-base py-4 rounded-xl transition-colors cursor-pointer"
            >
              Continuar para seus dados
            </motion.button>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Proteção ${detail.name}` : ''}>
        {detail && (
          <>
            <p className="type-body text-text-muted text-sm whitespace-pre-line">{detail.description}</p>
            <div className="flex justify-between items-baseline gap-3 mt-6 pt-4 border-t border-line">
              <span className="type-meta text-text-muted">
                {detail.includedInRate ? 'Inclusa na diária' : `${diariasLabel(days)} de proteção`}
              </span>
              {!detail.includedInRate && <Price value={detail.amountTotal} size="sm" className="text-text-dark" />}
            </div>
          </>
        )}
      </Dialog>
    </div>
  )
}
