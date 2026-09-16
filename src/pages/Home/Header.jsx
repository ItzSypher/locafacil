import { motion, useReducedMotion } from 'framer-motion'
import HeroImage from '../../assets/images/header.webp'
import SearchWidget from '../Reservar/SearchWidget'

/**
 * Hero Section premium com:
 * - Background gradient escuro
 * - Copy persuasiva com gatilhos psicológicos (Escassez + Urgência)
 * - Imagem flutuante do veículo (animação infinita)
 * - Formulário glassmorphism sobrepondo hero e próxima seção
 */
export default function Header() {
  const reduzMovimento = useReducedMotion()

  /* Variantes de animação para entrada staggered */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden" id="hero">

      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradiente radial sutil no canto superior */}
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-1/4 w-[400px] h-[400px] bg-brand-glow/5 rounded-full blur-[100px]" />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-64 sm:pb-72 lg:pb-80 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Coluna de texto - Copy persuasiva */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            {/* Badge de urgência */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold type-label px-4 py-1.5 rounded-full border border-brand-gold/30 mb-6">
                <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                Últimas unidades com condições exclusivas
              </span>
            </motion.div>

            {/* Headline principal absurdamente persuasiva */}
            <motion.h1
              variants={itemVariants}
              className="type-display text-text-primary mb-6"
            >
              Sua Liberdade<br />Sobre Rodas.
            </motion.h1>

            {/* Subtítulo com trigger de autoridade */}
            <motion.p
              variants={itemVariants}
              className="type-body text-text-secondary sm:text-lg mb-8 max-w-[38ch]"
            >
              Alugue carros <strong className="text-text-primary">sem caução</strong>, com <strong className="text-text-primary">todos os seguros inclusos</strong> e o <strong className="text-text-primary">dobro da franquia</strong>. Mais de <strong className="text-text-primary">5.000 clientes</strong> já escolheram a liberdade.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20garantir%20meu%20ve%C3%ADculo%20agora!" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-brand-accent hover:bg-brand-glow text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                >
                  Garantir meu carro agora
                </motion.button>
              </a>
              <a href="#beneficios">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white/5 border border-white/15 text-white font-medium text-base px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                >
                  Descubra os benefícios
                </motion.button>
              </a>
            </motion.div>

            {/* Social proof mini */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-brand-dark bg-brand-deep flex items-center justify-center type-label text-white"
                  >
                    {['RS', 'MF', 'JC', 'AL'][i - 1]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-brand-gold fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="type-meta type-numeric text-text-secondary mt-1">Nota 4,9 • +5.000 locações</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Coluna da imagem - veículo flutuante */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex items-center justify-center"
          >
            {/* Glow atrás do carro */}
            <div className="absolute inset-0 m-auto w-3/4 h-3/4 bg-brand-accent/20 rounded-full blur-[80px]" />

            {/* Imagem flutuante */}
            <motion.img
              src={HeroImage}
              alt="Veículo premium Locafacil disponível para locação imediata"
              className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl drop-shadow-2xl"
              animate={reduzMovimento ? undefined : { y: [0, -15, 0] }}
              transition={reduzMovimento ? undefined : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Formulário Glassmorphism flutuante - sobrepõe hero e próxima seção */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative z-20 px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 pb-24"
      >
        <div className="container mx-auto">
          <SearchWidget />
        </div>
      </motion.div>
    </section>
  )
}