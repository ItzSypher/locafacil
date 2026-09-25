import { useState } from 'react'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import Field from '../Field'
import Dialog from '../Dialog'
import Price from '../Price'
import VehicleArt from '../VehicleArt'
import { cancelReservation, lookupReservation, ReservationApiError } from '../../../lib/api/reservation'
import { diariasLabel, formatDate, formatTime } from '../lib/reservation'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL = {
  Pending: 'Pendente',
  Confirmed: 'Confirmada',
  Booked: 'Confirmada',
  Cancelled: 'Cancelada',
}

export default function ReservarConsultar() {
  const [confId, setConfId] = useState('')
  const [surname, setSurname] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const [booking, setBooking] = useState(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!confId.trim()) found.confId = 'Informe o número da reserva.'
    if (!surname.trim()) found.surname = 'Informe o sobrenome do condutor.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setApiError('')
    setLoading(true)
    setBooking(null)

    try {
      const res = await lookupReservation({
        VehRetResRQCore: {
          UniqueID: { Type: '14', ID: confId.trim() },
          PersonName: { Surname: surname.trim().toUpperCase() },
        },
      })
      setBooking(res.data)
    } catch (err) {
      setApiError(err instanceof ReservationApiError ? err.errors.join(' ') : 'Não foi possível consultar a reserva.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelError('')
    setCancelling(true)
    try {
      await cancelReservation({
        VehCancelRQCore: {
          CancelType: 'Cancel',
          UniqueID: { Type: '14', ID: booking.confId },
          PersonName: { Surname: surname.trim().toUpperCase() },
        },
      })
      setBooking((prev) => ({ ...prev, status: 'Cancelled' }))
      setConfirmingCancel(false)
    } catch (err) {
      setCancelError(err instanceof ReservationApiError ? err.errors.join(' ') : 'Não foi possível cancelar a reserva.')
    } finally {
      setCancelling(false)
    }
  }

  const cancelled = booking?.status === 'Cancelled'

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <h1 className="type-title text-text-primary text-center mb-3">Consultar reserva</h1>
          <p className="type-meta text-text-secondary text-center mb-10">
            Informe o número da reserva e o sobrenome do condutor.
          </p>

          <form onSubmit={handleSubmit} className="on-light bg-white rounded-2xl p-6 sm:p-8 space-y-5" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Número da reserva"
                value={confId}
                onChange={(v) => { setConfId(v.replace(/\D/g, '')); setErrors((p) => ({ ...p, confId: undefined })) }}
                error={errors.confId}
                numeric
                inputMode="numeric"
                placeholder="123456"
              />
              <Field
                label="Sobrenome do condutor"
                value={surname}
                onChange={(v) => { setSurname(v); setErrors((p) => ({ ...p, surname: undefined })) }}
                error={errors.surname}
                placeholder="Silva"
                autoComplete="family-name"
              />
            </div>

            {apiError && (
              <p className="type-meta text-state-error bg-state-error-soft border border-state-error-line rounded-xl px-4 py-3" role="alert">
                {apiError}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-base py-4 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              {loading ? 'Consultando' : 'Consultar reserva'}
            </motion.button>
          </form>

          {loading && (
            <div className="glass rounded-2xl p-6 mt-8 animate-pulse" aria-live="polite" aria-busy="true">
              <span className="sr-only">Consultando sua reserva</span>
              <div className="h-3 w-24 bg-white/10 rounded mb-4" />
              <div className="h-5 w-40 bg-white/10 rounded mb-6" />
              <div className="h-20 bg-white/10 rounded-xl" />
            </div>
          )}

          {booking && !loading && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="on-light bg-white rounded-2xl p-6 sm:p-8 mt-8"
              aria-label="Detalhes da reserva"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="type-label text-text-muted mb-1">Reserva</p>
                  <p className="type-numeric type-title text-text-dark">{booking.confId}</p>
                </div>
                <span
                  className={`type-label px-3 py-1.5 rounded-full ${
                    cancelled ? 'bg-state-error-soft text-state-error' : 'bg-state-success-soft text-brand-success'
                  }`}
                >
                  {STATUS_LABEL[booking.status] ?? booking.status}
                </span>
              </div>

              <div className="flex items-center gap-5 pb-5 mb-5 border-b border-line-soft">
                <div className="w-28 shrink-0 text-text-dark/70">
                  <VehicleArt offer={booking.vehicle} />
                </div>
                <div className="min-w-0">
                  <p className="type-subtitle text-text-dark">{booking.vehicle?.groupName}</p>
                  <p className="type-meta text-text-muted mt-1">{booking.vehicle?.description}</p>
                  <p className="type-meta text-text-muted mt-1">{booking.kmPolicy?.label}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 pb-5 mb-5 border-b border-line-soft">
                <div>
                  <p className="type-label text-text-muted mb-1">Retirada</p>
                  <p className="type-meta text-text-dark type-numeric">
                    {formatDate(booking.pickUpDateTime)} às {formatTime(booking.pickUpDateTime)}
                  </p>
                </div>
                <div>
                  <p className="type-label text-text-muted mb-1">Devolução</p>
                  <p className="type-meta text-text-dark type-numeric">
                    {formatDate(booking.returnDateTime)} às {formatTime(booking.returnDateTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <span className="type-subtitle text-text-dark">
                  Total {booking.days ? `de ${diariasLabel(booking.days)}` : ''}
                </span>
                <Price value={booking.totals?.estimated} size="sm" className="text-text-dark" />
              </div>

              {!cancelled && (
                <button
                  type="button"
                  onClick={() => { setCancelError(''); setConfirmingCancel(true) }}
                  className="mt-8 w-full py-4 rounded-xl border border-state-error-line text-state-error hover:bg-state-error-soft transition-colors cursor-pointer font-bold"
                >
                  Cancelar esta reserva
                </button>
              )}

              {cancelled && (
                <p className="mt-8 type-meta text-text-muted">
                  Esta reserva foi cancelada. Para alugar de novo, faça uma nova busca.
                </p>
              )}
            </motion.section>
          )}
        </div>
      </main>
      <Footer />

      <Dialog
        open={confirmingCancel}
        onClose={() => !cancelling && setConfirmingCancel(false)}
        title="Cancelar a reserva?"
        footer={(
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              disabled={cancelling}
              className="sm:w-auto px-6 py-3.5 rounded-xl border border-line text-text-muted hover:text-text-dark hover:bg-surface-muted transition-colors cursor-pointer type-meta disabled:opacity-60"
            >
              Manter a reserva
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-3.5 rounded-xl bg-state-error text-white font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              {cancelling ? 'Cancelando' : 'Sim, cancelar'}
            </button>
          </div>
        )}
      >
        <p className="type-body text-text-muted text-sm">
          O cancelamento não pode ser desfeito. Para alugar depois será preciso fazer uma nova reserva,
          sujeita à disponibilidade e aos preços daquele momento.
        </p>
        {booking?.noShowFee > 0 && (
          <p className="type-meta text-text-muted mt-4">
            A taxa de não comparecimento desta reserva é de{' '}
            <span className="type-numeric">{BRL.format(booking.noShowFee)}</span>. Cancelar agora evita essa cobrança.
          </p>
        )}
        {cancelError && (
          <p className="type-meta text-state-error bg-state-error-soft border border-state-error-line rounded-xl px-4 py-3 mt-4" role="alert">
            {cancelError}
          </p>
        )}
      </Dialog>
    </div>
  )
}
