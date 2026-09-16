import { motion } from 'framer-motion'
import Image from '../../assets/images/header-empresas.webp'

/**
 * Header da página Empresas - estilo premium consistente com a Home.
 */
export default function Header() {
  return (
    <div className="relative bg-hero-gradient pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 overflow-hidden">
      {/* Decoração de fundo */}
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
              Soluções Corporativas
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-primary leading-tight mb-4">
              Locafacil <span className="text-gradient">Business</span>
            </h1>
            <h2 className="text-xl sm:text-2xl font-light text-text-secondary mb-8">
              Eficiência em Movimento. Soluções completas em terceirização de frota.
            </h2>
            <a href="https://api.whatsapp.com/send?phone=5521993297697&text=Ol%C3%A1,%20Locafacil!%20Quero%20saber%20sobre%20frota%20para%20empresas." target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="bg-brand-accent hover:bg-brand-glow text-white font-bold px-8 py-3.5 rounded-full shadow-glow transition-all duration-300 cursor-pointer"
              >
                Solicitar Proposta Comercial
              </motion.button>
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.img
              src={Image}
              alt="Frota corporativa Locafacil Business"
              className="w-full max-w-lg mx-auto drop-shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}