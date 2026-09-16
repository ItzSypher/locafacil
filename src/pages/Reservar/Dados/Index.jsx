import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import { useReservation } from '../../../context/ReservationContext'
import { confirmReservation, ReservationApiError } from '../../../lib/api/reservation'

const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-text-dark text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all'
const labelClass = 'block text-text-secondary text-xs font-bold mb-1.5 uppercase tracking-wider'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CPF_RE = /^\d{11}$/

export default function ReservarDados() {
  const navigate = useNavigate()
  const { search, selectedVehicle, extras, patch } = useReservation()

  const [form, setForm] = useState({
    givenName: '', surname: '', areaCode: '', phone: '', email: '',
    docId: '', addressLine: '', cityName: '', stateCode: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!selectedVehicle) navigate('/reservar')
  }, [selectedVehicle, navigate])

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    if (!form.givenName || !form.surname) return 'Informe seu nome completo.'
    if (!form.phone || !form.areaCode) return 'Informe um telefone válido com DDD.'
    if (!EMAIL_RE.test(form.email)) return 'Informe um e-mail válido.'
    if (!CPF_RE.test(form.docId.replace(/\D/g, ''))) return 'Informe um CPF válido (11 dígitos).'
    if (!form.addressLine || !form.cityName || !form.stateCode) return 'Preencha o endereço completo.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSubmitting(true)

    const payload = {
      VehResRQCore: {
        VehRentalCore: {
          PickUpDateTime: search?.pickUpDateTime,
          ReturnDateTime: search?.returnDateTime,
          PickUpLocation: { LocationCode: search?.pickupLocationCode, CodeContext: 'IATA' },
          ReturnLocation: { LocationCode: search?.returnLocationCode, CodeContext: 'IATA' },
        },
        Customer: {
          Primary: {
            PersonName: { GivenName: form.givenName, Surname: form.surname },
            Telephone: { AreaCityCode: form.areaCode, PhoneNumber: form.phone, PhoneTechType: '1' },
            Email: form.email,
            Document: { DocID: form.docId.replace(/\D/g, ''), DocType: '5' },
          },
          Additional: {
            Address: {
              AddressLine: form.addressLine,
              CityName: form.cityName,
              StateProv: { StateCode: form.stateCode },
              CountryName: { Code: 'BR' },
            },
            Document: { DocID: form.docId.replace(/\D/g, ''), DocType: '5' },
          },
        },
        VehPrefs: { VehPref: { Code: selectedVehicle.VehAvailCore.Vehicle.Code, CodeContext: 'SIPP' } },
        RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
        Status: 'Available',
      },
      VehResRQInfo: {
        CoveragePrefs: {
          CoveragePref: extras?.coverageType ? [{ CoverageType: extras.coverageType }] : [],
        },
        SpecialEquipPrefs: {
          SpecialEquipPref: (extras?.equipTypes ?? []).map((type) => ({ Quantity: '1', EquipType: type })),
        },
      },
    }

    try {
      const res = await confirmReservation(payload)
      patch({ confirmation: res.data, driver: form })
      navigate('/reservar/confirmacao')
    } catch (err) {
      setError(err instanceof ReservationApiError ? err.errors.join(' ') : 'Não foi possível confirmar a reserva.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedVehicle) return null

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <section className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <StepProgress current="dados" />

          <h1 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-10 tracking-tight">
            Seus <span className="text-gradient">dados</span>
          </h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-2xl space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome</label>
                <input className={inputClass} value={form.givenName} onChange={setField('givenName')} placeholder="João" required />
              </div>
              <div>
                <label className={labelClass}>Sobrenome</label>
                <input className={inputClass} value={form.surname} onChange={setField('surname')} placeholder="Silva" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>DDD</label>
                <input className={inputClass} value={form.areaCode} onChange={setField('areaCode')} placeholder="21" maxLength={2} required />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Telefone</label>
                <input className={inputClass} value={form.phone} onChange={setField('phone')} placeholder="968540185" required />
              </div>
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <input type="email" className={inputClass} value={form.email} onChange={setField('email')} placeholder="seu.melhor@email.com" required />
            </div>

            <div>
              <label className={labelClass}>CPF</label>
              <input className={inputClass} value={form.docId} onChange={setField('docId')} placeholder="Somente números" required />
            </div>

            <div>
              <label className={labelClass}>Endereço</label>
              <input className={inputClass} value={form.addressLine} onChange={setField('addressLine')} placeholder="Rua, número, bairro" required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Cidade</label>
                <input className={inputClass} value={form.cityName} onChange={setField('cityName')} placeholder="Rio de Janeiro" required />
              </div>
              <div>
                <label className={labelClass}>UF</label>
                <input className={inputClass} value={form.stateCode} onChange={setField('stateCode')} placeholder="RJ" maxLength={2} required />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-base py-4 rounded-xl shadow-glow transition-all cursor-pointer mt-2 disabled:opacity-60"
            >
              {submitting ? 'Confirmando...' : 'Confirmar Reserva →'}
            </motion.button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  )
}
