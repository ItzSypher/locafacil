import { motion } from 'framer-motion'
import HeroImage from '../../assets/images/header.webp'

/**
 * Hero Section premium com:
 * - Background gradient escuro
 * - Copy persuasiva com gatilhos psicológicos (Escassez + Urgência)
 * - Imagem flutuante do veículo (animação infinita)
 * - Formulário glassmorphism sobrepondo hero e próxima seção
 */
export default function Header() {

  /* Variantes de animação para entrada staggered */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
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
              <span className="inline-flex items-center gap-2 bg-brand-success/15 text-brand-success text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border border-brand-success/30 mb-6">
                <span className="w-2 h-2 bg-brand-success rounded-full animate-pulse" />
                Últimas unidades com condições exclusivas
              </span>
            </motion.div>

            {/* Headline principal absurdamente persuasiva */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-text-primary leading-[1.05] mb-6 tracking-tight"
            >
              Sua Liberdade<br />
              <span className="text-gradient">Sobre Rodas.</span>
            </motion.h1>

            {/* Subtítulo com trigger de autoridade */}
            <motion.p
              variants={itemVariants}
              className="text-text-secondary text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-md"
            >
              Alugue carros <strong className="text-text-primary">sem caução</strong>, com <strong className="text-text-primary">todos os seguros inclusos</strong> e o <strong className="text-text-primary">dobro da franquia</strong>. Mais de <strong className="text-text-primary">5.000 clientes</strong> já escolheram a liberdade.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20garantir%20meu%20ve%C3%ADculo%20agora!" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(37, 99, 235, 0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-glow transition-all duration-300 cursor-pointer"
                >
                  Garantir Meu Carro Agora
                </motion.button>
              </a>
              <a href="#beneficios">
                <motion.button
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-transparent border border-white/20 text-white font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full hover:border-white/40 transition-all duration-300 cursor-pointer"
                >
                  Descubra os Benefícios
                </motion.button>
              </a>
            </motion.div>

            {/* Social proof mini */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-brand-dark bg-gradient-to-br from-brand-accent to-brand-glow flex items-center justify-center text-[10px] text-white font-bold"
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
                <p className="text-text-secondary text-xs mt-0.5">Nota 4.9 • +5.000 locações</p>
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
              animate={{ y: [0, -15, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: 'easeInOut'
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Formulário Glassmorphism flutuante - sobrepõe hero e próxima seção */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative z-20 px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 pb-24"
      >
        <div className="container mx-auto">
          <div className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-glass max-w-5xl mx-auto border border-white/10 backdrop-blur-md bg-white/5">
            <h3 className="text-text-primary text-xl sm:text-2xl font-bold mb-8 text-center uppercase tracking-wide">
              Encontre o veículo perfeito em segundos
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Retirada */}
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Local de Retirada</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <select
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-5 py-4 pl-12 text-text-primary text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-brand-dark">Selecione</option>
                    <option value="nova-iguacu" className="bg-brand-dark">Nova Iguaçu - RJ</option>
                    <option value="rio-centro" className="bg-brand-dark">Rio de Janeiro - Centro</option>
                    <option value="niteroi" className="bg-brand-dark">Niterói - RJ</option>
                  </select>
                </div>
              </div>
              {/* Devolução */}
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Local de Devolução</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <select
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-5 py-4 pl-12 text-text-primary text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-brand-dark">Mesmo local</option>
                    <option value="nova-iguacu" className="bg-brand-dark">Nova Iguaçu - RJ</option>
                    <option value="rio-centro" className="bg-brand-dark">Rio de Janeiro - Centro</option>
                    <option value="niteroi" className="bg-brand-dark">Niterói - RJ</option>
                  </select>
                </div>
              </div>
              {/* Data */}
              <div>
                <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wider">Data de Retirada</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-5 py-4 pl-12 text-text-primary text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all cursor-pointer"
                  />
                </div>
              </div>
              {/* Botão busca */}
              <div className="flex items-end">
                <a
                  href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20alugar%20um%20ve%C3%ADculo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-brand-accent hover:bg-brand-glow text-white font-bold text-sm sm:text-base py-4 rounded-xl shadow-glow transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar Veículo
                  </motion.button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}