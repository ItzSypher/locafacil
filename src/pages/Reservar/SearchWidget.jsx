import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getLocations, getMinimumNotice, getMinimumPeriod } from '../../lib/api/reservation'

const selectClass = 'w-full bg-white/10 border border-white/15 rounded-xl px-5 py-4 pl-12 text-text-primary text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none cursor-pointer'
const inputClass = 'w-full bg-white/10 border border-white/15 rounded-xl px-5 py-4 pl-12 text-text-primary text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all cursor-pointer'

function LocationIcon() {
  return (
    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function DateIcon() {
  return (
    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export default function SearchWidget() {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [pickupLocation, setPickupLocation] = useState('')
  const [returnLocation, setReturnLocation] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [minNoticeHours, setMinNoticeHours] = useState(24)
  const [minPeriodHours, setMinPeriodHours] = useState(24)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getLocations()
      .then((res) => setLocations(res.data ?? []))
      .catch(() => setError('Não foi possível carregar os locais disponíveis. Tente novamente em instantes.'))
      .finally(() => setLoadingLocations(false))
  }, [])

  useEffect(() => {
    if (!pickupLocation) return
    getMinimumNotice(pickupLocation)
      .then((res) => setMinNoticeHours(res.data?.antecedencia_minima ?? 24))
      .catch(() => {})
    getMinimumPeriod(pickupLocation)
      .then((res) => setMinPeriodHours(res.data?.periodo_minimo_horas ?? 24))
      .catch(() => {})
  }, [pickupLocation])

  const minPickupDate = todayISODate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!pickupLocation || !pickupDate || !returnDate) {
      setError('Preencha local de retirada e as datas para buscar.')
      return
    }

    const pickUpDateTime = `${pickupDate}T08:00:00`
    const returnDateTime = `${returnDate}T18:00:00`
    const pickup = new Date(pickUpDateTime)
    const ret = new Date(returnDateTime)
    const now = new Date()

    const hoursUntilPickup = (pickup - now) / (1000 * 60 * 60)
    if (hoursUntilPickup < minNoticeHours) {
      setError(`É preciso reservar com pelo menos ${minNoticeHours}h de antecedência.`)
      return
    }

    const rentalHours = (ret - pickup) / (1000 * 60 * 60)
    if (rentalHours < minPeriodHours) {
      setError(`O período mínimo de locação é de ${minPeriodHours}h.`)
      return
    }

    setSubmitting(true)
    navigate('/reservar/veiculos', {
      state: {
        pickupLocationCode: pickupLocation,
        returnLocationCode: returnLocation || pickupLocation,
        pickUpDateTime,
        returnDateTime,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-glass max-w-5xl mx-auto border border-white/10 backdrop-blur-md bg-white/5">
      <h3 className="text-text-primary text-xl sm:text-2xl font-bold mb-8 text-center uppercase tracking-wide">
        Encontre o veículo perfeito em segundos
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Local de Retirada</label>
          <div className="relative">
            <LocationIcon />
            <select
              className={selectClass}
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              disabled={loadingLocations}
              required
            >
              <option value="" disabled className="bg-brand-dark">{loadingLocations ? 'Carregando...' : 'Selecione'}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.code} className="bg-brand-dark">{loc.descricao}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Local de Devolução</label>
          <div className="relative">
            <LocationIcon />
            <select
              className={selectClass}
              value={returnLocation}
              onChange={(e) => setReturnLocation(e.target.value)}
              disabled={loadingLocations}
            >
              <option value="" className="bg-brand-dark">Mesmo local</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.code} className="bg-brand-dark">{loc.descricao}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Data de Retirada</label>
          <div className="relative">
            <DateIcon />
            <input
              type="date"
              className={inputClass}
              min={minPickupDate}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Data de Devolução</label>
          <div className="relative">
            <DateIcon />
            <input
              type="date"
              className={inputClass}
              min={pickupDate || minPickupDate}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
      )}

      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)' }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={submitting}
        className="w-full mt-6 bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm sm:text-base py-4 rounded-xl shadow-glow transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {submitting ? 'Buscando...' : 'Buscar Veículo'}
      </motion.button>
    </form>
  )
}
