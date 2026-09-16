import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import { useReservation } from '../../../context/ReservationContext'
import { searchAvailability, ReservationApiError } from '../../../lib/api/reservation'

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

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

          <h1 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-2 tracking-tight">
            Escolha seu <span className="text-gradient">veículo</span>
          </h1>
          {expiresAt && (
            <p className="text-text-secondary text-xs text-center mb-10">
              Preços válidos até {new Date(expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          {loading && (
            <p className="text-text-secondary text-center py-20">Buscando veículos disponíveis...</p>
          )}

          {!loading && error && (
            <p className="text-red-400 text-center py-20">{error}</p>
          )}

          {!loading && !error && vehAvails.length === 0 && (
            <p className="text-text-secondary text-center py-20">Nenhum veículo disponível para o período selecionado.</p>
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
                    className="glass rounded-3xl p-6 shadow-card border border-white/10 flex flex-col"
                  >
                    <span className="text-brand-accent text-xs font-black uppercase tracking-wider mb-1">
                      {Vehicle.VehType?.VehicleCategory}
                    </span>
                    <h3 className="text-text-primary text-lg font-bold mb-4">{Vehicle.VehMakeModel?.Name}</h3>

                    <div className="grid grid-cols-2 gap-2 mb-6 text-text-secondary text-xs">
                      <span>🧑 {Vehicle.PassengerQuantity} pessoas</span>
                      <span>🧳 {Vehicle.BaggageQuantity} malas</span>
                      <span>⚙️ {Vehicle.TransmissionType}</span>
                      <span>❄️ {Vehicle.AirConditionInd === 'true' ? 'Ar-condicionado' : 'Sem ar'}</span>
                    </div>

                    <div className="mt-auto">
                      <p className="text-text-secondary text-xs mb-1">Total estimado</p>
                      <p className="text-text-primary text-2xl font-black mb-4">{formatBRL(total)}</p>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect(vehAvail)}
                        className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm py-3.5 rounded-full shadow-glow transition-all duration-300 cursor-pointer"
                      >
                        Selecionar
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
