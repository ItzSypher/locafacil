import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getLocations, getMinimumNotice, getMinimumPeriod, getStoreHours } from '../../lib/api/reservation'
import { useOptionalReservation } from '../../context/ReservationContext'

/* O campo de data e o de hora NÃO carregam o ícone decorativo à esquerda.
   Com `pl-12`, os 48px do ícone comiam metade de um campo de 88px: abaixo de
   1024px sobravam 18px de espaço útil e "Hora" saía cortado pela metade. O
   rótulo acima do par já diz Retirada ou Devolução; o ícone repetia isso
   ocupando o lugar do valor. */
const fieldBase = 'w-full bg-white/10 border border-white/15 rounded-xl py-4 text-text-primary text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all'
const comIcone = `${fieldBase} pl-12 pr-10`
const compacto = `${fieldBase} px-3.5`

const selectClass = `${comIcone} appearance-none cursor-pointer`
const selectCompacto = `${compacto} pr-9 appearance-none cursor-pointer`
const inputClass = `${compacto} cursor-pointer`
const invalidClass = '!border-state-error-dark'

/* `appearance-none` apaga a setinha nativa do select. Sem repô-la, o campo
   lê como caixa de texto e ninguém descobre que dá para abrir. */
function Chevron() {
  return (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

/* Datas do formulário são locais, não UTC: `new Date('2026-10-05')` cai no dia
   anterior em fuso negativo. Tudo aqui trabalha com 'YYYY-MM-DD' + 'HH:MM'. */
function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function weekdayOf(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function toLocalDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

const DEV = import.meta.env.DEV

const SCENARIOS = [
  { id: '', label: 'Disponibilidade normal' },
  { id: 'um-carro', label: 'Um único grupo' },
  { id: 'com-opcionais', label: 'Com itens opcionais' },
  { id: 'vazio', label: 'Sem veículos' },
  { id: 'erro-422', label: 'Erro da API' },
  { id: 'lento', label: 'Resposta lenta' },
  { id: 'mojibake', label: 'Encoding quebrado' },
  { id: 'expirado', label: 'Quote expirada' },
]

export default function SearchWidget() {
  const navigate = useNavigate()
  const { patch, search: savedSearch } = useOptionalReservation()

  const [locations, setLocations] = useState([])
  const [pickupLocation, setPickupLocation] = useState('')
  const [returnLocation, setReturnLocation] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')
  const [hours, setHours] = useState(null)
  const [minNoticeHours, setMinNoticeHours] = useState(48)
  const [minPeriodHours, setMinPeriodHours] = useState(48)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [scenario, setScenario] = useState('')

  useEffect(() => {
    getLocations()
      .then((res) => {
        const list = res.data ?? []
        setLocations(list)
        // Loja única: não faz o cliente escolher o que não tem alternativa.
        if (list.length === 1) setPickupLocation(list[0].code)
      })
      .catch(() => setError('Não foi possível carregar os locais disponíveis. Tente novamente em instantes.'))
      .finally(() => setLoadingLocations(false))
  }, [])

  useEffect(() => {
    if (!pickupLocation) return
    getStoreHours(pickupLocation)
      .then((res) => {
        setHours(res.data)
        if (res.data?.antecedenciaMinimaHoras) setMinNoticeHours(res.data.antecedenciaMinimaHoras)
      })
      .catch(() => setHours(null))
    getMinimumNotice(pickupLocation)
      .then((res) => setMinNoticeHours(res.data?.antecedencia_minima ?? 48))
      .catch(() => {})
    getMinimumPeriod(pickupLocation)
      .then((res) => setMinPeriodHours(res.data?.periodo_minimo_horas ?? 48))
      .catch(() => {})
  }, [pickupLocation])

  // Primeira data aceitável: hoje + antecedência mínima.
  const minPickupDate = useMemo(() => isoDate(addHours(new Date(), minNoticeHours)), [minNoticeHours])

  const pickupSlots = useMemo(() => slotsFor(hours, pickupDate), [hours, pickupDate])
  const returnSlots = useMemo(() => slotsFor(hours, returnDate), [hours, returnDate])

  const pickupClosed = isClosed(hours, pickupDate)
  const returnClosed = isClosed(hours, returnDate)

  // O horário escolhido pode deixar de existir quando a data muda (sábado
  // fecha mais cedo). Some em silêncio em vez de viajar inválido.
  useEffect(() => {
    if (pickupTime && pickupSlots.length > 0 && !pickupSlots.includes(pickupTime)) setPickupTime('')
  }, [pickupSlots, pickupTime])

  useEffect(() => {
    if (returnTime && returnSlots.length > 0 && !returnSlots.includes(returnTime)) setReturnTime('')
  }, [returnSlots, returnTime])

  // Volta da etapa 1: repõe o que o cliente já tinha digitado.
  useEffect(() => {
    if (!savedSearch?.pickUpDateTime) return
    setPickupLocation((v) => v || savedSearch.pickupLocationCode || '')
    setReturnLocation((v) => v || (savedSearch.returnLocationCode !== savedSearch.pickupLocationCode ? savedSearch.returnLocationCode : '') || '')
    const [pd, pt] = savedSearch.pickUpDateTime.split('T')
    const [rd, rt] = savedSearch.returnDateTime.split('T')
    setPickupDate((v) => v || pd)
    setPickupTime((v) => v || pt?.slice(0, 5) || '')
    setReturnDate((v) => v || rd)
    setReturnTime((v) => v || rt?.slice(0, 5) || '')
  }, [savedSearch])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!pickupLocation || !pickupDate || !returnDate) {
      setError('Preencha o local de retirada e as duas datas para buscar.')
      return
    }

    if (pickupClosed || returnClosed) {
      setError(`A loja não abre ${closedLabel(hours)}. Escolha outro dia para ${pickupClosed ? 'a retirada' : 'a devolução'}.`)
      return
    }

    if (!pickupTime || !returnTime) {
      setError('Escolha o horário de retirada e de devolução.')
      return
    }

    const pickup = toLocalDate(pickupDate, pickupTime)
    const ret = toLocalDate(returnDate, returnTime)

    const hoursUntilPickup = (pickup - new Date()) / (1000 * 60 * 60)
    if (hoursUntilPickup < minNoticeHours) {
      setError(`A retirada precisa de pelo menos ${minNoticeHours}h de antecedência nesta loja.`)
      return
    }

    const rentalHours = (ret - pickup) / (1000 * 60 * 60)
    if (rentalHours < minPeriodHours) {
      setError(`O período mínimo de locação é de ${minPeriodHours}h.`)
      return
    }

    const nextSearch = {
      pickupLocationCode: pickupLocation,
      returnLocationCode: returnLocation || pickupLocation,
      pickupLocationName: locations.find((l) => l.code === pickupLocation)?.descricao ?? '',
      returnLocationName: locations.find((l) => l.code === (returnLocation || pickupLocation))?.descricao ?? '',
      pickUpDateTime: `${pickupDate}T${pickupTime}:00`,
      returnDateTime: `${returnDate}T${returnTime}:00`,
      scenario: DEV ? scenario : '',
    }

    setSubmitting(true)
    // Vai pelo state da rota e pelo contexto: o state some num F5, o contexto não.
    patch({ search: nextSearch, selectedVehicle: null, extras: null, confirmation: null })
    navigate('/reservar/veiculos', { state: nextSearch })
  }

  const errorId = 'busca-erro'

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-10 max-w-5xl mx-auto" noValidate>
      <h2 className="type-title text-text-primary mb-8 text-center text-balance">
        Encontre o veículo perfeito em segundos
      </h2>

      {/* Uma coluna até lg. A 640px o par data+hora dividia metade da largura
          do formulário entre si, e nenhum dos dois cabia. Um rearranjo só,
          como manda a Regra do Colapso Único. */}
      <div className="grid lg:grid-cols-4 gap-5 sm:gap-6">
        <div className="lg:col-span-2">
          <label htmlFor="local-retirada" className="block type-label text-text-secondary mb-2">Local de retirada</label>
          <div className="relative">
            <LocationIcon />
            <select
              id="local-retirada"
              className={selectClass}
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              disabled={loadingLocations}
              required
            >
              <option value="" disabled className="bg-brand-dark">
                {loadingLocations ? ' ' : 'Selecione'}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.code} className="bg-brand-dark">{loc.descricao}</option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="local-devolucao" className="block type-label text-text-secondary mb-2">Local de devolução</label>
          <div className="relative">
            <LocationIcon />
            <select
              id="local-devolucao"
              className={selectClass}
              value={returnLocation}
              onChange={(e) => setReturnLocation(e.target.value)}
              disabled={loadingLocations}
            >
              <option value="" className="bg-brand-dark">Mesmo local da retirada</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.code} className="bg-brand-dark">{loc.descricao}</option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        <DateTimeField
          idPrefix="retirada"
          label="Retirada"
          date={pickupDate}
          time={pickupTime}
          minDate={minPickupDate}
          slots={pickupSlots}
          closed={pickupClosed}
          closedLabel={closedLabel(hours)}
          onDate={setPickupDate}
          onTime={setPickupTime}
        />

        <DateTimeField
          idPrefix="devolucao"
          label="Devolução"
          date={returnDate}
          time={returnTime}
          minDate={pickupDate || minPickupDate}
          slots={returnSlots}
          closed={returnClosed}
          closedLabel={closedLabel(hours)}
          onDate={setReturnDate}
          onTime={setReturnTime}
        />
      </div>

      {hours?.known && (
        <p className="mt-5 type-meta text-text-secondary text-center">
          {hours.nome} atende <span className="type-numeric">{hours.resumo.join(' · ')}</span>
        </p>
      )}

      {error && (
        <div id={errorId} role="alert" className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 text-center">
          <p className="type-meta text-state-error-dark">{error}</p>
          <button
            type="button"
            onClick={() => { setError(''); setPickupDate(''); setPickupTime(''); setReturnDate(''); setReturnTime('') }}
            className="type-meta text-text-primary underline underline-offset-4 hover:text-brand-glow transition-colors cursor-pointer py-2 -my-1"
          >
            Limpar as datas
          </button>
        </div>
      )}

      {DEV && (
        <div className="mt-6 pt-5 border-t border-white/10">
          <label htmlFor="cenario" className="block type-label text-text-secondary mb-2">
            Cenário de teste (só em desenvolvimento)
          </label>
          <select
            id="cenario"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-text-primary text-sm cursor-pointer focus:outline-none focus:border-brand-accent"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id} className="bg-brand-dark">{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={submitting}
        aria-describedby={error ? errorId : undefined}
        className="w-full mt-6 bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm sm:text-base py-4 rounded-xl transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-default"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {submitting ? 'Buscando veículos' : 'Buscar veículo'}
      </motion.button>
    </form>
  )
}

function DateTimeField({ idPrefix, label, date, time, minDate, slots, closed, closedLabel: closedText, onDate, onTime }) {
  const warnId = `${idPrefix}-aviso`

  return (
    <div className="lg:col-span-2">
      <label htmlFor={`${idPrefix}-data`} className="block type-label text-text-secondary mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input
            id={`${idPrefix}-data`}
            type="date"
            className={`${inputClass} ${closed ? invalidClass : ''}`}
            min={minDate}
            value={date}
            onChange={(e) => onDate(e.target.value)}
            aria-invalid={closed || undefined}
            aria-describedby={closed ? warnId : undefined}
            required
          />
        </div>
        <div className="relative">
          <select
            aria-label={`Horário de ${label.toLowerCase()}`}
            className={selectCompacto}
            value={time}
            onChange={(e) => onTime(e.target.value)}
            disabled={!date || closed || slots.length === 0}
            required
          >
            <option value="" disabled className="bg-brand-dark">Hora</option>
            {slots.map((slot) => (
              <option key={slot} value={slot} className="bg-brand-dark">{slot}</option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>
      {closed && (
        <p id={warnId} className="mt-2 type-meta text-state-error-dark">
          A loja não abre {closedText}.
        </p>
      )}
    </div>
  )
}

/* Quando a loja não é conhecida pelo nosso config (`known: false`), o campo de
   hora libera a grade inteira e a validação fica com a API — melhor deixar
   passar e receber o erro dela do que barrar uma loja nova por ignorância. */
const FALLBACK_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

function slotsFor(hours, dateStr) {
  if (!dateStr) return []
  if (!hours?.known) return FALLBACK_SLOTS
  if (hours.feriados?.includes(dateStr)) return []
  return hours.slotsPorDia?.[weekdayOf(dateStr)] ?? []
}

function isClosed(hours, dateStr) {
  if (!dateStr || !hours?.known) return false
  if (hours.feriados?.includes(dateStr)) return true
  return hours.diasFechados?.includes(weekdayOf(dateStr)) ?? false
}

function closedLabel(hours) {
  const nomes = hours?.diasFechadosNomes ?? []
  if (nomes.length === 0) return 'nesse dia'
  if (nomes.length === 1) return `aos ${nomes[0]}s`
  return `aos ${nomes.join('s e ')}s`
}
