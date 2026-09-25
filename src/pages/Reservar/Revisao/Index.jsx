import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import VehicleImage from '../VehicleImage'
import Price from '../Price'
import { useReservation } from '../../../context/ReservationContext'
import { confirmReservation, getPersonalizacao, ReservationApiError } from '../../../lib/api/reservation'
import { buildConfirmPayload, computeTotals, diariasLabel, formatDate, formatTime } from '../lib/reservation'
import { maskCPF } from '../lib/masks'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function Block({ title, onEdit, editLabel, children }) {
  return (
    <section className="border-b border-line-soft pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 className="type-label text-text-muted">{title}</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="type-meta text-brand-accent hover:text-brand-glow underline underline-offset-4 transition-colors cursor-pointer py-3 -my-1.5"
          >
            {editLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

export default function ReservarRevisao() {
  const navigate = useNavigate()
  const { search, selectedVehicle: offer, extras, driver, quote, patch } = useReservation()

  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [legal, setLegal] = useState({ termosUrl: null, clausulasUrl: null })

  // A reserva é o único efeito irreversível do fluxo. O ref barra o segundo
  // envio mesmo antes do React repintar o botão desabilitado.
  const sentRef = useRef(false)

  useEffect(() => {
    if (!offer || !driver) navigate('/reservar')
  }, [offer, driver, navigate])

  useEffect(() => {
    if (!search?.pickupLocationCode) return
    getPersonalizacao(search.pickupLocationCode)
      .then((res) => setLegal({ termosUrl: res.data?.termosUrl ?? null, clausulasUrl: res.data?.clausulasUrl ?? null }))
      .catch(() => {})
  }, [search?.pickupLocationCode])

  const totals = useMemo(() => computeTotals({ offer, extras }), [offer, extras])

  if (!offer || !driver) return null

  const days = offer.days || 1

  const handleConfirm = async () => {
    if (!accepted) {
      setError('É preciso aceitar os termos e as cláusulas contratuais para confirmar.')
      return
    }
    if (sentRef.current) return

    sentRef.current = true
    setError('')
    setSubmitting(true)

    try {
      const payload = buildConfirmPayload({ search, offer, extras, driver, quoteId: quote?.quoteId })
      const res = await confirmReservation(payload)
      patch({ confirmation: res.data, confirmationTotals: totals, demo: res.demo })
      navigate('/reservar/confirmacao')
    } catch (err) {
      sentRef.current = false
      setError(err instanceof ReservationApiError ? err.errors.join(' ') : 'Não foi possível confirmar a reserva. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl">
          <StepProgress current="revisao" />

          <h1 className="type-title text-text-primary text-center mb-3">Revise e confirme</h1>
          <p className="type-meta text-text-secondary text-center mb-10">
            Confira tudo antes de fechar. Nada é cobrado agora — o pagamento é feito na retirada.
          </p>

          <div className="on-light bg-white rounded-2xl p-6 sm:p-8">
            <Block title="Veículo" onEdit={() => navigate('/reservar/veiculos')} editLabel="Trocar">
              <div className="flex items-center gap-5">
                <div className="w-28 sm:w-36 shrink-0 text-text-dark/70">
                  <VehicleImage offer={offer} legenda={false} />
                </div>
                <div className="min-w-0">
                  <p className="type-subtitle text-text-dark">{offer.groupName}</p>
                  <p className="type-meta text-text-muted mt-1">{offer.description}</p>
                  <p className="type-meta text-text-muted mt-1">
                    {offer.transmission} · {offer.passengers} pessoas · {offer.kmPolicy.label}
                  </p>
                </div>
              </div>
            </Block>

            <Block title="Retirada e devolução" onEdit={() => navigate('/reservar')} editLabel="Alterar">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="type-meta text-text-muted mb-1">Retirada</p>
                  <p className="type-body text-text-dark text-sm">{search?.pickupLocationName || 'Loja Locafacil'}</p>
                  <p className="type-meta text-text-muted type-numeric mt-0.5">
                    {formatDate(search?.pickUpDateTime)} às {formatTime(search?.pickUpDateTime)}
                  </p>
                </div>
                <div>
                  <p className="type-meta text-text-muted mb-1">Devolução</p>
                  <p className="type-body text-text-dark text-sm">{search?.returnLocationName || 'Loja Locafacil'}</p>
                  <p className="type-meta text-text-muted type-numeric mt-0.5">
                    {formatDate(search?.returnDateTime)} às {formatTime(search?.returnDateTime)}
                  </p>
                </div>
              </div>
            </Block>

            <Block title="Condutor" onEdit={() => navigate('/reservar/dados')} editLabel="Editar">
              <p className="type-body text-text-dark text-sm">{driver.givenName} {driver.surname}</p>
              <p className="type-meta text-text-muted mt-0.5">
                {driver.email} · <span className="type-numeric">({driver.areaCode}) {driver.phone}</span>
              </p>
              <p className="type-meta text-text-muted mt-0.5 type-numeric">
                {driver.foreigner ? `Passaporte ${driver.passport}` : `CPF ${maskCPF(driver.docId)}`}
              </p>
              <p className="type-meta text-text-muted mt-0.5">
                {driver.addressLine}{driver.complement ? `, ${driver.complement}` : ''} — {driver.cityName}/{driver.stateCode}
              </p>
            </Block>

            <Block title="Proteção e opcionais" onEdit={() => navigate('/reservar/extras')} editLabel="Alterar">
              {totals.coverageItem ? (
                <p className="type-body text-text-dark text-sm">Proteção {totals.coverageItem.name}</p>
              ) : (
                <p className="type-meta text-text-muted">Sem proteção adicional</p>
              )}
              {totals.equipmentItems.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5">
                  {totals.equipmentItems.map((item) => (
                    <li key={item.type} className="type-meta text-text-muted">{item.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="type-meta text-text-muted mt-1">Nenhum item opcional</p>
              )}
            </Block>

            <Block title="Valor">
              <ul className="space-y-2.5">
                {totals.lines.map((line) => (
                  <li key={line.key} className="flex justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block type-meta text-text-dark">{line.label}</span>
                      {line.detail && <span className="block type-meta text-text-muted type-numeric">{line.detail}</span>}
                    </span>
                    <span className="type-meta type-numeric shrink-0 text-text-dark">
                      {line.included ? <span className="text-text-muted">inclusa</span> : BRL.format(line.amount)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-end justify-between gap-4 mt-5 pt-4 border-t border-line">
                <span className="type-subtitle text-text-dark">Total de {diariasLabel(days)}</span>
                <Price value={totals.total} size="md" className="text-text-dark" />
              </div>

              {offer.noShowFee > 0 && (
                <p className="type-meta text-text-muted mt-4">
                  Não comparecer para a retirada gera uma taxa de{' '}
                  <span className="type-numeric">{BRL.format(offer.noShowFee)}</span>. Cancele pelo site se precisar desistir.
                </p>
              )}
            </Block>
          </div>

          <label className="flex items-start gap-3 mt-6 cursor-pointer py-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => { setAccepted(e.target.checked); if (e.target.checked) setError('') }}
              className="mt-0.5 w-5 h-5 rounded border-white/30 bg-white/10 text-brand-accent focus:ring-brand-accent cursor-pointer shrink-0"
            />
            <span className="type-meta text-text-secondary">
              Li e aceito os{' '}
              <LegalLink href={legal.termosUrl}>termos de uso</LegalLink>
              {' e as '}
              <LegalLink href={legal.clausulasUrl}>cláusulas contratuais</LegalLink>
              {' da locação.'}
            </span>
          </label>

          {error && (
            <p className="mt-4 type-meta text-state-error-dark text-center" role="alert">{error}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/reservar/dados')}
              className="sm:w-auto px-6 py-4 rounded-xl border border-white/15 text-text-secondary hover:text-text-primary hover:border-white/25 transition-colors cursor-pointer type-meta"
            >
              Voltar
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 bg-brand-accent hover:bg-brand-glow text-white font-bold text-base py-4 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              {submitting ? 'Confirmando sua reserva' : 'Confirmar reserva'}
            </motion.button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/* O tenant de demonstração devolve os campos legais vazios. Sem link, o texto
   continua legível em vez de virar um link morto. */
function LegalLink({ href, children }) {
  if (!href) return <span className="text-text-primary">{children}</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-text-primary underline underline-offset-4 hover:text-brand-glow transition-colors"
    >
      {children}
    </a>
  )
}
