import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import { useReservation } from '../../../context/ReservationContext'
import Price from '../Price'

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

          <h1 className="type-title text-text-primary text-center mb-10">
            Proteja sua viagem
          </h1>

          {coverages.length > 0 && (
            <div className="mb-10">
              <h2 className="type-subtitle text-text-primary mb-4">Cobertura</h2>
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
                      <p className="type-subtitle text-text-primary mb-1">{cov.Coverage.Details?.Value}</p>
                      <p className="type-meta text-text-secondary mb-3">{cov.Coverage.Details?.Description}</p>
                      {included ? (
                        <p className="type-label text-brand-success">Incluso</p>
                      ) : (
                        <p className="flex items-baseline gap-1 text-text-primary">
                          <span aria-hidden="true" className="text-text-secondary">+</span>
                          <Price value={cov.Charge.Amount} size="sm" />
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {equipments.length > 0 && (
            <div className="mb-10">
              <h2 className="type-subtitle text-text-primary mb-4">Equipamentos e serviços</h2>
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
                      <span className="type-body text-text-primary">{e.Equipment.Description}</span>
                      <span className="flex items-baseline gap-1 whitespace-nowrap text-text-primary">
                        <span aria-hidden="true" className="text-text-secondary">+</span>
                        <Price value={e.Charge.Amount} size="sm" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6 flex items-center justify-between gap-4 mb-8">
            <span className="type-label text-text-secondary">Total estimado</span>
            <span aria-live="polite" className="text-text-primary">
              <Price value={baseTotal + extrasTotal} size="md" />
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
