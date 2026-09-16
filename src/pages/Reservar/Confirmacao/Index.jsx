import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from '../../../components/Topbar/Index'
import Footer from '../../../components/Footer/Index'
import StepProgress from '../StepProgress'
import { useReservation } from '../../../context/ReservationContext'

export default function ReservarConfirmacao() {
  const navigate = useNavigate()
  const { confirmation, selectedVehicle, search, reset } = useReservation()

  useEffect(() => {
    if (!confirmation) navigate('/reservar')
  }, [confirmation, navigate])

  if (!confirmation) return null

  const confId = confirmation.VehResRSCore?.ConfID?.ID
  const vehicleName = selectedVehicle?.VehAvailCore?.Vehicle?.VehMakeModel?.Name
  const whatsappText = encodeURIComponent(`Olá, Locafacil! Minha reserva ${confId ?? ''} foi confirmada e preciso de suporte.`)

  return (
    <div className="min-h-screen overflow-x-hidden bg-hero-gradient">
      <Topbar />
      <section className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <StepProgress current="confirmacao" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 sm:p-10 text-center"
          >
            <div className="w-14 h-14 bg-brand-success/15 text-brand-success rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">
              Reserva confirmada
            </h1>
            <p className="text-text-secondary mb-8">Guarde o número abaixo — ele é o seu comprovante.</p>

            <p className="text-text-secondary text-sm mb-1">Número da reserva</p>
            <p className="text-text-primary text-5xl sm:text-6xl font-black tracking-tight mb-8 tabular-nums">
              {confId}
            </p>

            <div className="text-left bg-white/5 rounded-2xl p-6 space-y-2 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Veículo</span>
                <span className="text-text-primary font-semibold">{vehicleName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Retirada</span>
                <span className="text-text-primary font-semibold">
                  {search?.pickUpDateTime && new Date(search.pickUpDateTime).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Devolução</span>
                <span className="text-text-primary font-semibold">
                  {search?.returnDateTime && new Date(search.returnDateTime).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <a
              href={`https://api.whatsapp.com/send?phone=5521968540185&text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => reset()}
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold py-4 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Falar com nosso suporte
              </motion.button>
            </a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
