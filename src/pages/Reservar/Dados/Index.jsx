import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import Field from '../Field'
import { useReservation } from '../../../context/ReservationContext'
import { digits, isValidCPF, maskAreaCode, maskCPF, maskPhone, UFS } from '../lib/masks'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY = {
  givenName: '', surname: '', areaCode: '', phone: '', email: '',
  docId: '', passport: '', foreigner: false,
  addressLine: '', complement: '', cityName: '', stateCode: '', countryCode: 'BR',
}

function validate(form) {
  const errors = {}
  if (!form.givenName.trim()) errors.givenName = 'Informe seu nome.'
  if (!form.surname.trim()) errors.surname = 'Informe seu sobrenome.'
  if (digits(form.areaCode).length !== 2) errors.areaCode = 'DDD com 2 dígitos.'
  if (digits(form.phone).length < 8) errors.phone = 'Telefone incompleto.'
  if (!EMAIL_RE.test(form.email)) errors.email = 'Informe um e-mail válido.'

  if (form.foreigner) {
    if (form.passport.trim().length < 5) errors.passport = 'Informe o número do passaporte.'
  } else if (!isValidCPF(form.docId)) {
    errors.docId = 'CPF inválido. Confira os números.'
  }

  if (!form.addressLine.trim()) errors.addressLine = 'Informe o endereço.'
  if (!form.cityName.trim()) errors.cityName = 'Informe a cidade.'
  if (!form.stateCode) errors.stateCode = 'Escolha o estado.'
  return errors
}

export default function ReservarDados() {
  const navigate = useNavigate()
  const { selectedVehicle, driver, patch } = useReservation()

  const [form, setForm] = useState(() => ({ ...EMPTY, ...(driver ?? {}) }))
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!selectedVehicle) navigate('/reservar')
  }, [selectedVehicle, navigate])

  // Depois da primeira tentativa, o erro some assim que o campo é corrigido.
  const setField = (key, transform) => (value) => {
    const next = { ...form, [key]: transform ? transform(value) : value }
    setForm(next)
    if (touched) setErrors(validate(next))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setTouched(true)

    if (Object.keys(found).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    // Só guarda e avança: a reserva nasce na etapa de revisão, com o resumo
    // completo à vista e o aceite dos termos dado.
    patch({ driver: form })
    navigate('/reservar/revisao')
  }

  if (!selectedVehicle) return null

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <StepProgress current="dados" />

          <h1 className="type-title text-text-primary text-center mb-3">Seus dados</h1>
          <p className="type-meta text-text-secondary text-center mb-10">
            Precisamos deles para emitir o contrato de locação. Nada é cobrado nesta etapa.
          </p>

          <form onSubmit={handleSubmit} className="on-light bg-white rounded-2xl p-6 sm:p-8 space-y-5" noValidate>
            <fieldset className="space-y-5">
              <legend className="type-subtitle text-text-dark mb-4">Condutor</legend>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome" value={form.givenName} onChange={setField('givenName')} error={errors.givenName} placeholder="João" autoComplete="given-name" />
                <Field label="Sobrenome" value={form.surname} onChange={setField('surname')} error={errors.surname} placeholder="Silva" autoComplete="family-name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="DDD" value={form.areaCode} onChange={setField('areaCode', maskAreaCode)} error={errors.areaCode} numeric inputMode="numeric" placeholder="21" autoComplete="tel-area-code" />
                <Field className="sm:col-span-2" label="Telefone" value={form.phone} onChange={setField('phone', maskPhone)} error={errors.phone} numeric type="tel" inputMode="numeric" placeholder="98854-0185" autoComplete="tel-national" />
              </div>

              <Field label="E-mail" value={form.email} onChange={setField('email')} error={errors.email} type="email" placeholder="seu.melhor@email.com" autoComplete="email" hint="Enviamos o comprovante da reserva para este endereço." />

              <label className="flex items-center gap-3 cursor-pointer py-3 -my-1.5">
                <input
                  type="checkbox"
                  checked={form.foreigner}
                  onChange={(e) => {
                    const next = { ...form, foreigner: e.target.checked }
                    setForm(next)
                    if (touched) setErrors(validate(next))
                  }}
                  className="w-5 h-5 rounded border-line text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                <span className="type-meta text-text-dark">Sou estrangeiro e não tenho CPF</span>
              </label>

              {form.foreigner ? (
                <Field label="Passaporte" value={form.passport} onChange={setField('passport')} error={errors.passport} numeric placeholder="AB123456" />
              ) : (
                <Field label="CPF" value={form.docId} onChange={setField('docId', maskCPF)} error={errors.docId} numeric inputMode="numeric" placeholder="000.000.000-00" autoComplete="off" />
              )}
            </fieldset>

            <fieldset className="space-y-5 pt-2">
              <legend className="type-subtitle text-text-dark mb-4">Endereço</legend>

              <Field label="Endereço" value={form.addressLine} onChange={setField('addressLine')} error={errors.addressLine} placeholder="Rua, número, bairro" autoComplete="street-address" />
              <Field label="Complemento" value={form.complement} onChange={setField('complement')} placeholder="Apartamento, bloco (opcional)" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field className="sm:col-span-2" label="Cidade" value={form.cityName} onChange={setField('cityName')} error={errors.cityName} placeholder="Rio de Janeiro" autoComplete="address-level2" />
                <Field label="Estado" value={form.stateCode} onChange={setField('stateCode')} error={errors.stateCode}>
                  {(props) => (
                    <select {...props} value={form.stateCode} onChange={(e) => setField('stateCode')(e.target.value)} className={`${props.className} cursor-pointer`}>
                      <option value="">UF</option>
                      {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  )}
                </Field>
              </div>
            </fieldset>

            {touched && Object.keys(errors).length > 0 && (
              <p className="type-meta text-state-error bg-state-error-soft border border-state-error-line rounded-xl px-4 py-3" role="alert">
                Confira os campos marcados acima antes de continuar.
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/reservar/extras')}
                className="sm:w-auto px-6 py-4 rounded-xl border border-line text-text-muted hover:text-text-dark hover:bg-surface-muted transition-colors cursor-pointer type-meta"
              >
                Voltar
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 bg-brand-accent hover:bg-brand-glow text-white font-bold text-base py-4 rounded-xl transition-colors cursor-pointer"
              >
                Revisar e confirmar
              </motion.button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
