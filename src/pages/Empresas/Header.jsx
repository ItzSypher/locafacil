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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text-primary leading-tight mb-4 text-balance">
              Locafacil Business
            </h1>
            <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed mb-8 max-w-[45ch]">
              Eficiência em movimento: soluções completas em terceirização de frota.
            </p>
            <a href="https://api.whatsapp.com/send?phone=5521993297697&text=Ol%C3%A1,%20Locafacil!%20Quero%20saber%20sobre%20frota%20para%20empresas." target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-brand-accent hover:bg-brand-glow text-white font-bold px-8 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
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