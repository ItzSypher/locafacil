import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import { useReservation } from '../../../context/ReservationContext'

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

export default function ReservarExtras() {
  const navigate = useNavigate()
  const { selectedVehicle, extras, patch } = useReservation()

  const [selectedCoverage, setSelectedCoverage] = useState(extras?.coverageType ?? null)
  const [selectedEquip, setSelectedEquip] = useState(extras?.equipTypes ?? [])

  useEffect(() => {
    if (!selectedVehicle) {
      navigate('/reservar')
    }
  }, [selectedVehicle, navigate])

  const coverages = useMemo(() => selectedVehicle?.VehAvailInfo?.PricedCoverages ?? [], [selectedVehicle])
  const equipments = useMemo(() => selectedVehicle?.VehAvailCore?.PricedEquips ?? [], [selectedVehicle])
  const baseTotal = Number(selectedVehicle?.TotalCharge?.EstimatedTotalAmount) || 0

  const extrasTotal = useMemo(() => {
    let total = 0
    const cov = coverages.find((c) => c.PricedCoverage.Coverage.CoverageType === selectedCoverage)
    if (cov && cov.PricedCoverage.Charge.IncludedInRate !== 'true') {
      total += Number(cov.PricedCoverage.Charge.Amount) || 0
    }
    equipments.forEach((e) => {
      if (selectedEquip.includes(e.Equipment.EquipType)) {
        total += Number(e.Charge.Amount) || 0
      }
    })
    return total
  }, [coverages, equipments, selectedCoverage, selectedEquip])

  const toggleEquip = (type) => {
    setSelectedEquip((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleContinue = () => {
    patch({
      extras: { coverageType: selectedCoverage, equipTypes: selectedEquip },
    })
    navigate('/reservar/dados')
  }

  if (!selectedVehicle) return null

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <section className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <StepProgress current="extras" />

          <h1 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-10 tracking-tight">
            Proteja sua viagem
          </h1>

          {coverages.length > 0 && (
            <div className="mb-10">
              <h2 className="text-text-primary text-lg font-black tracking-tight mb-4">Cobertura</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {coverages.map((c, i) => {
                  const cov = c.PricedCoverage
                  const active = selectedCoverage === cov.Coverage.CoverageType
                  const included = cov.Charge.IncludedInRate === 'true'
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setSelectedCoverage(cov.Coverage.CoverageType)}
                      aria-pressed={active}
                      className={`text-left glass rounded-2xl p-5 cursor-pointer transition-colors ${
                        active ? '!border-brand-accent bg-brand-accent/10' : 'hover:bg-white/[0.12]'
                      }`}
                    >
                      <p className="text-text-primary font-bold mb-1">{cov.Coverage.Details?.Value}</p>
                      <p className="text-text-secondary text-sm mb-3">{cov.Coverage.Details?.Description}</p>
                      <p className="text-text-primary font-bold text-sm">
                        {included ? 'Incluso' : `+ ${formatBRL(cov.Charge.Amount)}`}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {equipments.length > 0 && (
            <div className="mb-10">
              <h2 className="text-text-primary text-lg font-black tracking-tight mb-4">Equipamentos e serviços</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {equipments.map((e, i) => {
                  const active = selectedEquip.includes(e.Equipment.EquipType)
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => toggleEquip(e.Equipment.EquipType)}
                      aria-pressed={active}
                      className={`text-left glass rounded-2xl p-5 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                        active ? '!border-brand-accent bg-brand-accent/10' : 'hover:bg-white/[0.12]'
                      }`}
                    >
                      <span className="text-text-primary font-medium text-sm">{e.Equipment.Description}</span>
                      <span className="text-text-primary font-bold text-sm whitespace-nowrap">+ {formatBRL(e.Charge.Amount)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6 flex items-center justify-between mb-8">
            <span className="text-text-secondary text-sm">Total estimado</span>
            <span className="text-text-primary text-2xl font-black tracking-tight" aria-live="polite">
              {formatBRL(baseTotal + extrasTotal)}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold py-4 rounded-xl transition-colors duration-300 cursor-pointer"
          >
            Continuar para seus dados
          </motion.button>
        </div>
      </section>
      <Footer />
    </div>
  )
}
