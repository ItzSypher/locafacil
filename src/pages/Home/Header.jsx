import { motion, useReducedMotion } from 'framer-motion'
import HeroImage from '../../assets/images/header.webp'
import SearchWidget from '../Reservar/SearchWidget'

/**
 * Hero Section premium com:
 * - Background gradient escuro
 * - Promessa principal e condições de locação
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

          {/* Coluna de texto */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            {/* Headline principal */}
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
              Alugue carros <strong className="text-text-primary">sem caução</strong>, com <strong className="text-text-primary">todos os seguros inclusos</strong> e o <strong className="text-text-primary">dobro da franquia</strong>. Retirada em Nova Iguaçu, contrato na hora.
            </motion.p>

            {/* CTAs — o <a> É o botão. Envolver um <button> num <a> sem
                largura deixava cada um medindo o próprio texto, com alturas
                diferentes e rótulo quebrado em duas linhas. */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20garantir%20meu%20ve%C3%ADculo%20agora!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap bg-brand-accent hover:bg-brand-glow text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Garantir meu carro agora
              </a>
              <a
                href="#beneficios"
                className="inline-flex items-center justify-center whitespace-nowrap bg-white/5 border border-white/15 text-white font-medium text-base px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors duration-300 cursor-pointer"
              >
                Descubra os benefícios
              </a>
            </motion.div>

            {/* Selos de confiança. Os quatro avatares "RS MF JC AL" e a
                "Nota 4,9 • +5.000 locações" eram números sem origem — prova
                social inventada custa mais confiança do que compra. Aqui cada
                linha é uma condição que está no contrato. */}
            <motion.ul
              variants={itemVariants}
              className="type-meta text-text-secondary mt-10 flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              {['Sem caução', 'Seguros inclusos', 'Retirada em Nova Iguaçu'].map((selo) => (
                <li key={selo} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {selo}
                </li>
              ))}
            </motion.ul>
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
