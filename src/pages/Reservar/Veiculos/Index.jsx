import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import { useReservation } from '../../../context/ReservationContext'
import { searchAvailability, ReservationApiError } from '../../../lib/api/reservation'
import Price from '../Price'

function diariasBetween(start, end) {
  const hours = (new Date(end) - new Date(start)) / 36e5
  return Number.isFinite(hours) && hours > 0 ? Math.ceil(hours / 24) : 0
}

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

function extractVehAvails(data) {
  try {
    return data.VehAvailRSCore.VehVendorAvails.flatMap(
      (v) => v.VehVendorAvail.VehAvails.map((a) => a.VehAvail)
    )
  } catch {
    return []
  }
}

export default function ReservarVeiculos() {
  const location = useLocation()
  const navigate = useNavigate()
  const { search, patch } = useReservation()

  const searchParams = location.state ?? search
  const [vehAvails, setVehAvails] = useState([])
  const [quoteId, setQuoteId] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!searchParams?.pickUpDateTime) {
      navigate('/reservar')
      return
    }

    patch({ search: searchParams })

    const payload = {
      VehAvailRQCore: {
        Status: 'Available',
        VehRentalCore: {
          PickUpDateTime: searchParams.pickUpDateTime,
          ReturnDateTime: searchParams.returnDateTime,
          PickUpLocation: { LocationCode: searchParams.pickupLocationCode, CodeContext: 'IATA' },
          ReturnLocation: { LocationCode: searchParams.returnLocationCode, CodeContext: 'IATA' },
        },
        RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
      },
    }

    searchAvailability(payload)
      .then((res) => {
        setVehAvails(extractVehAvails(res.data))
        setQuoteId(res.quoteId)
        setExpiresAt(res.expiresAt)
      })
      .catch((err) => {
        setError(err instanceof ReservationApiError ? err.errors.join(' ') : 'Não foi possível buscar veículos disponíveis.')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const diarias = diariasBetween(searchParams?.pickUpDateTime, searchParams?.returnDateTime)

  const handleSelect = (vehAvail) => {
    patch({ quote: { quoteId, expiresAt }, selectedVehicle: vehAvail })
    navigate('/reservar/extras')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <section className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <StepProgress current="veiculos" />

          <h1 className="type-title text-text-primary text-center mb-2">
            Escolha seu veículo
          </h1>
          {expiresAt && (
            <p className="type-meta text-text-secondary text-center mb-10">
              Preços válidos até{' '}
              <span className="type-numeric">
                {new Date(expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          )}

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" aria-live="polite" aria-busy="true">
              <span className="sr-only">Buscando veículos disponíveis</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="h-3 w-24 bg-white/10 rounded mb-4" />
                  <div className="h-5 w-40 bg-white/10 rounded mb-6" />
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="h-3 bg-white/10 rounded" />
                    ))}
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

          {!loading && !error && vehAvails.length === 0 && (
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

          {!loading && !error && vehAvails.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {vehAvails.map((vehAvail, i) => {
                const { Vehicle } = vehAvail.VehAvailCore
                const total = vehAvail.TotalCharge?.EstimatedTotalAmount
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="glass rounded-2xl p-6 flex flex-col"
                  >
                    <p className="type-label text-text-secondary mb-2">{Vehicle.VehType?.VehicleCategory}</p>
                    <h3 className="type-subtitle text-text-primary mb-5">
                      {Vehicle.VehMakeModel?.Name}
                    </h3>

                    <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-8 type-meta text-text-secondary">
                      <li className="flex items-center gap-2">
                        <SpecIcon path={ICON_PASSENGERS} />
                        {Vehicle.PassengerQuantity} pessoas
                      </li>
                      <li className="flex items-center gap-2">
                        <SpecIcon path={ICON_BAGGAGE} />
                        {Vehicle.BaggageQuantity} malas
                      </li>
                      <li className="flex items-center gap-2">
                        <SpecIcon path={ICON_TRANSMISSION} />
                        {Vehicle.TransmissionType}
                      </li>
                      <li className="flex items-center gap-2">
                        <SpecIcon path={ICON_AIR} />
                        {Vehicle.AirConditionInd === 'true' ? 'Ar-condicionado' : 'Sem ar'}
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <p className="type-label text-text-secondary mb-1">Total estimado</p>
                      <Price value={total} size="md" className="text-text-primary" />
                      {diarias > 0 && (
                        <p className="type-meta text-text-secondary mt-1 mb-5">
                          {diarias} {diarias === 1 ? 'diária' : 'diárias'}, já com taxas
                        </p>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(vehAvail)}
                        className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                      >
                        Selecionar {Vehicle.VehMakeModel?.Name}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
