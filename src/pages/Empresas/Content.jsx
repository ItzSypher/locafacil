import { motion } from 'framer-motion'

import Image1 from '../../assets/images/image-5.webp'
import Image2 from '../../assets/images/image-6.webp'
import BannerFinal from '../../assets/images/banner-empresas.webp'

/**
 * Conteúdo da página Empresas com estilo premium.
 */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
}

const motivos = [
  {
    titulo: 'Custos',
    descricao: 'Com a terceirização de frota da Locafacil você reduz custos e elimina gastos inesperados com manutenções e substituição de veículos. Na prática é a sua empresa operando forte, com custo fixo mensal e sem surpresas desagradáveis.',
  },
  {
    titulo: 'Agilidade',
    descricao: 'A Locafacil Business garante o processo de contratação mais ágil do mercado. Sem sua empresa pagar caução, com atendimento humanizado e planos 100% personalizados de acordo com sua necessidade.',
  },
  {
    titulo: 'Foco',
    descricao: 'Você, empresário, sabe bem que tempo + foco = resultado! Terceirizando sua frota com a Locafacil Business você ganha tempo para pensar no que realmente importa — o crescimento da sua empresa.',
  },
  {
    titulo: 'Planejamento',
    descricao: 'Transformar despesas variáveis em custos fixos auxiliará todo o seu processo de gestão financeira e planejamento operacional. Além disso, você conta com a nossa flexibilidade de poder aumentar a frota sempre que quiser.',
  },
]

export default function EmpresasContent() {
  return (
    <main>
      {/* Seção principal */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            <div>
              <span className="inline-block text-brand-accent text-sm font-semibold tracking-widest uppercase mb-3">Terceirização de Frotas</span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark leading-tight mb-6">
                Crescer dói, mas <span className="text-gradient">não precisa ser assim.</span>
              </h3>
              <p className="text-text-muted text-lg leading-relaxed mb-8">
                Com a Locafacil Business você pode expandir sua operação sem precisar se preocupar com custos de aquisição, gestão da frota e manutenção dos veículos. Oferecemos soluções completas em terceirização de frotas para você focar no que realmente importa — o crescimento da sua empresa.
              </p>
              <a href="https://api.whatsapp.com/send?phone=5521993297697&text=Ol%C3%A1,%20Locafacil!%20Quero%20uma%20proposta%20para%20minha%20empresa." target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(37, 99, 235, 0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-brand-accent hover:bg-brand-glow text-white font-bold px-8 py-3.5 rounded-full shadow-glow transition-all duration-300 cursor-pointer"
                >
                  Solicitar Cotação Agora
                </motion.button>
              </a>
            </div>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <img src={Image1} alt="Frota empresarial Locafacil" className="w-full rounded-2xl shadow-card" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4 Motivos */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <span className="inline-block text-brand-accent text-sm font-semibold tracking-widest uppercase mb-3">Vantagens Corporativas</span>
            <h3 className="text-3xl sm:text-4xl font-bold text-text-dark">
              4 motivos para contratar <span className="text-gradient">hoje</span>
            </h3>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="space-y-8"
            >
              {motivos.map((item, i) => (
                <motion.div key={i} variants={fadeInUp} className="flex gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center text-lg font-bold group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-text-dark mb-2">{item.titulo}</h4>
                    <p className="text-text-muted leading-relaxed">{item.descricao}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
            >
              <img src={Image2} alt="Equipe Locafacil Business" className="w-full rounded-2xl shadow-card" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Banner final */}
      <section className="hidden md:block py-8 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.img
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            src={BannerFinal}
            alt="Locafacil Business - Terceirização de Frotas"
            className="w-full rounded-2xl shadow-card"
          />
        </div>
      </section>
    </main>
  )
}