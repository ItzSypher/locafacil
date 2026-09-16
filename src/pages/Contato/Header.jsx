import { motion } from 'framer-motion'
import Image from '../../assets/images/image-6.webp'

export default function Header() {
  return (
    <div className="relative bg-hero-gradient pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-accent/15 text-brand-accent text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border border-brand-accent/30 mb-6">
              Fale Conosco
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-primary leading-tight mb-4">
              Estamos aqui <span className="text-gradient">por você.</span>
            </h1>
            <h2 className="text-xl sm:text-2xl font-light text-text-secondary mb-8">
              Conheça a equipe por trás da Locafacil e entre em contato conosco.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.img
              src={Image}
              alt="Equipe Locafacil"
              className="w-full max-w-lg mx-auto drop-shadow-2xl rounded-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
