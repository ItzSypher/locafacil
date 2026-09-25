import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import Price from '../Price'
import { useReservation } from '../../../context/ReservationContext'
import { formatDate, formatTime, diariasLabel } from '../lib/reservation'

const WHATSAPP = '5521968540185'

/* Um .ics de uma linha só evita que o cliente anote a data no papel.
   Gerado no cliente: não há servidor de calendário nem por quê. */
function buildIcs({ confId, start, end, locationName }) {
  const stamp = (value) => `${value.replace(/[-:]/g, '').split('.')[0]}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Locafacil//Reserva//PT-BR',
    'BEGIN:VEVENT',
    `UID:reserva-${confId}@locafacilaluguel.com.br`,
    `DTSTAMP:${stamp(new Date().toISOString())}Z`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Retirada do veículo · Locafacil (reserva ${confId})`,
    `LOCATION:${locationName ?? 'Locafacil'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

export default function ReservarConfirmacao() {
  const navigate = useNavigate()
  const { confirmation, confirmationTotals, search, demo, reset } = useReservation()

  // O localizador precisa sobreviver à limpeza: a PII sai da sessionStorage ao
  // deixar a tela, mas o número já renderizado continua legível.
  const snapshot = useRef(null)
  if (confirmation && !snapshot.current) {
    snapshot.current = { confirmation, confirmationTotals, search, demo }
  }

  useEffect(() => {
    if (!confirmation && !snapshot.current) navigate('/reservar')
  }, [confirmation, navigate])

  // Comprovante exibido: os dados do condutor não precisam mais ficar guardados.
  useEffect(() => () => reset(), [reset])

  const data = snapshot.current
  if (!data) return null

  const { confirmation: booking, confirmationTotals: totals, search: trip } = data
  const confId = booking.confId
  const whatsappText = encodeURIComponent(`Olá, Locafacil! Minha reserva ${confId} foi confirmada e preciso de suporte.`)

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-2xl p-8 sm:p-10 text-center"
          >
            <div className="w-14 h-14 bg-brand-success/15 text-brand-success rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="type-title text-text-primary mb-2">Reserva confirmada</h1>
            <p className="type-body text-text-secondary mb-8">
              Guarde o número abaixo — é com ele que você consulta ou cancela a reserva.
            </p>

            <p className="type-label text-text-secondary mb-2">Número da reserva</p>
            <p className="type-numeric type-display text-text-primary mb-8">{confId}</p>

            <div className="text-left bg-white/5 rounded-2xl p-6 space-y-3 mb-8">
              <Row label="Veículo" value={booking.vehicle?.groupName || booking.vehicle?.description} />
              <Row
                label="Retirada"
                value={`${trip?.pickupLocationName || 'Loja Locafacil'} · ${formatDate(trip?.pickUpDateTime)} às ${formatTime(trip?.pickUpDateTime)}`}
              />
              <Row
                label="Devolução"
                value={`${trip?.returnLocationName || 'Loja Locafacil'} · ${formatDate(trip?.returnDateTime)} às ${formatTime(trip?.returnDateTime)}`}
              />
              {totals?.coverageItem && <Row label="Proteção" value={totals.coverageItem.name} />}

              {totals && (
                <div className="flex items-end justify-between gap-4 pt-3 mt-3 border-t border-white/10">
                  <span className="type-label text-text-secondary">
                    Total {booking.days ? `de ${diariasLabel(booking.days)}` : ''}
                  </span>
                  <Price value={totals.total} size="sm" className="text-text-primary" />
                </div>
              )}
            </div>

            <p className="type-meta text-text-secondary mb-8">
              O pagamento é feito na retirada, no balcão da loja. Leve CNH válida e um cartão em seu nome.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href={`https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <motion.span
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="block w-full bg-brand-accent hover:bg-brand-glow text-white font-bold py-4 rounded-xl transition-colors duration-300 cursor-pointer"
                >
                  Falar com o suporte
                </motion.span>
              </a>

              <a
                href={buildIcs({
                  confId,
                  start: trip?.pickUpDateTime ?? '',
                  end: trip?.returnDateTime ?? '',
                  locationName: trip?.pickupLocationName,
                })}
                download={`reserva-locafacil-${confId}.ics`}
                className="flex items-center justify-center w-full py-4 rounded-xl border border-white/15 text-text-secondary hover:text-text-primary hover:border-white/25 transition-colors cursor-pointer font-bold"
              >
                Adicionar ao calendário
              </a>
            </div>

            <p className="type-meta text-text-secondary mt-6">
              <Link to="/reservar/consultar" className="text-text-primary underline underline-offset-4 hover:text-brand-glow transition-colors py-3 -my-1.5 inline-block">
                Consultar ou cancelar esta reserva
              </Link>
            </p>

            {data.demo && (
              <p className="type-meta text-text-secondary mt-6">
                Reserva de demonstração: a integração com o sistema da loja ainda não foi liberada.
              </p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="type-label text-text-secondary shrink-0">{label}</span>
      <span className="type-meta text-text-primary text-right">{value}</span>
    </div>
  )
}
